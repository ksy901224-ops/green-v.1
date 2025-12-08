
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Department } from '../types';
import { Shield, Lock, ArrowRight, UserPlus, Mail, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  
  // Signup State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState<Department>(Department.SALES);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clear messages when switching modes
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [mode]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim()) {
        setErrorMsg("이메일을 입력해주세요.");
        return;
    }

    if (!isValidEmail(loginEmail)) {
        setErrorMsg("올바른 이메일 형식이 아닙니다.");
        return;
    }

    setIsLoading(true);
    
    try {
        // Simulated network delay for better UX feel
        await new Promise(resolve => setTimeout(resolve, 600));
        const error = await login(loginEmail);
        if (error) {
            setErrorMsg(error);
        }
    } catch (e) {
        setErrorMsg("로그인 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim()) {
        setErrorMsg("이름과 이메일을 모두 입력해주세요.");
        return;
    }

    if (!isValidEmail(regEmail)) {
        setErrorMsg("올바른 이메일 형식이 아닙니다.");
        return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // UX delay
      await register(regName, regEmail, regDept);
      
      // Auto switch to login with success message
      setMode('LOGIN');
      setLoginEmail(regEmail);
      setSuccessMsg("가입 요청이 성공적으로 전송되었습니다! 관리자 승인 후 로그인 가능합니다.");
      
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegDept(Department.SALES);

    } catch (e: any) {
      setErrorMsg(e.message || "가입 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-900 rounded-b-[3rem] shadow-2xl z-0"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-brand-500 opacity-10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-xl mb-5 transform hover:scale-105 transition-transform duration-300">
             <div className="bg-brand-50 p-2.5 rounded-xl border border-brand-100">
               <Shield size={36} className="text-brand-600" />
             </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">GreenMaster Info</h1>
          <p className="text-brand-200 text-sm font-medium tracking-wide">골프장 통합 정보 관리 시스템</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100/50 backdrop-blur-sm">
          {/* Toggle Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 relative">
            <button
              onClick={() => setMode('LOGIN')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${mode === 'LOGIN' ? 'bg-white text-brand-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode('SIGNUP')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${mode === 'SIGNUP' ? 'bg-white text-brand-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              회원가입
            </button>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm flex items-start animate-in fade-in slide-in-from-top-2 shadow-sm">
                <CheckCircle size={18} className="mr-2 mt-0.5 shrink-0 text-green-600"/>
                <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start animate-in fade-in slide-in-from-top-2 shadow-sm">
                <AlertTriangle size={18} className="mr-2 mt-0.5 shrink-0 text-red-500"/>
                <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
               <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">직원 로그인</h2>
               <p className="text-sm text-slate-500 mb-8 text-center">승인된 계정 이메일로 접속하세요.</p>
               
               <form onSubmit={handleLogin} className="space-y-5">
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">이메일</label>
                   <div className="relative group">
                     <Mail className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                     <input 
                       type="email" 
                       className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                       placeholder="user@greenmaster.com"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       autoComplete="email"
                     />
                   </div>
                 </div>

                 {/* Demo Hint */}
                 <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-center">
                    <span className="font-bold mr-1">Admin Demo:</span> admin@greenmaster.com
                 </div>
                 
                 <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98] ${
                       isLoading
                         ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                         : 'bg-brand-900 text-white hover:bg-brand-800'
                     }`}
                   >
                     {isLoading ? (
                       <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        확인 중...
                       </>
                     ) : (
                       <>
                         로그인 <ArrowRight size={20} className="ml-2" />
                       </>
                     )}
                   </button>
                 </div>
               </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">신규 계정 신청</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">관리자 승인 절차가 필요합니다.</p>
              
              <form onSubmit={handleSignup} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">이름 (실명)</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                     placeholder="예: 홍길동"
                     value={regName}
                     onChange={(e) => setRegName(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">이메일</label>
                   <input 
                     type="email" 
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                     placeholder="user@example.com"
                     value={regEmail}
                     onChange={(e) => setRegEmail(e.target.value)}
                   />
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">소속 부서</label>
                     <div className="relative">
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all appearance-none"
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value as Department)}
                        >
                            {Object.values(Department).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">▼</div>
                     </div>
                 </div>
                 
                 <div className="text-xs text-orange-700 bg-orange-50 p-3 rounded-xl flex items-start border border-orange-100">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0"/>
                    <span className="leading-relaxed">회원가입 후 <strong>관리자의 승인</strong>이 완료되어야 시스템을 이용하실 수 있습니다.</span>
                 </div>

                 <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={20} />
                            처리 중...
                        </>
                     ) : (
                        <>
                            <UserPlus className="mr-2" size={20}/> 가입 신청하기
                        </>
                     )}
                   </button>
                 </div>
              </form>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center uppercase tracking-widest font-bold">
              <Lock size={10} className="mr-1.5" /> Secure Connection Established
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-slate-400 text-xs font-medium">
        © 2024 GreenMaster Info System. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
