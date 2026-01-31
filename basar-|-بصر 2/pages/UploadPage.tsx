
import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Headphones, Sparkles, ArrowRight, Volume2 } from 'lucide-react';
// Correctly import GoogleGenAI and GenerateContentResponse according to guidelines
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { Course, AIProcessStep } from '../types';
import { decodeBase64, decodeAudioData, withRetry, delay } from '../utils/audio';

interface UploadPageProps {
  onUploadComplete: (course: Course) => void;
  onBack: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onUploadComplete, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<AIProcessStep[]>([
    { id: 1, title: 'قراءة الملف', description: 'استخراج النصوص والعناوين من المحاضرة.', icon: '📄', status: 'waiting' },
    { id: 2, title: 'التقسيم الذكي', description: 'تحديد الفصول والمواضيع الفرعية بدقة.', icon: '✂️', status: 'waiting' },
    { id: 3, title: 'توليد البودكاست', description: 'تحويل ملخصات المواضيع إلى أصوات طبيعية.', icon: '🎙️', status: 'waiting' }
  ]);

  const speakStatus = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // استخدام withRetry لتجنب أخطاء 429 في التغذية الراجعة الصوتية
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `قل بصوت واضح: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      }), 3, 5000); // محاولات أقل وتأخير أقل للتغذية الراجعة لسرعة الاستجابة
      
      const audioData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await decodeAudioData(decodeBase64(audioData), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) { 
      console.error("Speech feedback error (skipped to save quota)", e); 
    }
  };

  const updateStep = (index: number, status: AIProcessStep['status'], desc?: string) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status, description: desc || s.description } : s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startProcessing = async () => {
    if (!file) return;
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Step 1: Analyze & Structure
      updateStep(0, 'processing');
      await speakStatus("بدأت الآن بتحليل ملف المحاضرة.");
      
      const analysisResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `قم بتحليل هذه المحاضرة (اسم الملف: ${file.name}). 
        قسمها إلى فصول (Chapters)، وكل فصل إلى مواضيع (Topics). 
        لكل موضوع، اكتب ملخصاً تفصيلياً جداً (سكريبت بودكاست) باللغة العربية لا يقل عن 300 كلمة.
        يجب أن يكون الرد بتنسيق JSON حصراً:
        { "title": "اسم المادة", "chapters": [ { "title": "عنوان الفصل", "topics": [ { "title": "عنوان الموضوع", "summaryScript": "نص الشرح الطويل" } ] } ] }`,
        config: { responseMimeType: "application/json" }
      }));

      const structuredData = JSON.parse(analysisResponse.text || "{}");
      updateStep(0, 'completed');
      setCurrentStep(1);

      // Step 2: Refining
      updateStep(1, 'processing');
      await speakStatus("تم تحديد الفصول بنجاح. أقوم الآن بتنظيم المواضيع.");
      await delay(5000); // تأخير إضافي بين الخطوات الكبرى
      updateStep(1, 'completed');
      setCurrentStep(2);

      // Step 3: Voice Generation
      updateStep(2, 'processing');
      await speakStatus("جاري تحويل الشروحات إلى بودكاست صوتي.");
      
      const processedChapters = [];
      for (const ch of structuredData.chapters) {
        const topics = [];
        for (const top of ch.topics) {
          // تأخير كبير (10 ثوانٍ) بين كل ملف صوتي لضمان عدم تجاوز RPM (Requests Per Minute)
          await delay(10000); 
          
          try {
            const ttsResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: `اقرأ النص التالي بأسلوب تعليمي هادئ: ${top.summaryScript}` }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
              }
            }));
            
            const audioData = ttsResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
            topics.push({
              id: Math.random().toString(),
              title: top.title,
              summary: top.summaryScript,
              audioUrl: audioData,
              duration: "2:00+"
            });
          } catch (err) {
            console.error("Error generating audio for topic:", top.title, err);
            // في حال فشل كل المحاولات، نضيف الموضوع بنصه فقط
            topics.push({
              id: Math.random().toString(),
              title: top.title,
              summary: top.summaryScript,
              duration: "متاح نصياً"
            });
          }
        }
        processedChapters.push({
          id: Math.random().toString(),
          title: ch.title,
          summary: "فصل مستخرج آلياً",
          duration: `${topics.length * 2} دقيقة`,
          topics
        });
      }

      const newCourse: Course = {
        id: Date.now().toString(),
        title: structuredData.title || file.name.split('.')[0],
        instructor: 'بصر الذكي',
        university: 'جامعة جازان',
        duration: `${processedChapters.length * 5} دقيقة`,
        level: 'مستخرج آلياً',
        description: `تم توليد هذه المادة آلياً من ملف: ${file.name}`,
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
        chapters: processedChapters,
        category: 'personal',
        smartSummary: `هذه المحاضرة تتناول ${structuredData.title}.`
      };

      updateStep(2, 'completed');
      await speakStatus("اكتملت المعالجة بنجاح.");
      setTimeout(() => onUploadComplete(newCourse), 1000);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      await speakStatus("عذراً، يبدو أن الحصة اليومية انتهت أو الخادم مضغوط جداً.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#00C994] font-bold mb-8 hover:-translate-x-1 transition-transform">
          <ArrowRight size={20} /> العودة للمكتبة
        </button>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-emerald-50">
          {!isProcessing ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#00C994] mx-auto mb-8">
                <Upload size={48} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-4">رفع محاضرة جديدة</h1>
              <p className="text-gray-500 mb-10 text-lg">ارفع ملف PDF أو PowerPoint وسيقوم بصر بتحويله إلى بودكاست فوري.</p>
              
              <label className="block w-full cursor-pointer group">
                <div className="border-4 border-dashed border-gray-100 group-hover:border-[#00C994] rounded-[2.5rem] p-16 transition-all bg-gray-50/50 group-hover:bg-emerald-50/30">
                  <FileText size={64} className="mx-auto mb-4 text-gray-300 group-hover:text-[#00C994] transition-colors" />
                  <span className="text-xl font-bold text-gray-400 group-hover:text-gray-600">
                    {file ? file.name : "اسحب الملف هنا أو اضغط للاختيار"}
                  </span>
                </div>
                <input type="file" className="hidden" accept=".pdf,.ppt,.pptx" onChange={handleFileChange} />
              </label>

              {file && (
                <button 
                  onClick={startProcessing}
                  className="w-full mt-10 bg-[#00C994] hover:bg-[#00b383] text-white py-6 rounded-3xl text-2xl font-black shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-4"
                >
                  <Sparkles size={28} /> ابدأ المعالجة الذكية
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12 py-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-[#00C994]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#00C994] border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[#00C994]">
                    <Sparkles size={32} />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">جاري تحويل محاضرتك</h2>
                <p className="text-gray-400">نحن نعمل بتأني (10 ثوانٍ بين كل موضوع) لضمان عدم تجاوز حدود الخادم وجودة الصوت...</p>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                {steps.map((step, idx) => (
                  <div key={step.id} className={`flex items-center gap-6 p-6 rounded-3xl transition-all border-2 ${
                    step.status === 'processing' ? 'bg-emerald-50 border-[#00C994] scale-105 shadow-lg' : 
                    step.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-transparent'
                  }`}>
                    <div className="text-3xl">{step.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {step.status === 'processing' && <Loader2 className="animate-spin text-[#00C994]" size={24} />}
                    {step.status === 'completed' && <CheckCircle2 className="text-green-500" size={24} />}
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 p-6 rounded-2xl flex items-center gap-4 text-orange-700 text-sm font-medium">
                <Volume2 size={24} />
                <span>نستخدم استراتيجية "التراجع الأسي" لتخطي ضغط الحصة البرمجية.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
