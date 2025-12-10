
import React, { useState } from 'react';
import { LogEntry, Department, UserRole } from '../types';
import { Calendar, Tag, Image as ImageIcon, Sparkles, Loader2, X, Edit2, Trash2, ChevronDown, ChevronUp, Info, CheckCircle, User, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { analyzeLogEntry } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';

interface LogCardProps {
  log: LogEntry;
}

const getDeptBadgeStyle = (dept: Department) => {
  switch (dept) {
    case Department.SALES: return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
    case Department.RESEARCH: return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20';
    case Department.CONSTRUCTION: return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20';
    case Department.CONSULTING: return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20';
  }
};

const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const { deleteLog, user, canUseAI, navigate } = useApp();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showInsight) return;
    if (insight) { setShowInsight(true); return; }

    setIsLoading(true);
    try {
      const result = await analyzeLogEntry(log);
      setInsight(result);
      setShowInsight(true);
    } catch (error) {
      console.error(error);
      alert('AI 분석에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("정말로 이 업무 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
      deleteLog(log.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/write', { log });
  };

  // Structured parser for Gemini output
  const renderStructuredInsight = (text: string) => {
    // Regex to split by numbered sections (e.g., "1. **Title**:")
    const parts = text.split(/(?=\d+\.\s\*\*)/);

    return parts.map((part, index) => {
      const headerMatch = part.match(/\*\*(.*?)\*\*/);
      
      if (!headerMatch) {
        if(part.trim()) return <p key={index} className="mb-4 text-sm text-slate-600 px-1">{part}</p>;
        return null;
      }

      const rawTitle = headerMatch[1].replace(/:$/, '').trim(); 
      // Clean up body: remove the header match and the numbering/colons at start
      const body = part.replace(headerMatch[0], '').replace(/^\d+\.\s*:?/, '').trim(); 

      let styleClass = "bg-slate-50 border-slate-200";
      let titleClass = "text-slate-700";
      let Icon = Info;

      if (rawTitle.includes("요약")) {
        styleClass = "bg-indigo-50 border-indigo-100";
        titleClass = "text-indigo-700";
        Icon = Lightbulb;
      } else if (rawTitle.includes("리스크") || rawTitle.includes("함의")) {
        styleClass = "bg-amber-50 border-amber-100";
        titleClass = "text-amber-700";
        Icon = AlertTriangle;
      } else if (rawTitle.includes("액션") || rawTitle.includes("추천")) {
        styleClass = "bg-emerald-50 border-emerald-100";
        titleClass = "text-emerald-700";
        Icon = Target;
      }

      return (
        <div key={index} className={`rounded-xl border p-4 mb-4 last:mb-0 shadow-sm transition-all hover:shadow-md ${styleClass}`}>
          <h4 className={`font-bold text-sm mb-2 flex items-center ${titleClass}`}>
            <Icon size={16} className="mr-2" />
            {rawTitle}
          </h4>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line pl-1">
            {body.replace(/^:/, '').trim()}
          </p>
        </div>
      );
    });
  };

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SENIOR;
  const shouldTruncate = log.content.length > 100;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-lg transition-all duration-300 group relative flex flex-col h-full transform hover:-translate-y-1">
        
        {/* Header Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ring-1 inset-0 ${getDeptBadgeStyle(log.department)}`}>
              {log.department}
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center">
               <span className="mx-1.5">•</span> {log.courseName}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center text-xs text-slate-400 font-mono">
              {log.date}
            </div>
            
            {/* Admin Actions (Always Visible) */}
            {isAdmin && (
              <div className="flex items-center space-x-1 ml-3 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button onClick={handleEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="수정">
                  <Edit2 size={14} />
                </button>
                <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="삭제">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-brand-700 transition-colors">
            {log.title}
        </h3>
        
        {/* Content Body */}
        <div 
          className={`relative text-slate-600 text-sm leading-relaxed whitespace-pre-line overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-[1000px] mb-4' : 'max-h-20 mb-1'
          }`}
        >
            {log.content}
            {!isExpanded && shouldTruncate && (
              <div 
                className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white via-white/90 to-transparent cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              />
            )}
        </div>
        
        {shouldTruncate && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="flex items-center text-xs font-bold text-slate-400 hover:text-brand-600 mb-4 transition-colors focus:outline-none w-fit"
          >
            {isExpanded ? <>접기 <ChevronUp size={14} className="ml-1"/></> : <>더 읽기 <ChevronDown size={14} className="ml-1"/></>}
          </button>
        )}

        {/* Images */}
        {log.imageUrls && log.imageUrls.length > 0 && (
          <div className="flex overflow-x-auto space-x-2 mb-4 pb-2 no-scrollbar">
            {log.imageUrls.map((url, idx) => (
              <img key={idx} src={url} alt="Attachment" className="h-24 w-24 object-cover rounded-lg flex-shrink-0 border border-slate-100 shadow-sm hover:scale-105 transition-transform" />
            ))}
          </div>
        )}

        {/* Footer Info & Actions */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden flex-1 flex-wrap gap-y-2">
            {log.tags?.map((tag, idx) => (
              <span key={idx} className="flex items-center text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium border border-slate-200">
                <Tag size={10} className="mr-1 opacity-70" /> {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center space-x-3 shrink-0 ml-2">
              <span className="text-xs text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-full">
                  <User size={10} className="mr-1"/> {log.author}
              </span>
              {canUseAI && (
                  <button 
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all shadow-sm ${
                          showInsight 
                          ? 'bg-purple-100 text-purple-700 border-purple-200 ring-2 ring-purple-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 hover:text-white hover:border-transparent'
                      }`}
                  >
                      {isLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                      {isLoading ? '분석 중...' : 'AI Insight'}
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* AI Insight Modal Popup */}
      {showInsight && insight && !isLoading && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowInsight(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh] ring-1 ring-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-5 flex justify-between items-center shrink-0">
               <div className="flex items-center text-white">
                  <div className="bg-white/20 p-2 rounded-xl mr-3 shadow-inner">
                    <Sparkles className="text-amber-300" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none tracking-tight">AI Insight Report</h3>
                    <p className="text-xs text-purple-200 mt-1 opacity-90 font-medium">Powered by Gemini 2.5 Flash</p>
                  </div>
               </div>
               <button 
                  onClick={() => setShowInsight(false)} 
                  className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
                
                {/* Source Context Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-4">
                   <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                       <Info size={20} />
                   </div>
                   <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>분석 대상 (Source)</span>
                          <span className="text-slate-400 font-mono font-normal">{log.date}</span>
                      </div>
                      <div className="font-bold text-slate-800 text-sm mb-0.5">{log.courseName} <span className="font-normal text-slate-400">| {log.department}</span></div>
                      <div className="text-xs text-slate-600 line-clamp-1">{log.title}</div>
                   </div>
                </div>

                {/* AI Content - Structured */}
                <div className="space-y-1">
                    {renderStructuredInsight(insight)}
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
               <button 
                 onClick={() => setShowInsight(false)} 
                 className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors text-sm shadow-md hover:shadow-lg transform active:scale-95 flex items-center"
               >
                  <CheckCircle size={16} className="mr-2" />
                  확인 및 닫기
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogCard;
