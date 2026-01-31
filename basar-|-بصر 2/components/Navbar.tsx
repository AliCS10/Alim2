
import React from 'react';
import Logo from './Logo';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card px-6 py-3 flex justify-between items-center shadow-sm">
      <div 
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => onNavigate('landing')}
      >
        <div className="transition-transform duration-300 group-hover:scale-105 shrink-0">
          <Logo size={32} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black text-gray-800 tracking-tight">Basar</span>
          <span className="text-[11px] font-bold text-[#00C994] -mt-0.5">بصر</span>
        </div>
      </div>
      
      <div className="flex gap-6 md:gap-8 text-gray-600 font-medium items-center">
        <button 
          onClick={() => onNavigate('library')}
          className={`text-sm md:text-base hover:text-[#00C994] transition-colors whitespace-nowrap ${currentPage === 'library' ? 'text-[#00C994] font-bold' : ''}`}
        >
          المواد
        </button>
        <button 
          onClick={() => onNavigate('landing')}
          className={`text-sm md:text-base hover:text-[#00C994] transition-colors whitespace-nowrap ${currentPage === 'landing' ? 'text-[#00C994] font-bold' : ''}`}
        >
          عن المنصة
        </button>
        <button 
          className="bg-[#00C994] hover:bg-[#00b383] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap hidden sm:block"
          onClick={() => onNavigate('library')}
        >
          ابدأ الآن
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
