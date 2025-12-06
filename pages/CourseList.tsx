
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Flag, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const CourseList: React.FC = () => {
  const { courses } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(c => 
    c.name.includes(searchTerm) || c.address.includes(searchTerm)
  );

  // Helper to get a consistent placeholder gradient based on ID
  const getGradient = (id: string) => {
      const colors = [
          'from-emerald-500 to-teal-700',
          'from-green-600 to-emerald-800',
          'from-teal-500 to-cyan-700',
          'from-lime-600 to-green-800'
      ];
      const index = id.charCodeAt(id.length - 1) % colors.length;
      return colors[index];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">골프장 찾기</h1>
            <p className="text-slate-500 text-sm">등록된 골프장의 현황과 상세 정보를 조회합니다.</p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="골프장 명, 주소 검색..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <Link to={`/courses/${course.id}`} key={course.id} className="block group h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
              {/* Card Header / Image Placeholder */}
              <div className={`h-32 bg-gradient-to-r ${getGradient(course.id)} p-6 flex flex-col justify-end relative`}>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                      {course.type}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{course.name}</h3>
                  <div className="flex items-center text-white/80 text-xs mt-1">
                      <MapPin size={12} className="mr-1" /> {course.address}
                  </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <div className="text-center px-4 border-r border-slate-100 flex-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">홀 수</div>
                        <div className="text-lg font-bold text-slate-700">{course.holes}</div>
                    </div>
                    <div className="text-center px-4 flex-1">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">잔디</div>
                        <div className="text-lg font-bold text-slate-700">{course.grassType.split('(')[0]}</div>
                    </div>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-grow">
                  {course.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                    {course.issues && course.issues.length > 0 ? (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded flex items-center">
                            ! 이슈 {course.issues.length}건
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center">
                            정상 운영
                        </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 group-hover:text-brand-600 flex items-center transition-colors">
                        상세보기 <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1"/>
                    </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {filteredCourses.length === 0 && (
           <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <Search size={40} className="mx-auto mb-4 text-slate-300" />
             <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
