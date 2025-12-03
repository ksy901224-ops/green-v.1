
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { AffinityLevel } from '../types';
import { Share2, Search, Calendar, Crown, Filter, History, Briefcase, MapPin } from 'lucide-react';
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
    const r = role.replace(/\s/g, '');
    if (r.match(/코스|잔디|그린|조경|시설|설비|장비/)) return 'COURSE';
    if (r.match(/지배인|대표|이사|사장|회장|전무|상무|본부장/)) return 'MANAGEMENT';
    if (r.match(/운영|경기|지원|프론트|예약|마케팅|영업|식음/)) return 'OPERATIONS';
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

                    // Search term search against past role as well if needed, 
                    // but usually search matches Person Name. 
                    // If strict search needed for role name:
                    // const matchPastSearch = searchTerm === '' || p.name.includes(searchTerm) || career.role.includes(searchTerm);

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

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Share2 className="mr-2 text-brand-600" /> 인물 관계도 (Network Map)
           </h1>
           <p className="text-slate-500 text-sm mt-1">
             골프장별 인물 배치, 근무 이력, 친밀도를 시각화합니다.
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
           {/* Search */}
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="이름/직책 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 w-32 md:w-40"
              />
           </div>

           {/* Status Filter (New) */}
           <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              {[
                  { k: 'ALL', l: '전체' },
                  { k: 'CURRENT', l: '현직' },
                  { k: 'PAST', l: '전직' }
              ].map(opt => (
                  <button 
                    key={opt.k}
                    onClick={() => setFilterStatus(opt.k as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${filterStatus === opt.k ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {opt.l}
                  </button>
              ))}
           </div>
           
           {/* Dept Filter */}
           <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              {[
                  { k: 'ALL', l: '전체' }, 
                  { k: 'MANAGEMENT', l: '경영' }, 
                  { k: 'COURSE', l: '코스' },
                  { k: 'OPERATIONS', l: '운영' }
              ].map(opt => (
                <button 
                  key={opt.k}
                  onClick={() => setFilterDept(opt.k as any)}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${filterDept === opt.k ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
           </div>

           {/* Affinity Filter */}
           <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={() => setFilterAffinity('ALL')} className={`px-2.5 py-1 text-xs font-bold rounded ${filterAffinity === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>전체</button>
              <button onClick={() => setFilterAffinity(AffinityLevel.ALLY)} className={`px-2.5 py-1 text-xs font-bold rounded ${filterAffinity === AffinityLevel.ALLY ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-green-50'}`}>우호</button>
              <button onClick={() => setFilterAffinity(AffinityLevel.NEUTRAL)} className={`px-2.5 py-1 text-xs font-bold rounded ${filterAffinity === AffinityLevel.NEUTRAL ? 'bg-slate-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>중립</button>
              <button onClick={() => setFilterAffinity(AffinityLevel.HOSTILE)} className={`px-2.5 py-1 text-xs font-bold rounded ${filterAffinity === AffinityLevel.HOSTILE ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-red-50'}`}>적대</button>
           </div>
        </div>
      </div>

      {/* Visualization Canvas */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative min-h-[700px] flex items-center justify-center border border-slate-700 select-none">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* --- Mobile Warning (Optional) --- */}
        <div className="md:hidden absolute top-4 left-4 right-4 bg-yellow-100 text-yellow-800 p-2 rounded text-xs text-center z-30 opacity-90">
            모바일에서는 리스트 뷰가 권장됩니다.
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
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white text-slate-900 p-2 rounded shadow-xl text-xs z-50 text-left">
                                    <div className="font-bold border-b pb-1 mb-1">{course.name} 통계</div>
                                    <div>현직: {course.people.filter(p=>p.type==='CURRENT').length}명</div>
                                    <div>전직: {course.people.filter(p=>p.type==='PAST').length}명</div>
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
                                            strokeDasharray={isPast ? "3,3" : "none"}
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
                                                <div className="absolute -top-2 -right-1 text-slate-400 bg-slate-800 rounded-full p-0.5 border border-slate-600">
                                                    <History size={8} />
                                                </div>
                                            )}

                                            {/* Tooltip on Hover */}
                                            {isHovered && (
                                                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-56 bg-white text-slate-900 p-3 rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                                                    <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                                                        <span className="font-bold text-sm flex items-center">
                                                            {personConn.personName}
                                                            {isPast && <span className="ml-1 text-[9px] bg-slate-200 text-slate-600 px-1 rounded">전직</span>}
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold text-white`} style={{ backgroundColor: affinityColor }}>
                                                            {personConn.personAffinity > 0 ? '우호' : personConn.personAffinity < 0 ? '적대' : '중립'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-1 mb-2">
                                                        <div className="flex items-center text-xs">
                                                            <MapPin size={12} className="mr-1.5 text-slate-400" />
                                                            <span className="font-bold text-slate-700">{course.name}</span>
                                                        </div>
                                                        <div className="flex items-center text-xs">
                                                            <Briefcase size={12} className="mr-1.5 text-slate-400" />
                                                            <span className="text-slate-600">{personConn.personRole}</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-[10px] bg-slate-100 p-1.5 rounded flex items-center text-slate-600">
                                                        <Calendar size={10} className="mr-1.5"/> 
                                                        {isPast ? '근무 기간' : '재직 기간'}: <strong>{getTenure(personConn.startDate, personConn.endDate)}</strong>
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
                </div>
            </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 text-xs text-slate-600 shadow-sm justify-between">
          <div className="flex flex-wrap gap-4 items-center">
             <span className="font-bold flex items-center"><Filter size={14} className="mr-1"/> 범례:</span>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span> 우호적 (Ally)</div>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5"></span> 중립 (Neutral)</div>
             <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span> 적대적 (Hostile)</div>
          </div>
          <div className="flex flex-wrap gap-4 items-center border-l border-slate-200 pl-4">
             <div className="flex items-center"><Briefcase size={12} className="mr-1.5 text-slate-400"/> 직책 분류: 경영 / 코스 / 운영</div>
             <div className="flex items-center"><History size={12} className="mr-1.5 text-slate-400"/> 상태: 현직 / 전직</div>
          </div>
      </div>
    </div>
  );
};

export default RelationshipMap;
