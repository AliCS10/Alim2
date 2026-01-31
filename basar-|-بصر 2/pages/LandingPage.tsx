
import React from 'react';
import { ArrowLeft, Upload, Link as LinkIcon, Sparkles, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onDiscover: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDiscover }) => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center px-6 pt-32 pb-20">
      {/* Hero Section */}
      <div className="max-w-5xl w-full text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-fade-in">
          <Sparkles size={16} /> مدعوم بأحدث تقنيات Gemini 3 الذكية
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
          حوّل محاضراتك الجامعية إلى <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C994] via-blue-500 to-indigo-500">
            بودكاست تعليمي مذهل
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          بصر يقرأ محاضراتك، يفهمها، ويحولها إلى تجربة صوتية تفاعلية مقسمة لمواضيع قصيرة تساعدك على المذاكرة بذكاء.
        </p>

        {/* Dynamic Action Zone */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <div 
            onClick={onStart}
            className="group cursor-pointer bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-dashed border-emerald-100 hover:border-[#00C994] transition-all hover:scale-[1.02]"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#00C994] mb-6 group-hover:bg-[#00C994] group-hover:text-white transition-colors">
              <Upload size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-right">ارفع محاضرة الآن</h3>
            <p className="text-gray-500 text-right">PDF، PowerPoint، أو تسجيل صوتي من القاعة.</p>
          </div>

          <div 
            onClick={onDiscover}
            className="group cursor-pointer bg-gray-900 p-8 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-all"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-[#00C994] transition-colors">
              <BookOpen size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 text-right">تصفح المكتبة</h3>
            <p className="text-gray-400 text-right">اطلع على المواد التي تم تحويلها مسبقاً.</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group relative bg-[#00C994] hover:bg-[#00b383] text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
        >
          جرب الرفع الذكي مجاناً
          <ArrowLeft className="group-hover:-translate-x-2 transition-transform" size={28} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full">
        {[
          { label: 'بودكاست تفاعلي', icon: '🎧', desc: 'شرح ممتع' },
          { label: 'تقسيم موضوعي', icon: '📑', desc: 'سهولة الوصول' },
          { label: 'دعم المكفوفين', icon: '🦯', desc: 'تجربة صوتية كاملة' },
          { label: 'جامعة جازان', icon: '🎓', desc: 'دعم كامل للنظام' }
        ].map((feat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all text-center border border-white/50">
            <div className="text-4xl mb-3">{feat.icon}</div>
            <div className="font-bold text-gray-800 mb-1">{feat.label}</div>
            <div className="text-xs text-gray-500">{feat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
