
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LibraryPage from './pages/LibraryPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import UploadPage from './pages/UploadPage';
import { Course } from './types';
import Logo from './components/Logo';
import { MOCK_COURSES } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'library' | 'details' | 'upload'>('landing');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentPage('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewUpload = (newCourse: Course) => {
    setCourses([newCourse, ...courses]);
    setSelectedCourse(newCourse);
    setCurrentPage('details');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      
      <main className="transition-opacity duration-300">
        {currentPage === 'landing' && (
          <LandingPage onStart={() => handleNavigate('upload')} onDiscover={() => handleNavigate('library')} />
        )}
        
        {currentPage === 'library' && (
          <LibraryPage courses={courses} onSelectCourse={handleCourseSelect} />
        )}

        {currentPage === 'upload' && (
          <UploadPage onBack={() => handleNavigate('library')} onUploadComplete={handleNewUpload} />
        )}
        
        {currentPage === 'details' && selectedCourse && (
          <CourseDetailsPage 
            course={selectedCourse} 
            onBack={() => handleNavigate('library')}
          />
        )}
      </main>

      {/* Persistent Mini Player */}
      {selectedCourse && currentPage !== 'details' && currentPage !== 'upload' && (
        <div 
          onClick={() => setCurrentPage('details')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg glass-card p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-slide-up border border-emerald-100 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <img src={selectedCourse.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
          <div className="flex-1 overflow-hidden">
            <h5 className="font-bold text-sm truncate">{selectedCourse.title}</h5>
            <p className="text-xs text-gray-500 truncate">بودكاست قيد التشغيل</p>
          </div>
          <button className="w-10 h-10 bg-[#00C994] text-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xl">▶</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 py-10 px-6 border-t mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black text-gray-900 tracking-tight">Basar | بصر</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center">© 2024 بصر. جميع الحقوق محفوظة لجامعة جازان.</p>
          <div className="flex gap-6">
             <span className="text-gray-400 hover:text-[#00C994] cursor-pointer transition-colors text-sm font-medium">تويتر</span>
             <span className="text-gray-400 hover:text-[#00C994] cursor-pointer transition-colors text-sm font-medium">لينكد إن</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
