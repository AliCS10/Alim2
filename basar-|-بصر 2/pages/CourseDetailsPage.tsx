
import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, Share2, HelpCircle, FileText, Download, Bookmark, GraduationCap, Sparkles, Brain, Info, Loader2, RotateCcw, ArrowLeft, Mic2, User, UserCheck, ChevronDown, ChevronUp, Headphones, ArrowDown, ListChecks, Clock } from 'lucide-react';
import { Course, Topic } from '../types';
import AudioPlayer from '../components/AudioPlayer';
// Correctly import GoogleGenAI and GenerateContentResponse according to guidelines
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { decodeBase64, decodeAudioData, withRetry } from '../utils/audio';

interface VoiceOption {
  id: string;
  name: string;
  label: string;
  description: string;
  gender: 'male' | 'female';
}

const VOICES: Record<'male' | 'female', VoiceOption> = {
  male: { id: 'Fenrir', name: 'الأستاذ عمر', label: 'عميق وواضح', description: 'صوت رجالي هادئ للمراجعة', gender: 'male' },
  female: { id: 'Zephyr', name: 'الأستاذة سارة', label: 'ودودة ومتفاعلة', description: 'صوت نسائي حيوي ومحفز', gender: 'female' }
};

interface CourseDetailsPageProps {
  course: Course;
  onBack: () => void;
}

