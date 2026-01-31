
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Repeat, Shuffle, Volume2, ListMusic, Gauge, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  courseTitle: string;
  chapterTitle: string;
  imageUrl: string;
  isAiOverview?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ courseTitle, chapterTitle, imageUrl, isAiOverview = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  // إعادة ضبط الحالة عند تغير نوع التشغيل
  useEffect(() => {
    setIsPlaying(isAiOverview);
    setProgress(0);
  }, [isAiOverview]);

  // محاكاة التقدم الصوتي
  useEffect(() => {
    let interval: any;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIndex]);
  };

  return (
    <div className={`text-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-sm sticky top-24 mx-auto md:mx-0 border transition-all duration-700 ${
      isAiOverview 
      ? 'bg-gradient-to-br from-[#064e3b] via-[#00C994] to-[#064e3b] border-[#34d399]/50 shadow-[#00C994]/30 ring-4 ring-[#00C994]/10' 
      : 'bg-[#121212] border-white/5 shadow-black/40'
    }`}>
      <div className="flex flex-col gap-6">
        <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl group">
          <img 
            src={imageUrl} 
            alt={courseTitle} 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isAiOverview ? 'brightness-75' : ''}`} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {isAiOverview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-2 border-white/20 rounded-full animate-ping absolute"></div>
              <div className="w-24 h-24 border-2 border-emerald-400/40 rounded-full animate-pulse absolute"></div>
              <Sparkles className="text-white relative z-10" size={48} />
            </div>
          )}

          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg backdrop-blur-md ${
            isAiOverview ? 'bg-emerald-900/80 text-white' : 'bg-white/10 text-gray-300'
          }`}>
            {isAiOverview ? <><Sparkles size={12} /> AI PERSONALITY</> : 'NORMAL MODE'}
          </div>
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-xl font-bold truncate tracking-tight">{courseTitle}</h3>
            <p className={`text-sm truncate transition-all duration-500 font-medium ${
              isAiOverview ? 'text-emerald-100 drop-shadow-sm' : 'text-gray-400'
            }`}>
              {chapterTitle}
            </p>
          </div>
          <button className={`transition-colors shrink-0 ${isAiOverview ? 'text-emerald-200 hover:text-pink-400' : 'text-gray-400 hover:text-pink-500'}`}>
            <Heart size={24} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="relative h-2 w-full bg-black/40 rounded-full overflow-hidden cursor-pointer group">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full ${
                isAiOverview 
                ? 'bg-gradient-to-r from-emerald-200 via-white to-emerald-200' 
                : 'bg-gradient-to-r from-[#00C994] to-emerald-400'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
            {/* Glossy overlay for AI mode */}
            {isAiOverview && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>}
          </div>
          <div className={`flex justify-between text-[11px] font-bold tracking-wider ${isAiOverview ? 'text-emerald-100/80' : 'text-gray-500'}`}>
            <span>{Math.floor((progress * 90) / 100 / 60)}:{String(Math.floor((progress * 90) / 100 % 60)).padStart(2, '0')}</span>
            <span>1:30</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <button 
            onClick={toggleSpeed}
            className={`flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full transition-colors ${
              isAiOverview ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'
            }`}
          >
            {speed}x <Gauge size={14} />
          </button>
          
          <div className="flex items-center gap-6">
            <button className="text-white/70 hover:text-white hover:scale-110 transition-all"><SkipForward className="rotate-180" size={24} /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl ${
                isAiOverview 
                ? 'bg-white text-emerald-900 shadow-emerald-600/40' 
                : 'bg-white text-black shadow-white/30'
              }`}
            >
              {isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-1" />}
            </button>
            <button className="text-white/70 hover:text-white hover:scale-110 transition-all"><SkipForward size={24} /></button>
          </div>

          <button className={`transition-colors ${isAiOverview ? 'text-emerald-300 hover:text-white' : 'text-gray-500 hover:text-white'}`}>
            <Repeat size={18} />
          </button>
        </div>

        <div className={`flex items-center justify-between mt-4 pt-6 border-t ${isAiOverview ? 'border-white/10' : 'border-white/5'}`}>
          <button className={`flex items-center gap-2 transition-colors text-xs font-bold ${
            isAiOverview ? 'text-emerald-200 hover:text-white' : 'text-gray-400 hover:text-white'
          }`}>
            <ListMusic size={18} />
            <span>قائمة التشغيل</span>
          </button>
          <div className="flex items-center gap-3 opacity-60">
            <Volume2 size={18} />
            <div className={`w-20 h-1 rounded-full relative overflow-hidden ${isAiOverview ? 'bg-white/10' : 'bg-gray-800'}`}>
              <div className={`absolute top-0 left-0 w-1/2 h-full ${isAiOverview ? 'bg-emerald-400' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
