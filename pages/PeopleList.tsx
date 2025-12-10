
import React, { useState } from 'react';
import { MOCK_PEOPLE, MOCK_COURSES } from '../constants';
import { Search, User, Briefcase, Phone } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const PeopleList: React.FC = () => {
  const { navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPeople = MOCK_PEOPLE.filter(p => 
    p.name.includes(searchTerm) || p.currentRole.includes(searchTerm)
  );

  const getCourseName = (id?: string) => {
    return MOCK_COURSES.find(c => c.id === id)?.name || '소속 불명';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">인물 검색</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="이름, 직책 검색..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPeople.map(person => (
          <div 
            key={person.id} 
            onClick={() => navigate(`/people/${person.id}`)}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:border-brand-500 transition-colors flex items-start space-x-4 cursor-pointer"
          >
            <div className="bg-slate-100 p-3 rounded-full">
              <User size={24} className="text-slate-500" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900">{person.name}</h3>
                      <p className="text-brand-600 font-medium text-sm">{person.currentRole} <span className="text-slate-400 mx-1">|</span> {getCourseName(person.currentCourseId)}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${person.affinity > 0 ? 'bg-green-500' : person.affinity < 0 ? 'bg-red-500' : 'bg-gray-300'}`} title="친밀도"></div>
              </div>
              
              <div className="mt-3 space-y-1">
                 <div className="flex items-center text-sm text-slate-500">
                   <Phone size={14} className="mr-2" /> {person.phone}
                 </div>
                 <div className="flex items-center text-sm text-slate-500">
                   <Briefcase size={14} className="mr-2" /> 이전 근무지: {person.careers.length}곳
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleList;
