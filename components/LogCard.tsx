
import React, { useState } from 'react';
import { LogEntry, Department, UserRole } from '../types';
import { Calendar, Tag, Image as ImageIcon, Sparkles, Loader2, X, Edit2, Trash2, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { analyzeLogEntry } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface LogCardProps {
  log: LogEntry;
}

const getDeptColor = (dept: Department) => {
  switch (dept) {
    case Department.SALES: return 'bg-blue-100 text-blue-800 border-blue-200';
    case Department.RESEARCH: return 'bg-purple-100 text-purple-800 border-purple-200';
    case Department.CONSTRUCTION: return 'bg-orange-100 text-orange-800 border-orange-200';
    case Department.CONSULTING: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const { deleteLog, user, canUseAI } = useApp();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showInsight) {
      return;
    }

    if (insight) {
      setShowInsight(true);
      return;
    }

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
    navigate('/write', { state: { log } });
  };

  const renderInsightContent = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-brand-800 block mt-3 mb-1 text-base border-l-4 border-brand-500 pl-2 bg-brand-50/50 py-1 rounded-r">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SENIOR;
  const shouldTruncate = log.content.length > 100;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow relative group">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getDeptColor(log.department)}`}>
              {log.department}
            </span>
            <span className="text-sm text-slate-500 font-medium">{log.courseName}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs text-slate-400">
              <Calendar size={12} className="mr-1" />
              {log.date}
            </div>
            
            {/* Edit/Delete Actions - Restricted to ADMIN/SENIOR */}
            {isAdmin && (
              <div className="flex items-center space-x-1 pl-2 border-l border-slate-100 ml-2">
                <button 
                  onClick={handleEdit} 
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                  title="수정"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={handleDelete} 
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-1 pr-16">{log.title}</h3>
        
        {/* Content with Expand/Collapse Animation */}
        <div 
          className={`relative text-slate-600 text-sm whitespace-pre-line overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-[1000px] mb-4' : 'max-h-20 mb-1'
          }`}
        >
            {log.content}
            
            {/* Gradient Overlay when collapsed */}
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
            className="flex items-center text-xs font-bold text-slate-400 hover:text-brand-600 mb-3 transition-colors focus:outline-none"
          >
            {isExpanded ? (
              <>
                접기 <ChevronUp size={14} className="ml-1"/>
              </>
            ) : (
              <>
                더 읽기 <ChevronDown size={14} className="ml-1"/>
              </>
            )}
          </button>
        )}

        {log.imageUrls && log.imageUrls.length > 0 && (
          <div className="flex overflow-x-auto space-x-2 mb-3 pb-2">
            {log.imageUrls.map((url, idx) => (
              <img key={idx} src={url} alt="Attachment" className="h-20 w-20 object-cover rounded-md flex-shrink-0 border border-slate-200" />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
          <div className="flex items-center space-x-2 overflow-hidden flex-1 flex-wrap gap-y-1">
            {log.tags?.map((tag, idx) => (
              <span key={idx} className="flex items-center text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                <Tag size={10} className="mr-1" /> {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center space-x-3 shrink-0 ml-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                  작성자: {log.author}
              </span>
              {canUseAI && (
                  <button 
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                          showInsight 
                          ? 'bg-purple-100 text-purple-700 border-purple-200 ring-2 ring-purple-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 hover:shadow-sm'
                      }`}
                      title="이 업무 기록의 맥락과 리스크를 AI로 분석합니다"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowInsight(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 flex justify-between items-center shrink-0">
               <div className="flex items-center text-white">
                  <div className="bg-white/20 p-1.5 rounded-lg mr-3">
                    <Sparkles className="text-yellow-300" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none">AI Insight Report</h3>
                    <p className="text-[11px] text-purple-200 mt-0.5 opacity-90">Deep analysis by Gemini 2.5 Flash</p>
                  </div>
               </div>
               <button 
                  onClick={() => setShowInsight(false)} 
                  className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* Source/Context Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 flex items-start gap-3">
                   <Info className="text-slate-400 mt-0.5 shrink-0" size={16} />
                   <div className="flex-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">분석 대상 (Source)</div>
                      <div className="font-bold text-slate-800 text-sm">{log.courseName} ({log.department})</div>
                      <div className="text-xs text-slate-600 mt-0.5">{log.date} • {log.title}</div>
                   </div>
                </div>

                {/* AI Content */}
                <div className="space-y-4 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {renderInsightContent(insight)}
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <button 
                 onClick={() => setShowInsight(false)} 
                 className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors text-sm shadow-sm"
               >
                  닫기
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogCard;