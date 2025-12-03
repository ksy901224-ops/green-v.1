
import React, { useState } from 'react';
import { MOCK_EXTERNAL_EVENTS } from '../constants';
import LogCard from '../components/LogCard';
import { CalendarView } from '../components/CalendarView';
import { CalendarSettingsModal } from '../components/CalendarSettingsModal';
import { Department, LogEntry, UserRole } from '../types';
import { Calendar as CalendarIcon, List as ListIcon, X, CalendarPlus, Settings, LayoutGrid, Users, ArrowUpDown, CheckCircle, PlusCircle, Loader2, Search, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { addTodo } from '../services/firestoreService';
import { searchAppWithAI } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const { logs, courses, people, user } = useApp(); // Use shared logs from context
  
  const [filterDept, setFilterDept] = useState<Department | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'course'>('course');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  
  // Separate states for granular control
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- TODO Widget State ---
  const [todoText, setTodoText] = useState('');
  const [isTodoSubmitting, setIsTodoSubmitting] = useState(false);

  // --- AI Search State ---
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleAiSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || aiSearchQuery;
    if (!query.trim()) return;

    // Update input if triggered via suggestion click
    if (queryOverride) setAiSearchQuery(queryOverride);

    setIsAiSearching(true);
    setAiSearchResult(null);

    try {
      const result = await searchAppWithAI(query, { logs, courses, people });
      setAiSearchResult(result);
    } catch (error) {
      setAiSearchResult("검색 중 오류가 발생했습니다.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoText.trim()) return;
    
    setIsTodoSubmitting(true);
    try {
      await addTodo(todoText, user?.name || '익명 사용자');
      setTodoText('');
      alert('할 일이 저장되었습니다!');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsTodoSubmitting(false);
    }
  };
  // -------------------------

  // 1. First, filter by Department (applies to all views)
  const deptFilteredLogs = filterDept === 'ALL' 
    ? logs 
    : logs.filter(l => l.department === filterDept);

  // 2. Sort logs
  const sortedLogs = [...deptFilteredLogs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

  // 3. Apply Date Range / Selection Filters
  const finalDisplayLogs = sortedLogs.filter(l => {
    // If a specific date is selected in calendar mode, prioritize that
    if (viewMode === 'calendar' && selectedCalendarDate) {
      return l.date === selectedCalendarDate;
    }

    // Otherwise apply range filters
    const matchesStart = !startDate || l.date >= startDate;
    const matchesEnd = !endDate || l.date <= endDate;
    return matchesStart && matchesEnd;
  });

  // Combine external events based on connection status
  const externalEvents = [
    ...(isGoogleConnected ? MOCK_EXTERNAL_EVENTS.filter(e => e.source === 'Google') : []),
    ...(isOutlookConnected ? MOCK_EXTERNAL_EVENTS.filter(e => e.source === 'Outlook') : [])
  ];

  // Get external events for selected date
  const selectedDateExternalEvents = (viewMode === 'calendar' && selectedCalendarDate) 
    ? externalEvents.filter(e => e.date === selectedCalendarDate)
    : [];

  const handleDateSelect = (date: string) => {
    if (selectedCalendarDate === date) {
      setSelectedCalendarDate(null); // Deselect if clicked again
    } else {
      setSelectedCalendarDate(date);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCalendarDate(null);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest');
  };

  const isAnyCalendarConnected = isGoogleConnected || isOutlookConnected;

  // Grouping logic for Course View
  const groupedByCourse = finalDisplayLogs.reduce((acc, log) => {
    const courseName = log.courseName || '미지정';
    if (!acc[courseName]) {
        acc[courseName] = [];
    }
    acc[courseName].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  // --- Suggested Queries ---
  const suggestedQueries = [
    '최근 1주일간 스카이뷰 CC 주요 이슈는?',
    '김철수 팀장 관련 기록 요약해줘',
    '진행 중인 모든 공사 현황 알려줘',
    '레이크사이드 관련 최신 영업 기록은?'
  ];

  // Role based access for Widgets
  const canUseAI = user?.role === UserRole.ADMIN || user?.role === 'SENIOR'; // Assuming 'SENIOR' matches enum value if defined, else strict check

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              종합 현황 대시보드
              <span className="ml-3 text-xs font-normal text-brand-600 bg-brand-50 px-2 py-1 rounded-full border border-brand-100 flex items-center">
                <Users size={12} className="mr-1" /> 공유 모드 활성
              </span>
            </h1>
            <p className="text-slate-500 text-sm">전 사업부의 골프장 관련 최신 업무 현황입니다 (실시간 공유됨).</p>
          </div>
          
          <div className="flex gap-2 self-start md:self-auto">
             {/* Sort Button (Visible in List/Course mode) */}
             {viewMode !== 'calendar' && (
                <button
                  onClick={toggleSort}
                  className="flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <ArrowUpDown size={16} className="mr-2" />
                  {sortOrder === 'latest' ? '최신순' : '과거순'}
                </button>
             )}

             {/* Calendar Settings Button */}
             {viewMode === 'calendar' && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all border shadow-sm ${
                    isAnyCalendarConnected
                      ? 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50' 
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Settings size={16} className="mr-2" />
                  캘린더 연동
                  {isAnyCalendarConnected && (
                    <span className="ml-2 flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                  )}
                </button>
             )}

            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListIcon size={16} className="mr-2" /> 목록
              </button>
              <button
                onClick={() => setViewMode('course')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'course' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={16} className="mr-2" /> 골프장별
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'calendar' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CalendarIcon size={16} className="mr-2" /> 캘린더
              </button>
            </div>
          </div>
        </div>

        {/* --- AI SMART SEARCH WIDGET (Restricted Access) --- */}
        {canUseAI && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-5 rounded-xl shadow-lg text-white">
            <div className="flex items-center mb-3">
              <Sparkles className="text-yellow-300 mr-2" size={20} />
              <h3 className="font-bold text-lg">AI 통합 데이터 검색</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-4">
              내부 DB(일지, 인물, 골프장)를 바탕으로 질문에 답변합니다.
            </p>
            
            <form onSubmit={(e) => handleAiSearch(e)} className="relative">
              <input 
                type="text" 
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                placeholder="예: 최근 1주일간 스카이뷰 CC 주요 이슈는?"
                className="w-full pl-10 pr-24 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm transition-all shadow-inner"
              />
              <Search className="absolute left-3 top-3.5 text-indigo-200" size={20} />
              <button 
                type="submit" 
                disabled={isAiSearching || !aiSearchQuery.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-white text-indigo-700 rounded-md font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center shadow-sm"
              >
                {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : '검색'}
              </button>
            </form>

            {/* Suggested Queries Chips */}
            <div className="mt-3 flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-500">
               <span className="text-xs font-bold text-indigo-200 flex items-center mr-1">
                   <MessageCircleQuestion size={12} className="mr-1"/> 추천 질문:
               </span>
               {suggestedQueries.map((q, idx) => (
                   <button
                       key={idx}
                       onClick={() => handleAiSearch(undefined, q)}
                       className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer select-none"
                   >
                       {q}
                   </button>
               ))}
            </div>

            {aiSearchResult && (
              <div className="mt-4 bg-black/20 rounded-lg p-4 text-sm leading-relaxed border border-white/10 animate-in fade-in slide-in-from-top-2 whitespace-pre-wrap shadow-inner">
                  {aiSearchResult}
              </div>
            )}
          </div>
        )}
        {/* --------------------------- */}

        {/* --- To-Do Input Widget (Restricted Access) --- */}
        {canUseAI && (
          <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-white to-brand-50/30">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">오늘의 할 일</h3>
                <p className="text-xs text-slate-500">완료 후 DB에 저장됩니다.</p>
              </div>
            </div>
            <form onSubmit={handleAddTodo} className="flex-1 w-full flex gap-2">
              <input 
                type="text" 
                value={todoText}
                onChange={(e) => setTodoText(e.target.value)}
                placeholder="할 일을 입력하세요..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
              />
              <button 
                type="submit" 
                disabled={isTodoSubmitting || !todoText.trim()}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center transition-colors"
              >
                {isTodoSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} className="mr-1" />}
                추가
              </button>
            </form>
          </div>
        )}
        {/* ------------------------------------ */}

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
           {/* Dept Filter */}
           <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button 
              onClick={() => setFilterDept('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${filterDept === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              전체
            </button>
            {Object.values(Department).map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${filterDept === dept ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2 text-sm">
             <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
             />
             <span className="text-slate-400">-</span>
             <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
             />
             {(startDate || endDate) && (
                 <button onClick={clearFilters} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="필터 초기화">
                     <X size={16} />
                 </button>
             )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* VIEW MODE: CALENDAR */}
        {viewMode === 'calendar' && (
          <CalendarView 
            logs={deptFilteredLogs} 
            externalEvents={externalEvents}
            onDateSelect={handleDateSelect}
            selectedDate={selectedCalendarDate}
          />
        )}

        {/* VIEW MODE: COURSE GROUPING */}
        {viewMode === 'course' && (
             <div className="space-y-8">
                {Object.keys(groupedByCourse).length > 0 ? (
                    Object.entries(groupedByCourse).map(([courseName, courseLogs]: [string, LogEntry[]]) => (
                        <div key={courseName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex items-center mb-3">
                                <h3 className="text-lg font-bold text-slate-800">{courseName}</h3>
                                <span className="ml-3 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">
                                    {courseLogs.length}건
                                </span>
                             </div>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                {courseLogs.map(log => (
                                    <LogCard key={log.id} log={log} />
                                ))}
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                        <p className="text-slate-400">조건에 맞는 업무 기록이 없습니다.</p>
                    </div>
                )}
             </div>
        )}

        {/* VIEW MODE: LIST (Default) */}
        {viewMode === 'list' && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        업무 기록 목록
                        {(startDate || endDate) && <span className="ml-2 text-xs font-normal text-slate-500">(기간 필터 적용됨)</span>}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                            ({sortOrder === 'latest' ? '최신순' : '과거순'})
                        </span>
                    </h3>
                    <span className="text-xs text-slate-500">
                    내부 {finalDisplayLogs.length}건 
                    {selectedDateExternalEvents.length > 0 && ` / 외부 ${selectedDateExternalEvents.length}건`}
                    </span>
                </div>

                {/* Render External Events specifically for the day if selected */}
                {selectedDateExternalEvents.length > 0 && (
                <div className="space-y-2 mb-4">
                    {selectedDateExternalEvents.map(evt => (
                        <div key={evt.id} className="bg-pink-50 border border-pink-100 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div className="flex items-center">
                                <div className="p-2 bg-pink-100 rounded-full mr-3 text-pink-600">
                                    <CalendarPlus size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-pink-900">{evt.title}</h4>
                                    <p className="text-xs text-pink-700 font-medium">
                                        {evt.source} Calendar • {evt.time || '하루 종일'} {evt.location && `• ${evt.location}`}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-white text-pink-600 rounded border border-pink-100">외부 일정</span>
                        </div>
                    ))}
                </div>
                )}

                <div className="grid gap-4">
                    {finalDisplayLogs.length > 0 ? (
                    finalDisplayLogs.map(log => (
                        <LogCard key={log.id} log={log} />
                    ))
                    ) : (
                    selectedDateExternalEvents.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                            <p className="text-slate-400">조건에 맞는 업무 기록이 없습니다.</p>
                        </div>
                    )
                    )}
                </div>
            </div>
        )}

        {/* Shared Log List when viewed below calendar */}
        {viewMode === 'calendar' && (
            <div className="space-y-4 mt-6">
               <h3 className="font-bold text-slate-800 flex items-center">
                    {selectedCalendarDate ? (
                         <>
                           <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-sm mr-2">{selectedCalendarDate}</span>
                           선택한 날짜의 기록
                         </>
                    ) : (
                        '전체 기록 목록'
                    )}
                </h3>
                <div className="grid gap-4">
                    {finalDisplayLogs.length > 0 ? (
                        finalDisplayLogs.map(log => (
                            <LogCard key={log.id} log={log} />
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                             <p className="text-slate-400">기록이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <CalendarSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isGoogleConnected={isGoogleConnected}
        isOutlookConnected={isOutlookConnected}
        onToggleGoogle={() => setIsGoogleConnected(!isGoogleConnected)}
        onToggleOutlook={() => setIsOutlookConnected(!isOutlookConnected)}
      />
    </div>
  );
};

export default Dashboard;
