
import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole, UserStatus, Department, UserProfile } from '../types';
import { Users, UserPlus, CheckCircle, XCircle, Shield, AlertTriangle, Search, Activity, Ban, RotateCcw, Lock, Unlock, FileText, Siren, X, ChevronDown, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user, allUsers, updateUserStatus, updateUserRole, updateUserDepartment, logs, courses } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // --- Approval Modal State ---
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
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
  const rejectedUsers = useMemo(() => allUsers.filter(u => u.status === 'REJECTED'), [allUsers]);

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SENIOR)) return null;

  // --- Handlers ---

  const openApprovalModal = (target: UserProfile) => {
      setSelectedUser(target);
      setTargetRole(target.role);
      setTargetDept(target.department);
  };

  const closeApprovalModal = () => {
      setSelectedUser(null);
      setIsProcessing(false);
  };

  const confirmApproval = async () => {
      if (!selectedUser) return;
      setIsProcessing(true);
      
      try {
          // 1. Update Role & Dept first
          if (selectedUser.role !== targetRole) {
              await updateUserRole(selectedUser.id, targetRole);
          }
          if (selectedUser.department !== targetDept) {
              await updateUserDepartment(selectedUser.id, targetDept);
          }
          // 2. Finally Approve
          await updateUserStatus(selectedUser.id, 'APPROVED');
          
          alert(`${selectedUser.name}님의 가입이 승인되었습니다.\n(권한: ${targetRole}, 부서: ${targetDept})`);
          closeApprovalModal();
      } catch (error) {
          console.error(error);
          alert('처리 중 오류가 발생했습니다.');
          setIsProcessing(false);
      }
  };

  const handleReject = (userId: string, userName: string) => {
    if (window.confirm(`[승인 거절]\n'${userName}' 사용자의 가입 요청을 거절하시겠습니까?\n해당 계정은 로그인할 수 없습니다.`)) {
      updateUserStatus(userId, 'REJECTED');
    }
  };

  const handleBlock = (userId: string, userName: string) => {
    if (window.confirm(`[긴급 차단]\n'${userName}' 사용자의 접속을 즉시 차단하시겠습니까?`)) {
      updateUserStatus(userId, 'REJECTED');
    }
  };

  const handleRestore = (userId: string, userName: string) => {
    if (window.confirm(`[계정 복구]\n'${userName}' 사용자의 차단을 해제하고 접근 권한을 복구하시겠습니까?`)) {
      updateUserStatus(userId, 'APPROVED');
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch(status) {
        case 'APPROVED': 
            return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle size={12} className="mr-1"/> 정상 (Active)</span>;
        case 'PENDING': 
            return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"><AlertTriangle size={12} className="mr-1"/> 승인 대기</span>;
        case 'REJECTED': 
            return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200"><Ban size={12} className="mr-1"/> 접근 차단</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Shield className="mr-3 text-brand-700" size={28} /> 
                보안 관리자 대시보드
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-10">시스템 접근 권한 제어 및 사용자 보안 등급을 관리합니다.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center text-sm font-medium text-slate-600">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                System Status: Online
            </div>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">총 사용자</div>
                <div className="text-2xl font-black text-slate-900">{allUsers.length}</div>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Users size={24}/></div>
        </div>
        
        {/* Critical Alert Card */}
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-all ${pendingUsers.length > 0 ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-300' : 'bg-white border-slate-200'}`}>
            <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${pendingUsers.length > 0 ? 'text-yellow-700' : 'text-slate-500'}`}>승인 대기 (Access Req)</div>
                <div className={`text-2xl font-black ${pendingUsers.length > 0 ? 'text-yellow-600' : 'text-slate-900'}`}>{pendingUsers.length}</div>
            </div>
            <div className={`p-3 rounded-lg ${pendingUsers.length > 0 ? 'bg-yellow-100 text-yellow-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                <UserPlus size={24}/>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">차단된 계정</div>
                <div className="text-2xl font-black text-red-600">{rejectedUsers.length}</div>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-lg"><Ban size={24}/></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">시스템 데이터</div>
                <div className="text-2xl font-black text-brand-700">{logs.length + courses.length}</div>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-lg"><Activity size={24}/></div>
        </div>
      </div>

      {/* --- SECTION: PENDING APPROVALS (Security Gate) --- */}
      {pendingUsers.length > 0 && (
        <section className="border border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 bg-yellow-100/50 border-b border-yellow-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-yellow-900 flex items-center">
                    <Siren className="mr-2 text-yellow-600 animate-bounce" size={20}/> 
                    신규 접근 요청 (Action Required)
                </h2>
                <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full">
                    {pendingUsers.length}건 대기 중
                </span>
            </div>
            
            <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map(u => (
                    <div key={u.id} className="bg-white p-5 rounded-lg border-2 border-yellow-100 shadow-sm hover:border-yellow-300 transition-all flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                        
                        <div className="flex items-center space-x-4 mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500 border border-slate-200 shadow-inner overflow-hidden">
                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.name}/> : u.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{u.name}</h3>
                                <div className="flex items-center mt-1 space-x-2">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">{u.department}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-xs text-slate-500 mb-5 bg-slate-50 p-2.5 rounded-md border border-slate-100 font-mono flex items-center">
                            <Lock size={12} className="mr-1.5 opacity-50"/> {u.email}
                        </div>
                        
                        <div className="flex space-x-2 mt-auto">
                            <button 
                                onClick={() => openApprovalModal(u)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow-md flex items-center justify-center"
                            >
                                <CheckCircle size={16} className="mr-1.5"/> 승인 (설정)
                            </button>
                            <button 
                                onClick={() => handleReject(u.id, u.name)}
                                className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center"
                            >
                                <Ban size={16} className="mr-1.5"/> 거절
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* --- SECTION: USER MANAGEMENT TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Users className="mr-2 text-slate-500" size={20}/> 전체 사용자 권한 제어
            </h2>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="이름, 이메일, 부서 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
                    <tr>
                        <th className="px-6 py-4">사용자 식별</th>
                        <th className="px-6 py-4">소속 부서 (Dept)</th>
                        <th className="px-6 py-4">보안 권한 (Role)</th>
                        <th className="px-6 py-4">계정 상태</th>
                        <th className="px-6 py-4 text-right">보안 조치</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                            <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${u.status === 'REJECTED' ? 'bg-red-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`h-10 w-10 rounded-full flex-shrink-0 overflow-hidden mr-3 border-2 ${u.role === UserRole.SENIOR || u.role === UserRole.ADMIN ? 'border-purple-200' : 'border-slate-200'}`}>
                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.name} /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold">{u.name[0]}</div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 flex items-center">
                                                {u.name}
                                                {(u.role === UserRole.SENIOR || u.role === UserRole.ADMIN) && <Shield size={12} className="ml-1.5 text-purple-600" />}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={u.department}
                                        onChange={(e) => updateUserDepartment(u.id, e.target.value as Department)}
                                        disabled={u.status !== 'APPROVED'}
                                        className="text-xs border rounded-md py-1.5 px-2 font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 border-slate-300"
                                    >
                                        {Object.values(Department).map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={u.role}
                                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                                        disabled={u.status !== 'APPROVED'}
                                        className={`text-xs border rounded-md py-1.5 px-2 font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            u.role === UserRole.SENIOR || u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-700 border-slate-300'
                                        }`}
                                    >
                                        <option value={UserRole.JUNIOR}>하급자 (이슈만 조회)</option>
                                        <option value={UserRole.INTERMEDIATE}>중급자 (데이터 조회)</option>
                                        <option value={UserRole.SENIOR}>상급자 (전체 + AI)</option>
                                        <option value={UserRole.ADMIN}>시스템 관리자</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(u.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        {u.status === 'APPROVED' && (
                                            <button 
                                                onClick={() => handleBlock(u.id, u.name)}
                                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded border border-transparent hover:border-red-200 transition-all flex items-center text-xs font-medium group"
                                                title="계정 차단"
                                            >
                                                <Lock size={14} className="mr-1 group-hover:animate-pulse" /> 차단
                                            </button>
                                        )}
                                        {u.status === 'REJECTED' && (
                                            <button 
                                                onClick={() => handleRestore(u.id, u.name)}
                                                className="text-slate-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded border border-transparent hover:border-green-200 transition-all flex items-center text-xs font-medium"
                                                title="권한 복구"
                                            >
                                                <Unlock size={14} className="mr-1" /> 복구
                                            </button>
                                        )}
                                        {u.status === 'PENDING' && (
                                            <span className="text-xs text-yellow-600 font-bold px-2 flex items-center">
                                                <AlertTriangle size={12} className="mr-1"/> 승인 필요
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-slate-50">
                                <Search size={24} className="mx-auto mb-2 opacity-20"/>
                                <p>검색 결과가 없습니다.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Approval Modal --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center">
                        <CheckCircle size={20} className="mr-2 text-green-600"/> 승인 처리 설정
                    </h3>
                    <button onClick={closeApprovalModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-4 bg-brand-50 p-4 rounded-xl border border-brand-100">
                        <div className="w-12 h-12 rounded-full bg-white border border-brand-200 flex items-center justify-center overflow-hidden shrink-0">
                            {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="profile"/> : <span className="font-bold text-brand-600 text-lg">{selectedUser.name[0]}</span>}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{selectedUser.name}</h4>
                            <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">보안 등급 (Role) 부여</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-white border border-slate-300 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                                >
                                    <option value={UserRole.JUNIOR}>하급자 (이슈만 조회)</option>
                                    <option value={UserRole.INTERMEDIATE}>중급자 (일반 조회/등록)</option>
                                    <option value={UserRole.SENIOR}>상급자 (AI 기능 포함)</option>
                                    <option value={UserRole.ADMIN}>시스템 관리자</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">* 승인 즉시 해당 권한이 적용됩니다.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">소속 부서 (Dept) 확정</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-white border border-slate-300 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    value={targetDept}
                                    onChange={(e) => setTargetDept(e.target.value as Department)}
                                >
                                    {Object.values(Department).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <Briefcase className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                    <button 
                        onClick={closeApprovalModal}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={confirmApproval}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center"
                    >
                        {isProcessing ? '처리 중...' : '최종 승인'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
