
import React, { useState } from 'react';
import { Bell, Monitor, User, Save, Moon, Sun, LogOut, Shield, Lock, Users, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserRole, UserStatus } from '../types';

const Settings: React.FC = () => {
  const { user, allUsers, updateUserStatus, updateUserRole, logout } = useApp();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [defaultView, setDefaultView] = useState('list');
  const [theme, setTheme] = useState('light');

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleSave = () => {
    // In a real app, this would save to local storage or backend API
    alert('설정이 성공적으로 저장되었습니다.');
  };

  const getStatusBadge = (status: UserStatus) => {
    switch(status) {
        case 'APPROVED': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">승인됨</span>;
        case 'PENDING': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">승인 대기</span>;
        case 'REJECTED': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">거절됨</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">환경 설정</h1>
        <p className="text-slate-500 text-sm">앱의 동작 방식과 계정을 관리합니다.</p>
      </div>

      <div className="grid gap-6">
        {/* Account Information (Real Data) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center pb-2 border-b border-slate-100">
            <Shield className="mr-2 text-brand-600" size={20} /> 
            내 계정 정보
          </h2>
          
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
             <div className="flex items-center space-x-4">
                 <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                     {user?.avatar ? <img src={user.avatar} className="w-full h-full" alt="profile"/> : <User size={24} />}
                 </div>
                 <div>
                     <div className="flex items-center">
                        <h3 className="font-bold text-slate-900 mr-2">{user?.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${user?.role === UserRole.ADMIN ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                            {user?.role}
                        </span>
                     </div>
                     <p className="text-sm text-slate-500">{user?.email} • {user?.department}</p>
                 </div>
             </div>
             <button 
                onClick={logout}
                className="text-sm text-slate-500 hover:text-red-600 font-medium border border-slate-300 bg-white px-3 py-1.5 rounded-lg transition-colors flex items-center hover:border-red-200 hover:bg-red-50"
             >
                 <LogOut size={14} className="mr-1.5" /> 로그아웃
             </button>
          </div>
        </div>

        {/* --- ADMIN ONLY: User Management --- */}
        {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-brand-500">
                <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                    <Users className="mr-2 text-brand-600" size={20} /> 
                    사용자 관리 (관리자 전용)
                </h2>
                <p className="text-sm text-slate-500 mb-6">신규 가입 요청을 승인하거나 권한을 수정합니다.</p>
                
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">전체 사용자 목록 ({allUsers.length}명)</h3>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">사용자</th>
                                    <th className="px-4 py-3">부서</th>
                                    <th className="px-4 py-3">상태</th>
                                    <th className="px-4 py-3">권한</th>
                                    <th className="px-4 py-3 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{u.department}</td>
                                        <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={u.role}
                                                onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                                                className="text-xs border-slate-200 rounded py-1 px-2 focus:ring-brand-500"
                                            >
                                                <option value={UserRole.JUNIOR}>하급자</option>
                                                <option value={UserRole.INTERMEDIATE}>중급자</option>
                                                <option value={UserRole.SENIOR}>상급자</option>
                                                <option value={UserRole.ADMIN}>관리자</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {u.status === 'PENDING' ? (
                                                <div className="flex justify-end space-x-2">
                                                    <button 
                                                        onClick={() => updateUserStatus(u.id, 'APPROVED')}
                                                        className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                        title="승인"
                                                    >
                                                        <CheckCircle size={12} className="mr-1"/> 승인
                                                    </button>
                                                    <button 
                                                        onClick={() => updateUserStatus(u.id, 'REJECTED')}
                                                        className="flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                        title="거절"
                                                    >
                                                        <XCircle size={12} className="mr-1"/> 거절
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">처리완료</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center pb-2 border-b border-slate-100">
            <Bell className="mr-2 text-brand-600" size={20} /> 
            알림 설정
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">주요 업무 알림 (이메일)</h3>
                <p className="text-xs text-slate-500">계약, 공사 등 주요 업무 업데이트 시 이메일을 수신합니다.</p>
              </div>
              <button 
                onClick={() => setEmailNotif(!emailNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${emailNotif ? 'bg-brand-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">앱 푸시 알림</h3>
                <p className="text-xs text-slate-500">모바일 기기에서 실시간 알림을 받습니다.</p>
              </div>
              <button 
                onClick={() => setPushNotif(!pushNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${pushNotif ? 'bg-brand-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${pushNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">마케팅 정보 수신</h3>
                <p className="text-xs text-slate-500">새로운 기능 및 제휴 혜택 정보를 받습니다.</p>
              </div>
              <button 
                onClick={() => setMarketingNotif(!marketingNotif)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${marketingNotif ? 'bg-brand-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${marketingNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center pb-2 border-b border-slate-100">
            <Monitor className="mr-2 text-brand-600" size={20} /> 
            시스템 테마 설정
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">기본 대시보드 보기</label>
                    <select 
                        value={defaultView}
                        onChange={(e) => setDefaultView(e.target.value)}
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-2.5"
                    >
                        <option value="list">목록형 (리스트)</option>
                        <option value="calendar">달력형 (캘린더)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">기본 화면 모드를 선택합니다.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">테마 모드</label>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-all ${theme === 'light' ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Sun size={16} className="mr-2" /> 라이트
                        </button>
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-900 text-white ring-1 ring-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Moon size={16} className="mr-2" /> 다크
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
            <button 
                onClick={handleSave}
                className="flex items-center bg-brand-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-brand-700 transition-all hover:shadow-lg"
            >
                <Save size={18} className="mr-2" />
                설정 저장하기
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
