
import React, { useState } from 'react';
import { Menu, X, MapPin, Users, Home, PlusSquare, Settings, LogOut, Shield, User, ListChecks, LayoutDashboard, Share2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, canViewFullData, currentPath, navigate } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: '홈', path: '/', icon: <Home size={18} /> },
    { label: '골프장', path: '/courses', icon: <MapPin size={18} /> },
  ];

  // Only show these to Senior and Intermediate users
  if (canViewFullData) {
    navItems.push({ label: '관계도', path: '/relationship-map', icon: <Share2 size={18} /> });
    navItems.push({ label: '등록', path: '/write', icon: <PlusSquare size={18} /> });
  }

  // Admin/Senior Only Items
  if (user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN) {
    navItems.push({ label: 'Admin', path: '/admin-dashboard', icon: <Shield size={18} /> });
  }
  
  navItems.push({ label: '설정', path: '/settings', icon: <Settings size={18} /> });

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-100 rounded-full blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-brand-900/90 backdrop-blur-md shadow-sm text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center space-x-2 group focus:outline-none">
            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-all ring-1 ring-white/10">
              <Shield size={20} className="text-brand-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none text-white">GreenMaster</span>
              <span className="text-[10px] text-brand-300 font-medium tracking-wider">INTELLIGENCE</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-full border border-white/5">
            <nav className="flex items-center">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-white text-brand-900 shadow-md transform scale-105'
                      : 'text-brand-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* User Profile & Logout (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
             <div className="flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition-opacity">
                 <div className="text-right hidden lg:block">
                    <div className="text-sm font-bold leading-none text-white">{user?.name}</div>
                    <div className="text-[10px] text-brand-300 mt-0.5">{user?.role.split('(')[0]}</div>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-brand-800 border-2 border-brand-400/50 flex items-center justify-center relative overflow-hidden shadow-inner">
                     {user?.avatar ? (
                       <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                     ) : (
                       <User size={18} className="text-brand-200" />
                     )}
                     <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-brand-900 rounded-full ${user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                 </div>
             </div>
             <button 
               onClick={logout}
               className="p-2 rounded-full text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
               title="로그아웃"
             >
               <LogOut size={18} />
             </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-brand-100 hover:bg-white/10 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-900 border-t border-white/10 absolute w-full left-0 top-16 shadow-xl animate-in slide-in-from-top-5">
            <div className="p-4 space-y-2">
              {/* Mobile User Profile */}
              <div className="flex items-center space-x-3 p-4 mb-4 bg-white/5 rounded-xl border border-white/10">
                 <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center overflow-hidden">
                     {user?.avatar ? (
                       <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                     ) : (
                       <User size={20} className="text-brand-300" />
                     )}
                 </div>
                 <div className="flex-1">
                    <div className="text-white font-bold">{user?.name}</div>
                    <div className="text-xs text-brand-300">{user?.role}</div>
                 </div>
              </div>

              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-white text-brand-900 shadow-md'
                      : 'text-brand-100 hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}

              <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-200 hover:bg-red-900/20 mt-4 border border-red-500/20"
              >
                  <LogOut size={20} />
                  <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full p-4 md:p-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 py-8 text-center text-slate-500 text-sm relative z-10">
        <p>© 2024 GreenMaster Info System. <span className="hidden sm:inline">All rights reserved.</span></p>
        <p className="text-xs mt-1 opacity-70">Logged in as <span className="font-medium text-slate-700">{user?.name}</span></p>
      </footer>
    </div>
  );
};

export default Layout;
