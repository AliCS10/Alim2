
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, X } from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audio';

interface VoiceAssistantProps {
  onNavigate: (page: string) => void;
  onPlayAction: (action: 'play' | 'stop' | 'summary') => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate, onPlayAction }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const toggleAssistant = async () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    setIsActive(false);
    setIsListening(false);
    setIsConnecting(false);
    sourcesRef.current.forEach(s => {
      try {
        s.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    sessionRef.current = null;
  };

  const startSession = async () => {
    setIsConnecting(true);
    // Corrected initialization of GoogleGenAI using process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `أنت "مساعد بصر الذكي". مهمتك هي مساعدة الطلاب المكفوفين وضعاف البصر في جامعة جازان على التنقل في المنصة. 
          تحدث باللغة العربية الفصحى بأسلوب ودود وواضح.
          يمكنك مساعدة المستخدم في:
          1. الانتقال للصفحات: 'landing' (الرئيسية), 'library' (المكتبة), 'details' (تفاصيل المادة).
          2. تشغيل المحاضرات أو إيقافها.
          3. قراءة الملخصات الذكية.
          ابدأ دائماً بتحية المستخدم وإخباره أنك جاهز لمساعدته بالصوت.`,
          tools: [{
            functionDeclarations: [
              {
                name: 'navigateToPage',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    page: { type: Type.STRING, description: 'اسم الصفحة المطلوبة: landing, library, details' }
                  },
                  required: ['page']
                }
              },
              {
                name: 'controlPlayback',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: 'الإجراء: play (تشغيل), stop (إيقاف), summary (ملخص)' }
                  },
                  required: ['action']
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setIsListening(true);
            
            // Stream audio from the microphone to the model
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'navigateToPage') {
                  onNavigate((fc.args as any).page);
                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: { id: fc.id, name: fc.name, response: { result: 'تم الانتقال بنجاح' } }
                    });
                  });
                } else if (fc.name === 'controlPlayback') {
                  onPlayAction((fc.args as any).action);
                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: { id: fc.id, name: fc.name, response: { result: 'تم تنفيذ الأمر الصوتي' } }
                    });
                  });
                }
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try {
                  s.stop();
                } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error('Voice Assistant Error:', e);
            stopSession();
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      alert('يرجى السماح بالوصول للميكروفون لاستخدام المساعد الصوتي.');
    }
  };

  // Keyboard shortcut Alt+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        toggleAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {isActive && (
        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-emerald-100 flex items-center gap-3 animate-slide-up mb-2">
          <div className="flex gap-1 items-end h-6">
            <div className="w-1.5 h-3 bg-[#00C994] rounded-full animate-bounce-custom"></div>
            <div className="w-1.5 h-6 bg-[#00C994] rounded-full animate-bounce-custom [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-4 bg-[#00C994] rounded-full animate-bounce-custom [animation-delay:0.4s]"></div>
          </div>
          <span className="text-sm font-bold text-gray-700">بصر يسمعك الآن...</span>
          <button onClick={stopSession} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      <button
        onClick={toggleAssistant}
        aria-label="تفعيل مساعد بصر الصوتي"
        aria-pressed={isActive}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 border-4 ${
          isActive 
          ? 'bg-red-500 border-red-100 text-white animate-pulse' 
          : 'bg-[#00C994] border-emerald-50 text-white'
        }`}
      >
        {isConnecting ? (
          <Loader2 className="animate-spin" size={32} />
        ) : isActive ? (
          <MicOff size={32} />
        ) : (
          <Mic size={32} />
        )}
      </button>

      <style>{`
        @keyframes bounce-custom {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2); }
        }
        .animate-bounce-custom {
          animation: bounce-custom 0.8s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
};
