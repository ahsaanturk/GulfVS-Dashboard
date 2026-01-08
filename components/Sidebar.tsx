
import React from 'react';
import { Page } from '../types';
import { db } from '../db';

interface SidebarProps {
  isOpen: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onReset: () => void;
  user: string;
  role: string;
  onLogout: () => void;
  onUserToggle: () => void;
  stats: { companies: number, logs: number };
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, onPageChange, onReset, user, role, onLogout, onUserToggle, stats, currentTheme, onThemeChange }) => {
  const menuItems = [
    { id: Page.Dashboard, label: 'Overview', icon: '⚡' },
    { id: Page.Actions, label: 'Strategic Actions', icon: '🎯' },
    { id: Page.Companies, label: 'Contacts', icon: '💎' },
    { id: Page.Logs, label: 'Log Details', icon: '📟' },
    { id: Page.Analytics, label: 'Growth Data', icon: '📊' },
  ];

  const [isOnline, setIsOnline] = React.useState(db.getRemoteStatus());

  React.useEffect(() => {
    const unsub = db.onStatusChange(setIsOnline);
    return () => unsub();
  }, []);

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-72 bg-primary text-white flex flex-col z-50 p-6 
      transition-transform duration-500 ease-in-out overflow-y-auto invisible-scroll
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Brand Identity */}
      <div className="flex items-center space-x-4 mb-12 px-2 shrink-0">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-tr from-accent to-orange-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(244,124,32,0.3)] transform -rotate-6">G</div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-primary-dark"></div>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter">GULF<span className="text-accent">VS</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">Campaign Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 shrink-0">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full group flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 ${currentPage === item.id
              ? 'bg-accent text-white shadow-2xl shadow-accent/20 translate-x-1'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className={`text-xl transition-transform duration-300 group-hover:scale-125 ${currentPage === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.icon}
            </span>
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile & Utilities - Pushed to bottom but scrolls with content */}
      <div className="space-y-4 mt-auto pt-12 shrink-0">
        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Operator</p>
            {role === 'admin' && (
              <button
                onClick={() => onPageChange(Page.Settings)}
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-colors ${currentPage === Page.Settings ? 'bg-accent text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'}`}
              >
                Manager Console
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-black text-accent border border-white/10">
              {user.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white leading-none mb-1">{user}</p>
                <button
                  onClick={onLogout}
                  className="text-[10px] bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-2 py-0.5 rounded transition-all font-bold uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-400' : 'bg-amber-500'}`}></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>

          {/* Theme Picker */}
          <div className="mb-4 bg-black/10 rounded-2xl p-3 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Theme</span>
            <div className="flex space-x-2">
              {[
                { id: 'theme-ocean', color: '#1a2d5a', active: '#f47c20' },
                { id: 'theme-forest', color: '#022c22', active: '#10b981' },
                { id: 'theme-berry', color: '#4a044e', active: '#db2777' },
                { id: 'theme-midnight', color: '#0f172a', active: '#6366f1' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${currentTheme === t.id ? 'border-white scale-125' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: t.id === currentTheme ? t.active : t.color }}
                  title={t.id.replace('theme-', '')}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => onPageChange(Page.ImportExport)}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 ${currentPage === Page.ImportExport
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="text-lg">📂</span>
            <span className="font-bold text-xs uppercase tracking-widest">Import / Export</span>
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors"
        >
          Reset Environment
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
