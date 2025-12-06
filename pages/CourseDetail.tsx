
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LogCard from '../components/LogCard';
import { generateCourseSummary } from '../services/geminiService';
import { Info, FileText, Users, Sparkles, History, Edit2, X, CheckCircle, MapPin, Trash2, Globe, Loader2, List, AlertTriangle, Plus, Minus, Lock } from 'lucide-react';
import { AffinityLevel, CourseType, GrassType, GolfCourse } from '../types';
import { useApp } from '../contexts/AppContext';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, logs, updateCourse, deleteCourse, people, canUseAI, canViewFullData, isAdmin } = useApp(); // Get data and permissions
  
  const course = courses.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState<'INFO' | 'LOGS' | 'PEOPLE'>('INFO');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<GolfCourse | null>(null);

  if (!course) return <div className="p-8 text-center">골프장을 찾을 수 없습니다.</div>;

  const relatedLogs = logs.filter(l => l.courseId === id);
  // Separate current and past people
  const currentStaff = people.filter(p => p.currentCourseId === id);
  const formerStaff = people.filter(p => p.careers.some(c => c.courseId === id) && p.currentCourseId !== id);

  const handleAiAnalysis = async () => {
    setIsSummarizing(true);
    const summary = await generateCourseSummary(course, relatedLogs, [...currentStaff, ...formerStaff]);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const getAffinityBadge = (level: AffinityLevel) => {
    if (level >= 1) return <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">우호적</span>;
    if (level <= -1) return <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">적대적</span>;
    return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">중립</span>;
  };

  const openEditModal = () => {
      setEditForm({ ...course });
      setIsEditModalOpen(true);
  };

  const handleEditChange = (field: keyof GolfCourse, value: any) => {
      if (editForm) {
          setEditForm({ ...editForm, [field]: value });
      }
  };

  // Issue Management logic for modal
  const handleIssueChange = (index: number, val: string) => {
      if (!editForm || !editForm.issues) return;
      const newIssues = [...editForm.issues];
      newIssues[index] = val;
      setEditForm({ ...editForm, issues: newIssues });
  };

  const addIssue = () => {
      if (!editForm) return;
      setEditForm({ ...editForm, issues: [...(editForm.issues || []), ''] });
  };

  const removeIssue = (index: number) => {
      if (!editForm || !editForm.issues) return;
      const newIssues = [...editForm.issues];
      newIssues.splice(index, 1);
      setEditForm({ ...editForm, issues: newIssues });
  };

  const saveEdit = () => {
      if (editForm) {
          // Filter out empty issues
          const cleanedIssues = (editForm.issues || []).filter(i => i.trim() !== '');
          updateCourse({ ...editForm, issues: cleanedIssues });
          setIsEditModalOpen(false);
          alert('골프장 정보가 수정되었습니다.');
      }
  };

  const handleDeleteCourse = () => {
    if (window.confirm(`'${course.name}' 골프장을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      deleteCourse(course.id);
      navigate('/courses');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-start mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{course.name}</h1>
            
            {/* Action Buttons: Visible to All who can see detail, but Delete is Admin only */}
            <div className="flex space-x-2">
                <button 
                    onClick={openEditModal}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="정보 수정"
                >
                    <Edit2 size={18} />
                </button>
                {isAdmin && (
                    <button 
                        onClick={handleDeleteCourse}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="골프장 삭제 (관리자)"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
        <p className="text-slate-500 text-sm flex items-center mb-4">
          <span className="mr-3">{course.address}</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{course.type}</span>
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4 border-slate-100">
          <div>
            <span className="block text-slate-400 text-xs">규모</span>
            <span className="font-medium">{course.holes}홀 / {course.area}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-xs">잔디</span>
            <span className="font-medium">{course.grassType}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-xs">오픈</span>
            <span className="font-medium">{course.openYear}년</span>
          </div>
           {canViewFullData && (
               <div>
                <span className="block text-slate-400 text-xs">데이터 수</span>
                <span className="font-medium">로그 {relatedLogs.length}건 / 인물 {currentStaff.length + formerStaff.length}명</span>
              </div>
           )}
        </div>
      </div>

      {/* AI Summary Card - SENIOR Only */}
      {canUseAI && (
          <div className="bg-brand-50 rounded-xl border border-brand-100 p-5">
            <div className="mb-4">
              <h3 className="text-brand-800 font-bold flex items-center mb-2">
                <Sparkles size={18} className="mr-2 text-brand-600" /> AI 스마트 요약 및 전략 추천 (상급자 전용)
              </h3>
              {!aiSummary && (
                <p className="text-sm text-brand-700 opacity-70 mb-4">
                  최근 업무 일지와 인물 관계를 종합 분석하여 맞춤형 전략과 Action Plan을 제안합니다.
                </p>
              )}
              
              {!aiSummary && (
                <button 
                  onClick={handleAiAnalysis}
                  disabled={isSummarizing}
                  className="w-full bg-purple-600 text-white font-semibold p-3 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="mr-2" />
                      AI 추천 받기 (종합 분석)
                    </>
                  )}
                </button>
              )}
            </div>
            
            {aiSummary && (
              <div className="text-sm text-brand-900 leading-relaxed whitespace-pre-line bg-white/50 p-4 rounded-lg border border-brand-100">
                {aiSummary}
              </div>
            )}
          </div>
      )}

      {/* Tabs - Hiding Logs/People for Juniors */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('INFO')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'INFO'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Info size={16} className="mr-2" /> 기본 정보/이슈
          </button>
          
          {canViewFullData && (
              <>
                  <button
                    onClick={() => setActiveTab('LOGS')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'LOGS'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <FileText size={16} className="mr-2" /> 업무 일지 ({relatedLogs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('PEOPLE')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'PEOPLE'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Users size={16} className="mr-2" /> 인맥/관계도 ({currentStaff.length + formerStaff.length})
                  </button>
              </>
          )}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {activeTab === 'INFO' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4">특이사항 및 개요</h3>
            <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line">{course.description}</p>
            
            <h3 className="font-bold text-lg mb-4 flex items-center">
                <History size={18} className="mr-2 text-slate-500"/>
                연혁 및 주요 이슈 (History)
            </h3>
            <div className="space-y-4">
                {course.issues && course.issues.length > 0 ? (
                    course.issues.map((issue, idx) => (
                        <div key={idx} className="flex">
                            <div className="flex-shrink-0 w-4 h-4 mt-1 mr-3 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
                            <div className="pb-2 border-l-2 border-slate-100 pl-4 -ml-5 pt-0.5 w-full">
                                <p className="text-slate-800 text-sm whitespace-pre-line">{issue}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg">
                        아직 기록된 주요 이슈가 없습니다. 업무 일지를 작성하거나 편집을 통해 추가하세요.
                    </div>
                )}
            </div>
            
            {(course.lat || course.lng) && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                        <Globe size={18} className="mr-2 text-slate-400"/> 위치 정보 (GPS)
                    </h3>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg inline-block border border-slate-200">
                        위도: {course.lat || '미설정'} / 경도: {course.lng || '미설정'}
                    </div>
                </div>
            )}
          </div>
        )}

        {canViewFullData && activeTab === 'LOGS' && (
          <div className="space-y-4">
             {relatedLogs.length > 0 ? (
                 relatedLogs.map(log => <LogCard key={log.id} log={log} />)
             ) : (
                 <div className="text-center py-12 text-slate-400">등록된 업무 일지가 없습니다.</div>
             )}
          </div>
        )}

        {canViewFullData && activeTab === 'PEOPLE' && (
          <div className="space-y-8">
            {/* Current Staff Section */}
            <div>
              <h3 className="text-md font-bold text-slate-700 mb-3 flex items-center">
                 <span className="w-2 h-6 bg-brand-500 rounded-sm mr-2"></span>
                 현재 재직 중 ({currentStaff.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {currentStaff.map(person => (
                  <Link to={`/people/${person.id}`} key={person.id} className="block group">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group-hover:border-brand-500 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{person.name} <span className="text-sm font-normal text-slate-500">({person.currentRole})</span></h4>
                            <p className="text-xs text-brand-600 font-medium mt-0.5">입사: {person.currentRoleStartDate || '-'}</p>
                        </div>
                        {getAffinityBadge(person.affinity)}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100 group-hover:bg-brand-50/50 transition-colors">
                        "{person.notes}"
                      </p>
                    </div>
                  </Link>
                ))}
                {currentStaff.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        현재 등록된 직원이 없습니다.
                    </div>
                )}
              </div>
            </div>

            {/* Former Staff Section */}
            {formerStaff.length > 0 && (
                <div>
                  <h3 className="text-md font-bold text-slate-500 mb-3 flex items-center">
                     <span className="w-2 h-6 bg-slate-300 rounded-sm mr-2"></span>
                     과거 근무자 ({formerStaff.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
                    {formerStaff.map(person => {
                       const careerRecord = person.careers.find(c => c.courseId === id);
                       
                       return (
                          <Link to={`/people/${person.id}`} key={person.id} className="block group">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 group-hover:border-slate-400 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-700">{person.name} <span className="text-sm font-normal text-slate-500">({careerRecord?.role || '이전 직책'})</span></h4>
                                    <p className="text-xs text-slate-500 mt-0.5">근무: {careerRecord?.startDate} ~ {careerRecord?.endDate}</p>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">퇴사</span>
                              </div>
                            </div>
                          </Link>
                       );
                    })}
                  </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-900">골프장 정보 수정</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Only Senior/Admin can edit basic info */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">이름</label>
                        <input 
                            type="text" 
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
                            value={editForm.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            disabled={!isAdmin} 
                        />
                    </div>
                    {/* ... other fields ... */}
                    
                    {/* Enhanced Issues Editor (Accessible to all who can edit) */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                             <h4 className="text-xs font-bold text-slate-700 flex items-center">
                                <AlertTriangle size={14} className="mr-1.5"/> 주요 이슈 및 연혁 (History)
                             </h4>
                             <button type="button" onClick={addIssue} className="text-[10px] flex items-center bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-100 shadow-sm font-medium">
                                <Plus size={10} className="mr-1"/> 항목 추가
                             </button>
                        </div>
                        <div className="space-y-2">
                            {(editForm.issues || []).map((issue, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        type="text"
                                        className="flex-1 text-xs border-slate-300 rounded focus:ring-brand-500 py-1.5"
                                        placeholder="예: 2024-05 배수 공사 완료"
                                        value={issue}
                                        onChange={(e) => handleIssueChange(idx, e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => removeIssue(idx)}
                                        className="text-slate-400 hover:text-red-500 p-1.5"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">특이사항 및 설명</label>
                        <textarea 
                            rows={4}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500"
                            value={editForm.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 shrink-0">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">
                        취소
                    </button>
                    <button onClick={saveEdit} className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center shadow-sm">
                        <CheckCircle size={16} className="mr-2" />
                        수정 완료
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;