
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Users, Home, PlusSquare, Settings, LogOut, Shield, User, ListChecks, LayoutDashboard, Share2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: '홈/대시보드', path: '/', icon: <Home size={20} /> },
    { label: '골프장 찾기', path: '/courses', icon: <MapPin size={20} /> },
    { label: '관계도', path: '/relationship-map', icon: <Share2 size={20} /> },
    { label: '정보 등록', path: '/write', icon: <PlusSquare size={20} /> },
    { label: '설정', path: '/settings', icon: <Settings size={20} /> },
  ];

  if (user?.role === UserRole.ADMIN) {
    navItems.push({ label: 'Admin Todo', path: '/admin-todos', icon: <ListChecks size={20} /> });
    navItems.push({ label: 'Admin 대시보드', path: '/admin-dashboard', icon: <LayoutDashboard size={20} /> });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-brand-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-brand-800 p-1.5 rounded-lg group-hover:bg-brand-700 transition-colors">
              <Shield size={20} className="text-brand-100" />
            </div>
            <span className="text-xl font-bold tracking-tight">GreenMaster</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-700 text-white'
                      : 'text-brand-100 hover:bg-brand-800'
                  }`}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Profile & Logout (Desktop) */}
            <div className="border-l border-brand-700 pl-4 flex items-center space-x-3">
               <div className="text-right hidden lg:block">
                  <div className="text-sm font-bold leading-none">{user?.name}</div>
                  <div className="text-[10px] text-brand-300 uppercase mt-0.5">{user?.role}</div>
               </div>
               <div className="w-8 h-8 rounded-full bg-brand-700 border border-brand-500 flex items-center justify-center relative">
                   {user?.avatar ? (
                     <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                   ) : (
                     <User size={16} />
                   )}
                   <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-brand-900 rounded-full ${user?.role === UserRole.ADMIN ? 'bg-yellow-400' : 'bg-blue-400'}`}></span>
               </div>
               <button 
                 onClick={logout}
                 className="p-1.5 rounded-md text-brand-300 hover:text-white hover:bg-brand-800 transition-colors"
                 title="로그아웃"
               >
                 <LogOut size={18} />
               </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-brand-100 hover:bg-brand-800 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-800 pb-4 px-4 pt-2 space-y-1 border-t border-brand-700 animate-in slide-in-from-top-2">
            
            {/* Mobile User Profile */}
            <div className="flex items-center space-x-3 p-3 mb-2 bg-brand-900/50 rounded-lg border border-brand-700">
               <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center">
                   {user?.avatar ? (
                     <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                   ) : (
                     <User size={20} />
                   )}
               </div>
               <div className="flex-1">
                  <div className="text-white font-bold">{user?.name}</div>
                  <div className="text-xs text-brand-300">{user?.email}</div>
               </div>
               <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user?.role === UserRole.ADMIN ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700' : 'bg-blue-900/30 text-blue-200 border-blue-700'}`}>
                   {user?.role}
               </div>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-brand-900 text-white border-l-4 border-brand-400'
                    : 'text-brand-100 hover:bg-brand-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-red-200 hover:bg-red-900/30 mt-2 border-t border-brand-700/50"
            >
                <LogOut size={20} />
                <span>로그아웃</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 md:p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm">
        <p>© 2024 GreenMaster Info. Logged in as <span className="font-medium text-slate-700">{user?.name}</span> ({user?.role})</p>
      </footer>
    </div>
  );
};

export default Layout;
