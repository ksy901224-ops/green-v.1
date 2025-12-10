
import React, { useState, useEffect, useMemo } from 'react';
import LogCard from '../components/LogCard';
import { generateCourseSummary } from '../services/geminiService';
import { Info, FileText, Users, Sparkles, History, Edit2, X, CheckCircle, MapPin, Trash2, Globe, Loader2, List, AlertTriangle, Plus, Minus, Lock, Calendar, Ruler, Map, Calculator, ArrowRightLeft, Cloud, Search, ArrowRight, BarChart3, TrendingUp, TrendingDown, Package, Droplets, Sprout, Box } from 'lucide-react';
import { AffinityLevel, CourseType, GrassType, GolfCourse, FinancialRecord, MaterialRecord, MaterialCategory } from '../types';
import { useApp } from '../contexts/AppContext';

const CourseDetail: React.FC = () => {
  const { courses, logs, updateCourse, deleteCourse, people, canUseAI, canViewFullData, isAdmin, navigate, routeParams, locationState, financials, materials, addFinancial, updateFinancial, deleteFinancial, addMaterial, updateMaterial, deleteMaterial } = useApp();
  const id = routeParams.id;
  
  const course = courses.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState<'INFO' | 'LOGS' | 'PEOPLE' | 'MANAGEMENT'>('INFO');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Edit State for Course Info
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<GolfCourse | null>(null);
  
  // Search state for logs tab
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // --- Financial & Material States ---
  const [isFinModalOpen, setIsFinModalOpen] = useState(false);
  const [editingFin, setEditingFin] = useState<FinancialRecord | null>(null);
  const [finForm, setFinForm] = useState({ year: new Date().getFullYear(), revenue: 0, profit: 0 });

  const [isMatModalOpen, setIsMatModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<MaterialRecord | null>(null);
  const [matCategory, setMatCategory] = useState<MaterialCategory>(MaterialCategory.PESTICIDE);
  const [matForm, setMatForm] = useState({
      category: MaterialCategory.PESTICIDE,
      name: '',
      quantity: 0,
      unit: 'kg',
      supplier: '',
      notes: ''
  });

  // Handle auto-filtering from dashboard redirect
  useEffect(() => {
      if (locationState?.filterIssue && canViewFullData) {
          setActiveTab('LOGS');
          setLogSearchTerm(locationState.filterIssue);
      }
  }, [locationState, canViewFullData]);

  // Converters State
  const [areaPyeong, setAreaPyeong] = useState<string>('');
  const [areaM2, setAreaM2] = useState<string>('');
  const [lengthYard, setLengthYard] = useState<string>('');
  const [lengthMeter, setLengthMeter] = useState<string>('');

  if (!course) return <div className="p-8 text-center">골프장을 찾을 수 없습니다.</div>;

  const relatedLogs = logs
    .filter(l => l.courseId === id)
    .filter(l => {
        if (!logSearchTerm) return true;
        const term = logSearchTerm.toLowerCase();
        return (
            l.title.toLowerCase().includes(term) ||
            l.content.toLowerCase().includes(term) ||
            l.tags?.some(t => t.toLowerCase().includes(term))
        );
    });

  // Financial Logic
  const courseFinancials = useMemo(() => {
      return financials.filter(f => f.courseId === id).sort((a, b) => b.year - a.year);
  }, [financials, id]);

  const financialGrowth = useMemo(() => {
      if (courseFinancials.length < 2) return null;
      const current = courseFinancials[0];
      const prev = courseFinancials[1];
      const growth = ((current.revenue - prev.revenue) / prev.revenue) * 100;
      return growth.toFixed(1);
  }, [courseFinancials]);

  // Material Logic
  const courseMaterials = useMemo(() => {
      return materials.filter(m => m.courseId === id);
  }, [materials, id]);

  const filteredMaterials = courseMaterials.filter(m => m.category === matCategory);

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

  // --- CRUD Handlers for Course Info ---
  const openEditModal = () => {
      const draftKey = `GM_DRAFT_COURSE_${course.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
          try { setEditForm(JSON.parse(savedDraft)); } catch(e) { setEditForm({ ...course }); }
      } else {
          setEditForm({ ...course });
      }
      setAreaPyeong(''); setAreaM2(''); setLengthYard(''); setLengthMeter('');
      setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
      localStorage.removeItem(`GM_DRAFT_COURSE_${course.id}`);
      setIsEditModalOpen(false);
  }

  const handleEditChange = (field: keyof GolfCourse, value: any) => {
      if (editForm) {
          const newState = { ...editForm, [field]: value };
          setEditForm(newState);
          localStorage.setItem(`GM_DRAFT_COURSE_${course.id}`, JSON.stringify(newState));
      }
  };

  const saveEdit = () => {
      if (editForm) {
          const cleanedIssues = (editForm.issues || []).filter(i => i.trim() !== '');
          updateCourse({ ...editForm, issues: cleanedIssues });
          localStorage.removeItem(`GM_DRAFT_COURSE_${course.id}`);
          setIsEditModalOpen(false);
          alert('골프장 정보가 수정되었습니다.');
      }
  };

  // --- Financial Handlers ---
  const handleOpenFinModal = (record?: FinancialRecord) => {
      if (record) {
          setEditingFin(record);
          setFinForm({ year: record.year, revenue: record.revenue, profit: record.profit || 0 });
      } else {
          setEditingFin(null);
          setFinForm({ year: new Date().getFullYear(), revenue: 0, profit: 0 });
      }
      setIsFinModalOpen(true);
  };

  const handleSaveFin = () => {
      if (editingFin) {
          updateFinancial({ ...editingFin, ...finForm, updatedAt: Date.now() });
      } else {
          addFinancial({
              id: `fin-${Date.now()}`,
              courseId: id!,
              ...finForm,
              updatedAt: Date.now()
          });
      }
      setIsFinModalOpen(false);
  };

  const handleDeleteFin = (fid: string) => {
      if(window.confirm('삭제하시겠습니까?')) deleteFinancial(fid);
  };

  // --- Material Handlers ---
  const handleOpenMatModal = (record?: MaterialRecord) => {
      if (record) {
          setEditingMat(record);
          setMatForm({
              category: record.category, name: record.name, quantity: record.quantity, unit: record.unit, supplier: record.supplier || '', notes: record.notes || ''
          });
      } else {
          setEditingMat(null);
          setMatForm({
              category: matCategory, name: '', quantity: 0, unit: 'kg', supplier: '', notes: ''
          });
      }
      setIsMatModalOpen(true);
  };

  const handleSaveMat = () => {
      const today = new Date().toISOString().split('T')[0];
      if (editingMat) {
          updateMaterial({ ...editingMat, ...matForm, lastUpdated: today });
      } else {
          addMaterial({
              id: `mat-${Date.now()}`,
              courseId: id!,
              ...matForm,
              lastUpdated: today
          });
      }
      setIsMatModalOpen(false);
  };

  const handleDeleteMat = (mid: string) => {
      if(window.confirm('삭제하시겠습니까?')) deleteMaterial(mid);
  };

  // --- Layout logic ---
  const handleDeleteCourse = () => {
    if (window.confirm(`'${course.name}' 골프장을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      deleteCourse(course.id);
      navigate('/courses');
    }
  };

  // Calculator Logic
  const handlePyeongChange = (val: string) => {
      setAreaPyeong(val);
      if (val && !isNaN(parseFloat(val))) {
          const m2 = (parseFloat(val) * 3.305785).toFixed(0);
          setAreaM2(m2);
          handleEditChange('area', `${Number(val).toLocaleString()}평 (${Number(m2).toLocaleString()} m²)`);
      } else { setAreaM2(''); }
  };

  const handleM2Change = (val: string) => {
      setAreaM2(val);
      if (val && !isNaN(parseFloat(val))) {
          const py = (parseFloat(val) / 3.305785).toFixed(1);
          setAreaPyeong(py);
          handleEditChange('area', `${Number(py).toLocaleString()}평 (${Number(val).toLocaleString()} m²)`);
      } else { setAreaPyeong(''); }
  };

  const handleYardChange = (val: string) => {
      setLengthYard(val);
      if (val && !isNaN(parseFloat(val))) {
          const m = (parseFloat(val) * 0.9144).toFixed(0);
          setLengthMeter(m);
          handleEditChange('length', `${Number(val).toLocaleString()} yds`);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-start mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{course.name}</h1>
            <div className="flex space-x-2">
                <button onClick={openEditModal} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors" title="정보 수정"><Edit2 size={18} /></button>
                {isAdmin && (<button onClick={handleDeleteCourse} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="골프장 삭제 (관리자)"><Trash2 size={18} /></button>)}
            </div>
        </div>
        <p className="text-slate-500 text-sm flex items-center mb-4">
          <span className="mr-3 flex items-center"><MapPin size={14} className="mr-1"/> {course.address}</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">{course.type}</span>
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4 border-slate-100">
          <div><span className="block text-slate-400 text-xs mb-0.5">규모 / 면적</span><span className="font-medium text-slate-700">{course.holes}홀 / {course.area || '-'}</span></div>
          <div><span className="block text-slate-400 text-xs mb-0.5">코스 전장</span><span className="font-medium text-slate-700">{course.length || '-'}</span></div>
          <div><span className="block text-slate-400 text-xs mb-0.5">잔디 종류</span><span className="font-medium text-slate-700">{course.grassType}</span></div>
          <div><span className="block text-slate-400 text-xs mb-0.5">개장 년도</span><span className="font-medium text-slate-700">{course.openYear}년</span></div>
        </div>
      </div>

      {/* AI Summary Card - SENIOR Only */}
      {canUseAI && (
          <div className="bg-brand-50 rounded-xl border border-brand-100 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-brand-800 font-bold flex items-center mb-2"><Sparkles size={18} className="mr-2 text-brand-600" /> AI 스마트 요약 및 전략 추천 (상급자 전용)</h3>
              {!aiSummary && <p className="text-sm text-brand-700 opacity-70 mb-4">최근 업무 일지와 인물 관계를 종합 분석하여 맞춤형 전략과 Action Plan을 제안합니다.</p>}
              {!aiSummary && (
                <button onClick={handleAiAnalysis} disabled={isSummarizing} className="w-full bg-purple-600 text-white font-semibold p-3 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">
                  {isSummarizing ? <><Loader2 size={20} className="animate-spin mr-2" />분석 중...</> : <><Sparkles size={20} className="mr-2" />AI 추천 받기 (종합 분석)</>}
                </button>
              )}
            </div>
            {aiSummary && <div className="text-sm text-brand-900 leading-relaxed whitespace-pre-line bg-white/60 p-5 rounded-xl border border-brand-100/50 shadow-inner">{aiSummary}</div>}
          </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button onClick={() => setActiveTab('INFO')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'INFO' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><Info size={16} className="mr-2" /> 기본 정보/이슈</button>
          
          {canViewFullData && (
              <>
                  <button onClick={() => setActiveTab('MANAGEMENT')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'MANAGEMENT' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><BarChart3 size={16} className="mr-2" /> 운영 관리</button>
                  <button onClick={() => setActiveTab('LOGS')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'LOGS' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><FileText size={16} className="mr-2" /> 업무 일지 ({relatedLogs.length})</button>
                  <button onClick={() => setActiveTab('PEOPLE')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === 'PEOPLE' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><Users size={16} className="mr-2" /> 인맥/관계도 ({currentStaff.length + formerStaff.length})</button>
              </>
          )}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {activeTab === 'INFO' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4">특이사항 및 개요</h3>
            <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">{course.description}</p>
            <h3 className="font-bold text-lg mb-4 flex items-center"><History size={18} className="mr-2 text-slate-500"/>연혁 및 주요 이슈 (History)</h3>
            <div className="space-y-4">
                {course.issues && course.issues.length > 0 ? (
                    course.issues.map((issue, idx) => (
                        <div key={idx} className="flex group">
                            <div className="flex-shrink-0 w-4 h-4 mt-1 mr-3 rounded-full bg-slate-200 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:bg-brand-500 transition-colors"></div>
                            <div className="pb-2 border-l-2 border-slate-100 pl-4 -ml-5 pt-0.5 w-full">
                                <p className="text-slate-800 text-sm whitespace-pre-line group-hover:text-brand-700 transition-colors">{issue}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">아직 기록된 주요 이슈가 없습니다. 정보 수정을 통해 추가하세요.</div>
                )}
            </div>
            
            {(course.lat || course.lng) && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center"><Globe size={18} className="mr-2 text-slate-400"/> 위치 정보 (GPS)</h3>
                    <div className="flex items-center space-x-4">
                         <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center"><span className="font-bold mr-2 text-slate-400">LAT</span> {course.lat || '미설정'}</div>
                         <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center"><span className="font-bold mr-2 text-slate-400">LNG</span> {course.lng || '미설정'}</div>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- MANAGEMENT TAB (New) --- */}
        {canViewFullData && activeTab === 'MANAGEMENT' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* 1. Financials */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center"><BarChart3 size={20} className="mr-2 text-blue-600"/> 매출 및 재무 현황</h3>
                        <button onClick={() => handleOpenFinModal()} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center"><Plus size={14} className="mr-1"/> 매출 등록</button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        {courseFinancials.length > 0 ? (
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Chart Area (Simple CSS Bar Chart) */}
                                <div className="flex-1 min-h-[200px] flex items-end space-x-4 pb-4 border-b border-slate-200 md:border-b-0 md:border-r pr-6">
                                    {courseFinancials.slice(0, 5).reverse().map(fin => {
                                        const maxRev = Math.max(...courseFinancials.map(f => f.revenue));
                                        const height = (fin.revenue / maxRev) * 100;
                                        return (
                                            <div key={fin.id} className="flex-1 flex flex-col justify-end group">
                                                <div className="text-[10px] text-center mb-1 font-bold text-slate-500 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {(fin.revenue / 100000000).toFixed(0)}억
                                                </div>
                                                <div style={{height: `${height}%`}} className="w-full bg-blue-100 rounded-t-lg group-hover:bg-blue-500 transition-all relative"></div>
                                                <div className="text-center text-xs mt-2 font-bold text-slate-600">{fin.year}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Table Area */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-slate-700 text-sm">연도별 상세 매출</h4>
                                        {financialGrowth && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${parseFloat(financialGrowth) >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {parseFloat(financialGrowth) >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                                                전년 대비 {financialGrowth}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">연도</th>
                                                    <th className="px-4 py-2 text-right">매출액</th>
                                                    <th className="px-4 py-2 text-right">영업이익</th>
                                                    <th className="px-4 py-2 text-center">관리</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {courseFinancials.map(fin => (
                                                    <tr key={fin.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-2 font-bold text-slate-700">{fin.year}</td>
                                                        <td className="px-4 py-2 text-right">{(fin.revenue).toLocaleString()}원</td>
                                                        <td className="px-4 py-2 text-right text-slate-500">{(fin.profit || 0).toLocaleString()}원</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button onClick={() => handleOpenFinModal(fin)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 size={12}/></button>
                                                            <button onClick={() => handleDeleteFin(fin.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">등록된 매출 데이터가 없습니다.</div>
                        )}
                    </div>
                </section>

                {/* 2. Materials */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center"><Package size={20} className="mr-2 text-emerald-600"/> 자재 및 재고 관리</h3>
                        <button onClick={() => handleOpenMatModal()} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 flex items-center"><Plus size={14} className="mr-1"/> 자재 등록</button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Material Category Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
                            {[
                                { cat: MaterialCategory.PESTICIDE, icon: <Droplets size={14}/>, color: 'text-purple-600' },
                                { cat: MaterialCategory.FERTILIZER, icon: <Sprout size={14}/>, color: 'text-amber-600' },
                                { cat: MaterialCategory.GRASS, icon: <TrendingUp size={14}/>, color: 'text-green-600' },
                                { cat: MaterialCategory.MATERIAL, icon: <Box size={14}/>, color: 'text-slate-600' }
                            ].map(item => (
                                <button
                                    key={item.cat}
                                    onClick={() => setMatCategory(item.cat)}
                                    className={`px-4 py-2.5 rounded-t-lg text-xs font-bold flex items-center transition-colors ${matCategory === item.cat ? 'bg-white text-slate-800 shadow-sm border-t border-x border-slate-200 -mb-px' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className={`mr-2 ${item.color}`}>{item.icon}</span> {item.cat}
                                </button>
                            ))}
                        </div>

                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">품목명</th>
                                        <th className="px-6 py-3">재고/수량</th>
                                        <th className="px-6 py-3">공급사</th>
                                        <th className="px-6 py-3">최근 갱신</th>
                                        <th className="px-6 py-3 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMaterials.length > 0 ? (
                                        filteredMaterials.map(mat => (
                                            <tr key={mat.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-700">{mat.name}</div>
                                                    {mat.notes && <div className="text-xs text-slate-400 mt-0.5">{mat.notes}</div>}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-800">
                                                    {mat.quantity.toLocaleString()} <span className="text-slate-500 text-xs">{mat.unit}</span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-500">{mat.supplier || '-'}</td>
                                                <td className="px-6 py-3 text-slate-500 text-xs">{mat.lastUpdated}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => handleOpenMatModal(mat)} className="p-1 text-slate-400 hover:text-blue-600 mr-1"><Edit2 size={14}/></button>
                                                    <button onClick={() => handleDeleteMat(mat.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-slate-400">등록된 {matCategory} 내역이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        )}

        {canViewFullData && activeTab === 'LOGS' && (
          <div className="space-y-4">
             {/* Log Search Bar */}
             <div className="relative mb-4">
                 <input 
                    type="text" 
                    placeholder="업무 일지 내용 검색..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                 />
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 {logSearchTerm && (
                     <button onClick={() => setLogSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                 )}
             </div>

             {relatedLogs.length > 0 ? (
                 relatedLogs.map(log => <LogCard key={log.id} log={log} />)
             ) : (
                 <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200"><List size={32} className="mx-auto mb-2 opacity-20"/>{logSearchTerm ? '검색 조건에 맞는 기록이 없습니다.' : '등록된 업무 일지가 없습니다.'}</div>
             )}
          </div>
        )}

        {canViewFullData && activeTab === 'PEOPLE' && (
          <div className="space-y-8">
            {/* Current Staff Section */}
            <div>
              <h3 className="text-md font-bold text-slate-700 mb-3 flex items-center"><span className="w-2 h-6 bg-brand-500 rounded-sm mr-2"></span>현재 재직 중 ({currentStaff.length})</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {currentStaff.map(person => (
                  <div key={person.id} onClick={() => navigate(`/people/${person.id}`)} className="block group cursor-pointer">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group-hover:border-brand-500 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div><h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{person.name} <span className="text-sm font-normal text-slate-500">({person.currentRole})</span></h4><p className="text-xs text-brand-600 font-medium mt-0.5">입사: {person.currentRoleStartDate || '-'}</p></div>
                        {getAffinityBadge(person.affinity)}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100 group-hover:bg-brand-50/50 transition-colors">"{person.notes}"</p>
                    </div>
                  </div>
                ))}
                {currentStaff.length === 0 && <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">현재 등록된 직원이 없습니다.</div>}
              </div>
            </div>
            {/* Former Staff Section */}
            {formerStaff.length > 0 && (
                <div>
                  <h3 className="text-md font-bold text-slate-500 mb-3 flex items-center"><span className="w-2 h-6 bg-slate-300 rounded-sm mr-2"></span>과거 근무자 ({formerStaff.length})</h3>
                  <div className="grid gap-4 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
                    {formerStaff.map(person => {
                       const careerRecord = person.careers.find(c => c.courseId === id);
                       return (
                          <div key={person.id} onClick={() => navigate(`/people/${person.id}`)} className="block group cursor-pointer">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 group-hover:border-slate-400 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <div><h4 className="font-bold text-slate-700">{person.name} <span className="text-sm font-normal text-slate-500">({careerRecord?.role || '이전 직책'})</span></h4><p className="text-xs text-slate-500 mt-0.5">근무: {careerRecord?.startDate} ~ {careerRecord?.endDate}</p></div>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">퇴사</span>
                              </div>
                            </div>
                          </div>
                       );
                    })}
                  </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal (Expanded Scope) */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center">골프장 정보 수정 <span className="ml-2 text-[10px] text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full flex items-center"><Cloud size={10} className="mr-1"/> 자동 저장 중</span></h3>
                    <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">골프장 이름</label>
                            <input type="text" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.name} onChange={(e) => handleEditChange('name', e.target.value)} />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">주소</label>
                            <input type="text" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.address} onChange={(e) => handleEditChange('address', e.target.value)} />
                        </div>
                    </div>
                    {/* Specs */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">규모 (Holes)</label><input type="number" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.holes} onChange={(e) => handleEditChange('holes', parseInt(e.target.value) || 0)} /></div>
                        <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">운영 형태</label>
                             <select className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.type} onChange={(e) => handleEditChange('type', e.target.value as CourseType)}>{Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">잔디 종류</label>
                             <select className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.grassType} onChange={(e) => handleEditChange('grassType', e.target.value as GrassType)}>{Object.values(GrassType).map(g => <option key={g} value={g}>{g}</option>)}</select>
                        </div>
                    </div>
                    {/* Area & Length with Calculators */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center"><Calculator size={14} className="mr-1.5"/> 면적 및 전장 (Calculator)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-bold">총 면적 (평 ↔ m² 자동변환)</label>
                                <div className="flex space-x-2">
                                    <div className="relative flex-1"><input type="number" placeholder="평" className="w-full rounded-lg border-slate-300 text-sm pr-8 focus:border-brand-500 focus:ring-brand-500" value={areaPyeong} onChange={(e) => handlePyeongChange(e.target.value)} /><span className="absolute right-3 top-2.5 text-xs text-slate-400">평</span></div>
                                    <div className="relative flex-1"><input type="number" placeholder="m²" className="w-full rounded-lg border-slate-300 text-sm pr-8 focus:border-brand-500 focus:ring-brand-500 bg-slate-100" value={areaM2} onChange={(e) => handleM2Change(e.target.value)} /><span className="absolute right-3 top-2.5 text-xs text-slate-400">m²</span></div>
                                </div>
                                <input type="hidden" value={editForm.area} />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-bold">코스 전장 (Length)</label>
                                <div className="flex space-x-2">
                                    <div className="relative flex-1"><input type="number" placeholder="Yard" className="w-full rounded-lg border-slate-300 text-sm pr-8 focus:border-brand-500 focus:ring-brand-500" value={lengthYard} onChange={(e) => handleYardChange(e.target.value)} /><span className="absolute right-3 top-2.5 text-xs text-slate-400">yd</span></div>
                                    <div className="relative flex-1"><div className="w-full rounded-lg border border-slate-200 bg-slate-100 text-sm py-2 px-3 text-slate-500 h-[38px] flex items-center">{lengthMeter ? `${Number(lengthMeter).toLocaleString()} m` : '-'}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* GPS */}
                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-700 mb-1.5">개장 년도</label><input type="text" placeholder="YYYY" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.openYear} onChange={(e) => handleEditChange('openYear', e.target.value)} /></div><div></div></div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center"><Globe size={14} className="mr-1.5"/> GPS 좌표 (위치 정보)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] text-slate-500 mb-0.5">Latitude (위도)</label><input type="number" step="0.000001" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.lat || ''} onChange={(e) => handleEditChange('lat', parseFloat(e.target.value))} /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-0.5">Longitude (경도)</label><input type="number" step="0.000001" className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500" value={editForm.lng || ''} onChange={(e) => handleEditChange('lng', parseFloat(e.target.value))} /></div>
                        </div>
                    </div>
                    {/* Description */}
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">특이사항 및 설명</label><textarea rows={4} className="w-full rounded-lg border-slate-300 text-sm focus:border-brand-500 focus:ring-brand-500 leading-relaxed" value={editForm.description} onChange={(e) => handleEditChange('description', e.target.value)} /></div>
                    {/* Issues */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div className="flex justify-between items-center mb-3 border-b border-red-200 pb-2"><h4 className="text-xs font-bold text-red-800 flex items-center"><AlertTriangle size={14} className="mr-1.5"/> 주요 이슈 및 연혁 (History)</h4><button type="button" onClick={addIssue} className="text-[10px] flex items-center bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-50 shadow-sm font-medium text-red-600"><Plus size={10} className="mr-1"/> 항목 추가</button></div>
                        <div className="space-y-2">{(editForm.issues || []).map((issue, idx) => (<div key={idx} className="flex gap-2"><input type="text" className="flex-1 text-xs border-red-200 rounded focus:ring-red-500 py-2" placeholder="예: 2024-05 배수 공사 완료" value={issue} onChange={(e) => handleIssueChange(idx, e.target.value)} /><button type="button" onClick={() => removeIssue(idx)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 size={14} /></button></div>))}</div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 shrink-0"><button onClick={closeEditModal} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">취소</button><button onClick={saveEdit} className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center shadow-sm"><CheckCircle size={16} className="mr-2" />수정 완료</button></div>
            </div>
        </div>
      )}

      {/* Financial Modal */}
      {isFinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="font-bold mb-4">{editingFin ? '매출 정보 수정' : '매출 정보 등록'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">연도</label>
                          <input type="number" className="w-full border rounded-lg p-2" value={finForm.year} onChange={e => setFinForm({...finForm, year: parseInt(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">매출액 (KRW)</label>
                          <input type="number" className="w-full border rounded-lg p-2" value={finForm.revenue} onChange={e => setFinForm({...finForm, revenue: parseInt(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">영업이익 (KRW)</label>
                          <input type="number" className="w-full border rounded-lg p-2" value={finForm.profit} onChange={e => setFinForm({...finForm, profit: parseInt(e.target.value)})} />
                      </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                      <button onClick={() => setIsFinModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
                      <button onClick={handleSaveFin} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">저장</button>
                  </div>
              </div>
          </div>
      )}

      {/* Material Modal */}
      {isMatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="font-bold mb-4">{editingMat ? '자재 정보 수정' : '자재 정보 등록'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">카테고리</label>
                          <select className="w-full border rounded-lg p-2 text-sm" value={matForm.category} onChange={e => setMatForm({...matForm, category: e.target.value as MaterialCategory})}>
                              {Object.values(MaterialCategory).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">품목명</label>
                          <input type="text" className="w-full border rounded-lg p-2" value={matForm.name} onChange={e => setMatForm({...matForm, name: e.target.value})} />
                      </div>
                      <div className="flex space-x-2">
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">수량</label>
                              <input type="number" className="w-full border rounded-lg p-2" value={matForm.quantity} onChange={e => setMatForm({...matForm, quantity: parseFloat(e.target.value)})} />
                          </div>
                          <div className="w-1/3">
                              <label className="block text-xs font-bold text-slate-500 mb-1">단위</label>
                              <input type="text" className="w-full border rounded-lg p-2" value={matForm.unit} onChange={e => setMatForm({...matForm, unit: e.target.value})} placeholder="kg" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">공급사</label>
                          <input type="text" className="w-full border rounded-lg p-2" value={matForm.supplier} onChange={e => setMatForm({...matForm, supplier: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">비고</label>
                          <input type="text" className="w-full border rounded-lg p-2" value={matForm.notes} onChange={e => setMatForm({...matForm, notes: e.target.value})} />
                      </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                      <button onClick={() => setIsMatModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">취소</button>
                      <button onClick={handleSaveMat} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">저장</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CourseDetail;