const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'quiz'>('content');
  const [showTooltip, setShowTooltip] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isPlayingOverview, setIsPlayingOverview] = useState(false);
  const [overviewFinished, setOverviewFinished] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([course.chapters[0]?.id]));
  
  const [userGender, setUserGender] = useState<'male' | 'female'>('male');
  const selectedVoice = VOICES[userGender];
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const stopCurrentAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setIsPlayingOverview(false);
    setActiveTopic(null);
  };

  const toggleChapter = (id: string) => {
    const next = new Set(expandedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedChapters(next);
  };

  const scrollToChapters = () => {
    chaptersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStartOverview = async () => {
    if (isAiThinking) return;
    stopCurrentAudio();
    setIsAiThinking(true);
    setOverviewFinished(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `اقرأ الملخص التالي بأسلوب ${selectedVoice.label}: مادة ${course.title}. ${course.smartSummary}`;

      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice.id } } }
        }
      }));

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;
      
      if (base64Audio) {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setOverviewFinished(true);
          setIsPlayingOverview(false);
          sourceNodeRef.current = null;
        };
        sourceNodeRef.current = source;
        setIsAiThinking(false);
        setIsPlayingOverview(true);
        source.start(0);
      } else {
        throw new Error("No audio data received");
      }
    } catch (error) {
      console.error("TTS Overview Error:", error);
      setIsAiThinking(false);
      alert("عذراً، الخادم مضغوط حالياً أو انتهت الحصة المتاحة. يرجى المحاولة بعد قليل.");
    }
  };

  const playTopic = async (topic: Topic) => {
    stopCurrentAudio();
    setActiveTopic(topic);
    
    const audioData = topic.audioUrl;
    if (audioData) {
      try {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decodeBase64(audioData), audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setActiveTopic(null);
          sourceNodeRef.current = null;
        };
        sourceNodeRef.current = source;
        source.start(0);
      } catch (err) {
        console.error("Error playing topic audio:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
        <div className="flex-1">
          <button onClick={() => { stopCurrentAudio(); onBack(); }} className="flex items-center gap-2 text-[#00C994] font-bold mb-8 hover:-translate-x-1 transition-transform group">
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /> العودة للمكتبة
          </button>

          {/* AI Overview Component with Enhanced Flow Buttons */}
          <div className="mb-12 relative">
            <div className={`transition-all duration-700 rounded-[3rem] p-10 flex flex-col items-center justify-between gap-10 shadow-2xl border-4 ${
              isPlayingOverview 
                ? 'bg-[#00C994] text-white border-white/20 ring-8 ring-[#00C994]/10' 
                : overviewFinished 
                  ? 'bg-emerald-50 border-[#00C994] text-[#064e3b] ring-8 ring-emerald-500/5' 
                  : 'bg-gradient-to-r from-emerald-50 via-white to-indigo-50 border-emerald-100'
            }`}>
              <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 shrink-0 ${
                    isPlayingOverview 
                      ? 'bg-white text-[#00C994] scale-110 rotate-3' 
                      : overviewFinished 
                        ? 'bg-[#00C994] text-white scale-100'
                        : 'bg-gradient-to-tr from-[#00C994] to-blue-500 text-white animate-pulse'
                  }`}>
                    {isPlayingOverview ? <Sparkles size={48} className="animate-spin-slow" /> : overviewFinished ? <ListChecks size={48} /> : <Brain size={48} />}
                  </div>
                  <div>
                    <h3 className={`text-3xl font-black mb-2 ${isPlayingOverview || overviewFinished ? 'text-inherit' : 'text-gray-900'}`}>
                      {isPlayingOverview 
                        ? `${selectedVoice.name} يشرح لك... 🎙️` 
                        : overviewFinished 
                          ? 'اكتمل الملخص بنجاح!' 
                          : 'ملخص بصر الذكي ✨'}
                    </h3>
                    <p className={`text-lg font-medium ${isPlayingOverview ? 'text-emerald-50' : 'text-gray-500'}`}>
                      {isPlayingOverview 
                        ? `بصوت ${selectedVoice.label}` 
                        : overviewFinished 
                          ? 'لقد حصلت على الأساسيات. هل تريد التعمق في التفاصيل؟' 
                          : 'استمع لشرح سريع وشامل للمادة في دقيقتين'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-5 items-center">
                  {!overviewFinished && !isPlayingOverview && (
                    <button 
                      onClick={handleStartOverview} 
                      disabled={isAiThinking} 
                      className="bg-[#00C994] text-white px-10 py-5 rounded-2xl text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all min-w-[220px] flex items-center justify-center gap-3"
                    >
                      {isAiThinking ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" size={24} /> ابدأ الاستماع</>}
                    </button>
                  )}

                  {isPlayingOverview && (
                    <button 
                      onClick={stopCurrentAudio} 
                      className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-2xl text-lg font-black transition-all border border-white/30"
                    >
                      إيقاف مؤقت
                    </button>
                  )}
                </div>
              </div>

              {/* Final Flow Buttons - Visible after audio finishes */}
              {overviewFinished && !isPlayingOverview && (
                <div className="w-full pt-8 border-t border-[#00C994]/20 flex flex-col sm:flex-row justify-center items-center gap-6 animate-slide-up">
                  <button 
                    onClick={handleStartOverview} 
                    className="flex items-center gap-3 text-[#00C994] hover:text-[#00b383] font-black text-lg py-4 px-8 rounded-2xl bg-white border-2 border-[#00C994]/20 hover:border-[#00C994] transition-all hover:-translate-y-1"
                  >
                    <RotateCcw size={22} /> إعادة الاستماع للملخص
                  </button>
                  
                  <button 
                    onClick={scrollToChapters} 
                    className="flex items-center gap-3 bg-[#00C994] hover:bg-[#00b383] text-white font-black text-xl py-5 px-12 rounded-3xl shadow-[0_20px_50px_rgba(0,201,148,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    بدء التعلم التفصيلي <ArrowDown size={24} className="animate-bounce" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 mb-12 items-start">
            <div className="relative shrink-0">
              <img src={course.image} className="w-56 h-56 rounded-[2.5rem] shadow-2xl object-cover border-8 border-white" alt={course.title} />
              <div className="absolute -bottom-4 -left-4 bg-orange-400 text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg uppercase tracking-tighter">
                {course.category === 'enrolled' ? 'رسمي' : 'شخصي'}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                 <span className="bg-emerald-50 text-[#00C994] px-3 py-1 rounded-lg text-[10px] font-black uppercase">{course.level}</span>
                 <span className="text-gray-300">•</span>
                 <span className="text-gray-500 text-xs font-bold">{course.university}</span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 mb-2 leading-tight">مادة {course.title}</h1>
              <div className="flex items-center gap-2 text-gray-500 font-bold mb-8">
                 <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User size={14} />
                 </div>
                 تحت إشراف {course.instructor}
              </div>
              
              <div className="flex flex-wrap gap-4">
                 <span className="bg-emerald-50 text-[#00C994] px-4 py-2 rounded-xl font-bold border border-emerald-100 flex items-center gap-2 text-sm">
                   <FileText size={18} /> {course.chapters.length} فصول
                 </span>
                 <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold border border-blue-100 flex items-center gap-2 text-sm">
                   <Headphones size={18} /> استماع تفاعلي
                 </span>
              </div>
            </div>
          </div>

          <div id="chapters-list" ref={chaptersRef} className="bg-gray-50/50 rounded-[3rem] p-10 mb-12 border border-gray-100 scroll-mt-24 shadow-inner">
            <h2 className="text-3xl font-black text-gray-800 mb-10 flex items-center gap-4">
               <div className="w-12 h-12 bg-[#00C994] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <ListChecks size={24} />
               </div>
               منهج البودكاست التعليمي
            </h2>
            <div className="space-y-8">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                   <button 
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
                   >
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 text-[#00C994] rounded-[1.2rem] flex items-center justify-center font-black text-xl group-hover:bg-[#00C994] group-hover:text-white transition-all">
                           {course.chapters.indexOf(chapter) + 1}
                        </div>
                        <div className="text-right">
                          <h3 className="text-2xl font-black text-gray-800 mb-1">{chapter.title}</h3>
                          <p className="text-sm text-gray-400 font-bold">{chapter.topics.length} مواضيع فرعية</p>
                        </div>
                     </div>
                     {expandedChapters.has(chapter.id) ? <ChevronUp size={28} className="text-[#00C994]" /> : <ChevronDown size={28} className="text-gray-300" />}
                   </button>
                   
                   {expandedChapters.has(chapter.id) && (
                     <div className="px-8 pb-8 pt-2 space-y-4 animate-fade-in">
                       {chapter.topics && chapter.topics.length > 0 ? chapter.topics.map(topic => (
                         <div 
                          key={topic.id}
                          onClick={() => playTopic(topic)}
                          className={`p-6 rounded-[1.8rem] flex items-center justify-between cursor-pointer transition-all border-2 ${
                            activeTopic?.id === topic.id 
                            ? 'bg-emerald-50 border-[#00C994] shadow-lg shadow-emerald-500/10 scale-[1.01]' 
                            : 'bg-gray-50 border-transparent hover:border-emerald-100 hover:bg-white'
                          }`}
                         >
                           <div className="flex items-center gap-6">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTopic?.id === topic.id ? 'bg-[#00C994] text-white rotate-12' : 'bg-gray-200 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'}`}>
                               <Play size={20} fill="currentColor" />
                             </div>
                             <div>
                               <h4 className="font-black text-gray-800 text-lg mb-1">{topic.title}</h4>
                               <p className="text-xs text-gray-400 font-bold flex items-center gap-2">
                                  <Clock size={12} /> مدة الشرح: {topic.duration}
                               </p>
                             </div>
                           </div>
                           
                           {topic.audioUrl ? (
                             <div className="hidden sm:block text-[#00C994] font-black text-sm px-4 py-2 bg-emerald-100 rounded-xl">متاح صوتياً</div>
                           ) : (
                             <div className="hidden sm:block text-orange-400 font-black text-sm px-4 py-2 bg-orange-50 rounded-xl">نصي فقط</div>
                           )}
                         </div>
                       )) : (
                         <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                           <Loader2 className="animate-spin text-gray-300 mx-auto mb-4" size={32} />
                           <p className="text-sm text-gray-400 italic">يتم تنظيم المواضيع لهذا الفصل...</p>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-96">
          <AudioPlayer 
            courseTitle={course.title} 
            chapterTitle={isPlayingOverview ? `${selectedVoice.name}: نظرة شاملة` : activeTopic ? activeTopic.title : "اختر موضوعاً للاستماع"} 
            imageUrl={course.image} 
            isAiOverview={isPlayingOverview || !!activeTopic} 
          />
          <div className="mt-8 bg-[#064e3b] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C994]/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
             <Sparkles className="mb-6 text-[#00C994]" size={32} />
             <h4 className="text-xl font-black mb-4 text-right">نصيحة المذاكرة:</h4>
             <p className="text-lg text-emerald-100 leading-relaxed text-right font-medium">
               أثبتت الدراسات أن الاستماع للمحتوى أثناء المشي الخفيف يزيد من معدل التركيز بنسبة 30%. جرب المشي قليلاً في غرفتك!
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
