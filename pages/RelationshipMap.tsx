
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { AffinityLevel } from '../types';
import { Share2, Search, Calendar, Crown, Filter, History, Briefcase, MapPin, RefreshCcw, UserCheck, UserMinus, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const RelationshipMap: React.FC = () => {
  const { courses, people } = useApp();
  const [filterAffinity, setFilterAffinity] = useState<AffinityLevel | 'ALL'>('ALL');
  const [filterDept, setFilterDept] = useState<'ALL' | 'MANAGEMENT' | 'COURSE' | 'OPERATIONS' | 'OTHER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CURRENT' | 'PAST'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNode, setHoveredNode] = useState<{ type: 'PERSON' | 'COURSE', id: string } | null>(null);

  // Helper to calculate tenure
  const getTenure = (startDate?: string, endDate?: string) => {
    if (!startDate) return '기간 미상';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) return `${years}년 ${months}개월`;
    return `${months}개월`;
  };

  // Helper to detect department category based on role name
  const getDepartmentCategory = (role: string) => {
    const r = role.replace(/\s/g, '').toLowerCase();
    // 1. Course Management (Technical/Field)
    if (r.match(/코스|잔디|그린|조경|시설|설비|장비|조경|키퍼|슈퍼|course|green|turf/)) return 'COURSE';
    // 2. Top Management (Executive)
    if (r.match(/지배인|대표|이사|사장|회장|전무|상무|본부장|ceo|cfo|executive|director/)) return 'MANAGEMENT';
    // 3. Operations / Business (General)
    if (r.match(/운영|경기|지원|프론트|예약|마케팅|영업|식음|서비스|캐디|매니저|sales|operation|front/)) return 'OPERATIONS';
    
    return 'OTHER';
  };

  // 1. Prepare Connections (Edges)
  // We need to map: Course <-> Person (Current) AND Course <-> Person (Past)
  const connections = useMemo(() => {
    const list: { 
      courseId: string; 
      personId: string; 
      personName: string; 
      personRole: string; 
      personAffinity: AffinityLevel; 
      startDate?: string;
      endDate?: string;
      type: 'CURRENT' | 'PAST'; 
      deptCategory: string;
    }[] = [];

    people.forEach(p => {
      // Global Filters (Affinity & Search) - Applied to the person
      const matchAffinity = filterAffinity === 'ALL' || p.affinity === filterAffinity;
      const matchSearch = searchTerm === '' || p.name.includes(searchTerm) || p.currentRole.includes(searchTerm);

      if (matchAffinity && matchSearch) {
        // 1. Check Current Role
        if (p.currentCourseId && (filterStatus === 'ALL' || filterStatus === 'CURRENT')) {
           const currentDept = getDepartmentCategory(p.currentRole);
           const matchCurrentDept = filterDept === 'ALL' || currentDept === filterDept;
           
           if (matchCurrentDept) {
             list.push({
                courseId: p.currentCourseId,
                personId: p.id,
                personName: p.name,
                personRole: p.currentRole,
                personAffinity: p.affinity,
                startDate: p.currentRoleStartDate,
                type: 'CURRENT',
                deptCategory: currentDept
             });
           }
        }

        // 2. Check Past Roles
        if (filterStatus === 'ALL' || filterStatus === 'PAST') {
            p.careers.forEach(career => {
                if (career.courseId) {
                    const pastDept = getDepartmentCategory(career.role);
                    const matchPastDept = filterDept === 'ALL' || pastDept === filterDept;

                    if (matchPastDept) {
                        list.push({
                            courseId: career.courseId,
                            personId: p.id,
                            personName: p.name,
                            personRole: career.role,
                            personAffinity: p.affinity, // Affinity is person-level
                            startDate: career.startDate,
                            endDate: career.endDate,
                            type: 'PAST',
                            deptCategory: pastDept
                        });
                    }
                }
            });
        }
      }
    });
    return list;
  }, [people, filterAffinity, filterDept, filterStatus, searchTerm]);

  // Group by Course for the Hub View
  const hubData = useMemo(() => {
    return courses.map(c => {
      const related = connections.filter(conn => conn.courseId === c.id);
      return {
        ...c,
        people: related
      };
    }).filter(c => c.people.length > 0);
  }, [courses, connections]);

  // Calculate Layout Metrics
  const centerX = 400;
  const centerY = 350;
  const hubRadius = 220; // Distance of courses from center

  const getAffinityColor = (level: AffinityLevel) => {
      if(level >= 1) return '#16a34a'; // Green (Ally)
      if(level <= -1) return '#dc2626'; // Red (Hostile)
      return '#64748b'; // Slate (Neutral)
  };

  const resetFilters = () => {
      setFilterAffinity('ALL');
      setFilterDept('ALL');
      setFilterStatus('ALL');
      setSearchTerm('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                 <Share2 className="mr-2 text-brand-600" /> 인물 관계도 (Network Map)
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                골프장별 인물 배치와 근무 이력을 시각화하여 핵심 라인을 파악합니다.
              </p>
           </div>
           
           {/* Search */}
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="이름 또는 직책 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all"
              />
           </div>
        </div>
        
        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
           <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
               
               {/* Status Filter */}
               <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                       <History size={10} className="mr-1"/> 근무 상태
                   </label>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      {[
                          { k: 'ALL', l: '전체', i: <Briefcase size={14}/> },
                          { k: 'CURRENT', l: '현직', i: <UserCheck size={14}/> },
                          { k: 'PAST', l: '전직', i: <UserMinus size={14}/> }
                      ].map(opt => (
                          <button 
                            key={opt.k}
                            onClick={() => setFilterStatus(opt.k as any)}
                            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                filterStatus === opt.k 
                                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                            }`}
                          >
                            {opt.i} <span>{opt.l}</span>
                          </button>
                      ))}
                   </div>
               </div>

               {/* Dept Filter */}
               <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                       <Shield size={10} className="mr-1"/> 직무 분류
                   </label>
                   <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                      {[
                          { k: 'ALL', l: '전체' }, 
                          { k: 'MANAGEMENT', l: '경영/임원' }, 
                          { k: 'COURSE', l: '코스관리' },
                          { k: 'OPERATIONS', l: '운영지원' }
                      ].map(opt => (
                        <button 
                          key={opt.k}
                          onClick={() => setFilterDept(opt.k as any)}
                          className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                              filterDept === opt.k 
                              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-black/5' 
                              : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                   </div>
               </div>
           </div>

           <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
               {/* Affinity Filter (Compact) */}
               <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button onClick={() => setFilterAffinity('ALL')} className={`p-1.5 rounded-md ${filterAffinity === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`} title="전체"><Filter size={14}/></button>
                  <button onClick={() => setFilterAffinity(AffinityLevel.ALLY)} className={`w-6 h-6 rounded-md flex items-center justify-center ${filterAffinity === AffinityLevel.ALLY ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'text-slate-300 hover:text-green-500'}`} title="우호"><div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div></button>
                  <button onClick={() => setFilterAffinity(AffinityLevel.NEUTRAL)} className={`w-6 h-6 rounded-md flex items-center justify-center ${filterAffinity === AffinityLevel.NEUTRAL ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-300' : 'text-slate-300 hover:text-slate-500'}`} title="중립"><div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div></button>
                  <button onClick={() => setFilterAffinity(AffinityLevel.HOSTILE)} className={`w-6 h-6 rounded-md flex items-center justify-center ${filterAffinity === AffinityLevel.HOSTILE ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 'text-slate-300 hover:text-red-500'}`} title="적대"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div></button>
               </div>

               <button 
                  onClick={resetFilters}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
               >
                   <RefreshCcw size={14} /> <span>초기화</span>
               </button>
           </div>
        </div>
      </div>

      {/* Visualization Canvas */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative min-h-[600px] flex items-center justify-center border border-slate-700 select-none">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* --- Mobile Warning --- */}
        <div className="md:hidden absolute top-4 left-4 right-4 bg-yellow-100 text-yellow-800 p-2 rounded text-xs text-center z-30 opacity-90 font-bold border border-yellow-200">
            화면이 좁아 리스트 뷰가 권장됩니다.
        </div>

        {/* --- Desktop Orbit Visualization --- */}
        <div className="w-full h-[700px] relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Lines from Center to Courses */}
                {hubData.map((course, idx) => {
                    const angle = (idx / hubData.length) * 2 * Math.PI - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * hubRadius;
                    const y = centerY + Math.sin(angle) * hubRadius;
                    return (
                        <g key={`link-${course.id}`}>
                            <line 
                                x1={centerX} y1={centerY} 
                                x2={x} y2={y} 
                                stroke="#334155" 
                                strokeWidth="1" 
                                strokeDasharray="4,4"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Central Node (User Company) */}
            <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 rounded-full bg-brand-600 border-4 border-brand-400 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center text-white animate-pulse"
                style={{ left: centerX, top: centerY }}
            >
                <Crown size={28} className="text-yellow-300 mb-1" />
                <span className="text-[9px] font-bold">GreenMaster</span>
            </div>

            {/* Course Nodes & People */}
            {hubData.map((course, idx) => {
                const angle = (idx / hubData.length) * 2 * Math.PI - Math.PI / 2;
                const cx = centerX + Math.cos(angle) * hubRadius;
                const cy = centerY + Math.sin(angle) * hubRadius;
                
                // Position people around the course
                const personRadius = 75; 

                return (
                    <div key={course.id} className="absolute" style={{ left: cx, top: cy }}>
                        {/* Course Hub Node */}
                        <div 
                             className="absolute transform -translate-x-1/2 -translate-y-1/2 w-28 bg-slate-800 border border-slate-600 rounded-lg p-2 text-center shadow-lg z-20 hover:border-brand-500 hover:bg-slate-700 transition-colors cursor-pointer group"
                             onMouseEnter={() => setHoveredNode({type: 'COURSE', id: course.id})}
                             onMouseLeave={() => setHoveredNode(null)}
                        >
                            <h3 className="text-xs font-bold text-white truncate group-hover:text-brand-300">{course.name}</h3>
                            <span className="text-[9px] text-slate-400 block">{course.people.length}명 연결됨</span>
                            {hoveredNode?.type === 'COURSE' && hoveredNode.id === course.id && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white text-slate-900 p-2 rounded shadow-xl text-xs z-50 text-left border border-slate-200">
                                    <div className="font-bold border-b pb-1 mb-1 bg-slate-50 -mx-2 -mt-2 p-2 rounded-t text-slate-700">{course.name} 통계</div>
                                    <div className="mt-1 flex justify-between"><span>현직:</span> <span className="font-bold">{course.people.filter(p=>p.type==='CURRENT').length}명</span></div>
                                    <div className="flex justify-between"><span>전직:</span> <span className="font-bold text-slate-500">{course.people.filter(p=>p.type==='PAST').length}명</span></div>
                                </div>
                            )}
                        </div>

                        {/* People Nodes */}
                        {course.people.map((personConn, pIdx) => {
                             // Distribute people
                             const pAngle = (pIdx / course.people.length) * 2 * Math.PI;
                             const px = Math.cos(pAngle) * personRadius;
                             const py = Math.sin(pAngle) * personRadius;

                             const isHovered = hoveredNode?.type === 'PERSON' && hoveredNode.id === `${personConn.personId}-${course.id}`;
                             const affinityColor = getAffinityColor(personConn.personAffinity);
                             const isPast = personConn.type === 'PAST';

                             return (
                                 <React.Fragment key={`${personConn.personId}-${course.id}`}>
                                    {/* SVG Connector from Course to Person */}
                                    <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ left: 0, top: 0 }}>
                                        <line 
                                            x1={0} y1={0} 
                                            x2={px} y2={py} 
                                            stroke={isHovered ? affinityColor : (isPast ? "#475569" : "#64748b")} 
                                            strokeWidth={isHovered ? 2 : 1}
                                            strokeDasharray={isPast ? "4,4" : "none"}
                                        />
                                    </svg>

                                    {/* Person Node */}
                                    <Link to={`/people/${personConn.personId}`}>
                                        <div 
                                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border bg-slate-900 flex items-center justify-center cursor-pointer transition-all hover:scale-125 hover:z-50 ${isHovered ? 'shadow-[0_0_15px_rgba(255,255,255,0.5)] ring-2 ring-white' : ''} ${isPast ? 'opacity-70 grayscale-[0.5]' : ''}`}
                                            style={{ left: px, top: py, borderColor: affinityColor }}
                                            onMouseEnter={() => setHoveredNode({type: 'PERSON', id: `${personConn.personId}-${course.id}`})}
                                            onMouseLeave={() => setHoveredNode(null)}
                                        >
                                            <span className="text-[10px] text-white font-bold leading-none">{personConn.personName[0]}</span>
                                            
                                            {/* Status Dot for Affinity */}
                                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900" style={{ backgroundColor: affinityColor }}></span>

                                            {/* Past Indicator Icon */}
                                            {isPast && (
                                                <div className="absolute -top-3 -right-2 text-slate-400 bg-slate-800 rounded-full p-0.5 border border-slate-600 shadow-sm" title="전직">
                                                    <History size={10} />
                                                </div>
                                            )}

                                            {/* Tooltip on Hover */}
                                            {isHovered && (
                                                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-60 bg-white text-slate-900 p-0 rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-none overflow-hidden">
                                                    <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-100">
                                                        <span className="font-bold text-sm flex items-center text-slate-800">
                                                            {personConn.personName}
                                                            {isPast && <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">전직</span>}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-sm`} style={{ backgroundColor: affinityColor }}>
                                                            {personConn.personAffinity > 0 ? '우호' : personConn.personAffinity < 0 ? '적대' : '중립'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="p-3 space-y-2">
                                                        <div className="flex items-center text-xs">
                                                            <MapPin size={12} className="mr-2 text-brand-600" />
                                                            <span className="font-bold text-slate-700">{course.name}</span>
                                                        </div>
                                                        <div className="flex items-center text-xs">
                                                            <Briefcase size={12} className="mr-2 text-brand-600" />
                                                            <span className="text-slate-600">{personConn.personRole} <span className="text-slate-400">({personConn.deptCategory})</span></span>
                                                        </div>
                                                        <div className="text-[10px] bg-slate-100 p-2 rounded border border-slate-200 flex items-center text-slate-600 mt-1">
                                                            <Calendar size={10} className="mr-1.5"/> 
                                                            {isPast ? '근무 기간' : '재직 기간'}: <strong className="ml-1">{getTenure(personConn.startDate, personConn.endDate)}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                 </React.Fragment>
                             );
                        })}
                    </div>
                );
            })}
        </div>
        
        {hubData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <Search size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>조건에 맞는 인물 관계 데이터가 없습니다.</p>
                    <button onClick={resetFilters} className="mt-4 text-sm text-brand-500 hover:underline">필터 초기화</button>
                </div>
            </div>
        )}
      </div>
      
      {/* Legend Footer */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 text-xs text-slate-600 shadow-sm justify-between">
          <div className="flex flex-wrap gap-4 items-center">
             <span className="font-bold flex items-center text-slate-800"><Filter size={14} className="mr-1"/> 범례:</span>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span> 우호적</div>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5"></span> 중립</div>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span> 적대적</div>
          </div>
          <div className="flex flex-wrap gap-4 items-center border-l border-slate-200 pl-4">
             <div className="flex items-center"><Briefcase size={12} className="mr-1.5 text-slate-400"/> 직책 분류: 경영 / 코스 / 운영</div>
             <div className="flex items-center space-x-4">
                 <div className="flex items-center">
                     <span className="w-4 h-px bg-slate-400 mr-1.5"></span> 현직 (실선)
                 </div>
                 <div className="flex items-center">
                     <span className="w-4 h-px border-b border-dashed border-slate-400 mr-1.5"></span> 전직 (점선)
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default RelationshipMap;
