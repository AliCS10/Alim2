
import React, { useState } from 'react';
import { Search, Play, Clock, Filter, PlusCircle, GraduationCap, User, Sparkles, BookOpen, LayoutGrid } from 'lucide-react';
import { Course } from '../types';

interface LibraryPageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ courses, onSelectCourse }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'personal'>('enrolled');
  
  const filteredCourses = courses.filter(c => 
    c.category === activeTab &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 px-6 md:px-12 pb-12">
      {/* Welcome Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">أهلاً بك يا بطل 👋</h1>
            <p className="text-gray-500 font-medium">مستعد لمواصلة رحلتك التعليمية اليوم؟</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveTab('enrolled')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'enrolled' ? 'bg-[#00C994] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <GraduationCap size={18} /> المواد المسجلة
            </button>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'personal' ? 'bg-[#00C994] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <BookOpen size={18} /> مكتبتي الخاصة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={`ابحث في ${activeTab === 'enrolled' ? 'المواد المسجلة' : 'مكتبتك الخاصة'}...`}
              className="w-full bg-white border border-gray-100 rounded-[1.5rem] py-4 pr-14 pl-6 text-lg focus:outline-none focus:ring-2 focus:ring-[#00C994] transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          </div>
          <button className="h-14 px-6 bg-white rounded-2xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors border border-gray-100 gap-2 font-bold">
            <Filter size={20} /> تصفية
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00C994] rounded-xl flex items-center justify-center text-white">
               <LayoutGrid size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-800">
              {activeTab === 'enrolled' ? 'المواد المسجلة لهذا الفصل' : 'محتواك الشخصي المولد'}
            </h2>
          </div>
          <span className="text-sm font-bold text-gray-400">{filteredCourses.length} مادة</span>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map(course => (
              <div 
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full"
              >
                <div className="h-44 relative overflow-hidden shrink-0">
                  <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/20 uppercase tracking-widest">
                     {course.level}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-[#00C994] transition-colors line-clamp-1">{course.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={12} />
                      </div>
                      {course.instructor}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} /> {course.duration}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <BookOpen size={14} /> {course.chapters.length} فصول
                      </div>
                    </div>

                    <button className="w-full bg-gray-50 group-hover:bg-[#00C994] group-hover:text-white text-gray-800 py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-sm">
                      <Play size={16} fill="currentColor" /> استمع للمادة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
               {activeTab === 'enrolled' ? <GraduationCap size={40} /> : <PlusCircle size={40} />}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد مواد حالياً</h3>
            <p className="text-gray-400 mb-8">ابدأ بإضافة موادك المفضلة أو ارفع محاضرة جديدة.</p>
            {activeTab === 'personal' && (
              <button className="bg-[#00C994] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">
                ارفع أول محاضرة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
