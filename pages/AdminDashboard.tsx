
import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole, UserStatus, Department, UserProfile, SystemLog } from '../types';
import { Users, UserPlus, CheckCircle, XCircle, Shield, AlertTriangle, Search, Activity, Ban, RotateCcw, Lock, Unlock, FileText, Siren, X, ChevronDown, Briefcase, List, Calendar, BarChart2, TrendingUp, Clock } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, allUsers, systemLogs, updateUserStatus, updateUserRole, updateUserDepartment, logs, courses, navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS'>('USERS');

  // --- Modal States ---
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<UserProfile | null>(null);
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState<UserProfile | null>(null);
  
  const [targetRole, setTargetRole] = useState<UserRole>(UserRole.INTERMEDIATE);
  const [targetDept, setTargetDept] = useState<Department>(Department.SALES);
  const [isProcessing, setIsProcessing] = useState(false);

  // Access Control
  React.useEffect(() => {
    if (user && (user.role !== UserRole.ADMIN && user.role !== UserRole.SENIOR)) {
      alert('접근 권한이 없습니다. 관리자/상급자만 접근 가능합니다.');
      navigate('/');
    }
  }, [user, navigate]);

  const pendingUsers = useMemo(() => allUsers.filter(u => u.status === 'PENDING'), [allUsers]);
  
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Aggregation Logic ---
  const getUserStats = (targetUser: UserProfile) => {
      // 1. Logs created by this user name (Note: Author name used in logs, ideally should use ID)
      const userLogs = logs.filter(l => l.author === targetUser.name);
      
      // 2. System Audit Logs for this user ID
      const userActivity = systemLogs.filter(l => l.userId === targetUser.id);
      
      // 3. Last Active
      const lastLoginLog = userActivity.filter(l => l.actionType === 'LOGIN').sort((a,b) => b.timestamp - a.timestamp)[0];
      const lastActionLog = userActivity.sort((a,b) => b.timestamp - a.timestamp)[0];
      
      // 4. Activity Breakdown
      const creates = userActivity.filter(l => l.actionType === 'CREATE').length;
      const updates = userActivity.filter(l => l.actionType === 'UPDATE').length;
      const deletes = userActivity.filter(l => l.actionType === 'DELETE').length;

      return {
          totalDocs: userLogs.length,
          totalActions: userActivity.length,
          lastLogin: lastLoginLog ? new Date(lastLoginLog.timestamp).toLocaleString() : '-',
          lastActive: lastActionLog ? new Date(lastActionLog.timestamp).toLocaleString() : '-',
          breakdown: { creates, updates, deletes },
          recentActivity: userActivity.slice(0, 5) // Last 5 actions
      };
  };

  const getLogIcon = (type: string) => {
      switch(type) {
          case 'CREATE': return <div className="p-1.5 bg-green-100 text-green-600 rounded-full"><CheckCircle size={14}/></div>;
          case 'UPDATE': return <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full"><RotateCcw size={14}/></div>;
          case 'DELETE': return <div className="p-1.5 bg-red-100 text-red-600 rounded-full"><XCircle size={14}/></div>;
          case 'LOGIN': return <div className="p-1.5 bg-purple-100 text-purple-600 rounded-full"><Lock size={14}/></div>;
          default: return <div className="p-1.5 bg-slate-100 text-slate-600 rounded-full"><Activity size={14}/></div>;
      }
  };

  const getLogTargetText = (target: string) => {
      switch(target) {
          case 'LOG': return '업무 일지';
          case 'COURSE': return '골프장';
          case 'PERSON': return '인물';
          case 'USER': return '사용자';
          default: return target;
      }
  };

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SENIOR)) return null;

  // --- Handlers ---
  const openApprovalModal = (target: UserProfile) => {
      setSelectedUserForApproval(target);
      setTargetRole(target.role);
      setTargetDept(target.department);
  };

  const closeApprovalModal = () => {
      setSelectedUserForApproval(null);
      setIsProcessing(false);
  };

  const confirmApproval = async () => {
      if (!selectedUserForApproval) return;
      setIsProcessing(true);
      try {
          if (selectedUserForApproval.role !== targetRole) await updateUserRole(selectedUserForApproval.id, targetRole);
          if (selectedUserForApproval.department !== targetDept) await updateUserDepartment(selectedUserForApproval.id, targetDept);
          await updateUserStatus(selectedUserForApproval.id, 'APPROVED');
          alert('승인되었습니다.');
          closeApprovalModal();
      } catch (error) {
          console.error(error);
          setIsProcessing(false);
      }
  };

  // --- Components ---
  const AnalyticsModal = () => {
      if (!selectedUserForAnalytics) return null;
      const stats = getUserStats(selectedUserForAnalytics);
      const activityScore = Math.min(100, (stats.totalActions * 2) + (stats.totalDocs * 5)); // Simple gamification score

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-6 flex justify-between items-start text-white shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                             {selectedUserForAnalytics.avatar ? <img src={selectedUserForAnalytics.avatar} className="w-full h-full object-cover rounded-full"/> : <Users size={32}/>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{selectedUserForAnalytics.name}</h3>
                            <p className="text-slate-400 text-sm">{selectedUserForAnalytics.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded font-bold">{selectedUserForAnalytics.department}</span>
                                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded border border-slate-600">{selectedUserForAnalytics.role}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUserForAnalytics(null)} className="text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="text-xs text-slate-500 font-bold mb-1">활동 점수</div>
                            <div className="text-2xl font-black text-brand-600">{activityScore}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="text-xs text-slate-500 font-bold mb-1">일지 작성</div>
                            <div className="text-2xl font-black text-slate-800">{stats.totalDocs}건</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="text-xs text-slate-500 font-bold mb-1">시스템 동작</div>
                            <div className="text-2xl font-black text-slate-800">{stats.totalActions}회</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="text-xs text-slate-500 font-bold mb-1">최근 접속</div>
                            <div className="text-xs font-medium text-slate-700 mt-2 leading-tight">{stats.lastLogin}</div>
                        </div>
                    </div>

                    {/* Activity Bar Chart (Simple CSS) */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><Activity size={16} className="mr-2"/> 활동 유형 분포</h4>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            {stats.breakdown.creates > 0 && (
                                <div style={{width: `${(stats.breakdown.creates / stats.totalActions) * 100}%`}} className="bg-green-500 h-full" title="생성"></div>
                            )}
                            {stats.breakdown.updates > 0 && (
                                <div style={{width: `${(stats.breakdown.updates / stats.totalActions) * 100}%`}} className="bg-blue-500 h-full" title="수정"></div>
                            )}
                            {stats.breakdown.deletes > 0 && (
                                <div style={{width: `${(stats.breakdown.deletes / stats.totalActions) * 100}%`}} className="bg-red-500 h-full" title="삭제"></div>
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                            <span className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>생성 {stats.breakdown.creates}</span>
                            <span className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>수정 {stats.breakdown.updates}</span>
                            <span className="flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>삭제 {stats.breakdown.deletes}</span>
                        </div>
                    </div>

                    {/* Recent Timeline */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><Clock size={16} className="mr-2"/> 최근 활동 내역</h4>
                        <div className="space-y-3">
                            {stats.recentActivity.length > 0 ? stats.recentActivity.map(log => (
                                <div key={log.id} className="flex items-start text-sm border-l-2 border-slate-200 pl-3 py-1">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold px-1.5 rounded mr-2 ${
                                                log.actionType === 'CREATE' ? 'bg-green-100 text-green-700' : 
                                                log.actionType === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>{log.actionType}</span>
                                            <span className="text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-slate-700 mt-0.5 text-xs truncate">
                                            <span className="text-slate-500 mr-1">[{getLogTargetText(log.targetType)}]</span>
                                            {log.targetName}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-400 text-xs py-4">최근 활동이 없습니다.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Analytics Modal */}
      {selectedUserForAnalytics && <AnalyticsModal />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Shield className="mr-3 text-brand-700" size={28} /> 
                보안 관리자 대시보드
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-10">시스템 접근 권한 제어 및 사용자 활동을 모니터링합니다.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg mt-4 md:mt-0">
             <button 
                onClick={() => setActiveTab('USERS')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'USERS' ? 'bg-white shadow text-brand-800' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 <Users size={16} className="mr-2"/> 사용자 관리
             </button>
             <button 
                onClick={() => setActiveTab('LOGS')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'LOGS' ? 'bg-white shadow text-brand-800' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 <List size={16} className="mr-2"/> 시스템 로그
             </button>
        </div>
      </div>

      {activeTab === 'USERS' && (
        <div className="space-y-6">
             {/* Security Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">총 사용자</div>
                        <div className="text-2xl font-black text-slate-900">{allUsers.length}</div>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Users size={24}/></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">금일 활동</div>
                        <div className="text-2xl font-black text-brand-600">{systemLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</div>
                    </div>
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-lg"><Activity size={24}/></div>
                </div>
             </div>

             {/* Pending Users Section */}
             {pendingUsers.length > 0 && (
                <section className="border border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-6 py-4 bg-yellow-100/50 border-b border-yellow-200 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-yellow-900 flex items-center">
                            <Siren className="mr-2 text-yellow-600 animate-bounce" size={20}/> 
                            신규 접근 요청
                        </h2>
                        <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full">
                            {pendingUsers.length}건 대기 중
                        </span>
                    </div>
                    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingUsers.map(u => (
                            <div key={u.id} className="bg-white p-5 rounded-lg border-2 border-yellow-100 shadow-sm flex flex-col">
                                <h3 className="font-bold text-slate-900">{u.name}</h3>
                                <p className="text-xs text-slate-500 mb-4">{u.email}</p>
                                <button onClick={() => openApprovalModal(u)} className="bg-green-600 text-white py-2 rounded font-bold text-sm">승인 처리</button>
                            </div>
                        ))}
                    </div>
                </section>
             )}
             
             {/* All Users Table */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                     <h3 className="font-bold text-slate-700">전체 사용자 목록</h3>
                     <div className="relative w-full sm:w-64">
                        <input type="text" placeholder="이름/이메일 검색..." className="w-full border p-2 pl-9 rounded text-sm bg-slate-50 focus:bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                     </div>
                 </div>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50">
                         <tr>
                             <th className="px-6 py-3">사용자</th>
                             <th className="px-6 py-3">부서</th>
                             <th className="px-6 py-3">권한</th>
                             <th className="px-6 py-3">상태</th>
                             <th className="px-6 py-3 text-right">관리</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {filteredUsers.map(u => (
                             <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-6 py-3">
                                     <div className="flex items-center">
                                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 text-slate-500 overflow-hidden">
                                             {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : <Users size={16}/>}
                                         </div>
                                         <div>
                                             <div className="font-medium">{u.name}</div>
                                             <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-6 py-3">{u.department}</td>
                                 <td className="px-6 py-3">
                                     <span className={`text-xs px-2 py-1 rounded border ${
                                         u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                         u.role === UserRole.SENIOR ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 border-slate-200'
                                     }`}>
                                         {u.role.split('(')[0]}
                                     </span>
                                 </td>
                                 <td className="px-6 py-3">
                                     {u.status === 'APPROVED' ? <span className="text-green-600 text-xs font-bold flex items-center"><CheckCircle size={12} className="mr-1"/>정상</span> : 
                                      u.status === 'REJECTED' ? <span className="text-red-600 text-xs font-bold flex items-center"><XCircle size={12} className="mr-1"/>차단</span> : 
                                      <span className="text-yellow-600 text-xs font-bold">승인대기</span>}
                                 </td>
                                 <td className="px-6 py-3 text-right">
                                     <button 
                                        onClick={() => setSelectedUserForAnalytics(u)}
                                        className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-brand-600 hover:border-brand-200 hover:shadow-sm transition-all"
                                     >
                                         <BarChart2 size={14} className="inline mr-1 -mt-0.5"/> 상세 분석
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
      )}

      {/* --- NEW: SYSTEM LOGS TAB --- */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">시스템 감사 로그 (Audit Trail)</h2>
                    <p className="text-xs text-slate-500">사용자의 모든 주요 활동 내역이 여기에 기록됩니다.</p>
                 </div>
                 <div className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                     Total: {systemLogs.length} Records
                 </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-3 w-10"></th>
                            <th className="px-6 py-3">일시</th>
                            <th className="px-6 py-3">사용자</th>
                            <th className="px-6 py-3">활동 유형</th>
                            <th className="px-6 py-3">대상</th>
                            <th className="px-6 py-3">상세 내용</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {systemLogs.length > 0 ? (
                            systemLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3">
                                        {getLogIcon(log.actionType)}
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 font-bold text-slate-700">
                                        {log.userName}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            log.actionType === 'CREATE' ? 'bg-green-50 text-green-700 border-green-100' :
                                            log.actionType === 'DELETE' ? 'bg-red-50 text-red-700 border-red-100' :
                                            log.actionType === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                            {log.actionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-slate-500 mr-2 text-xs">[{getLogTargetText(log.targetType)}]</span>
                                        <span className="font-medium text-slate-800">{log.targetName}</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-xs truncate max-w-xs" title={log.details}>
                                        {log.details || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 bg-slate-50">
                                    <Activity size={24} className="mx-auto mb-2 opacity-20"/>
                                    <p>아직 기록된 시스템 로그가 없습니다.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Approval Modal (Preserved) */}
      {selectedUserForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             {/* ... Modal Content ... */}
             <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                 <h3 className="font-bold text-lg mb-4">가입 승인 처리</h3>
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500">권한 부여</label>
                         <select className="w-full border rounded p-2 mt-1" value={targetRole} onChange={e => setTargetRole(e.target.value as UserRole)}>
                             <option value={UserRole.JUNIOR}>하급자</option>
                             <option value={UserRole.INTERMEDIATE}>중급자</option>
                             <option value={UserRole.SENIOR}>상급자</option>
                             <option value={UserRole.ADMIN}>관리자</option>
                         </select>
                     </div>
                     <div className="flex justify-end space-x-2 mt-6">
                         <button onClick={closeApprovalModal} className="px-4 py-2 border rounded">취소</button>
                         <button onClick={confirmApproval} className="px-4 py-2 bg-green-600 text-white rounded font-bold">승인</button>
                     </div>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
