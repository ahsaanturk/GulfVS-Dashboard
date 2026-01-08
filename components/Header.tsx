
import React, { useState } from 'react';
import { EmailLog, Company } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAddCompany: () => void;
  onAddLog: (prefill?: { companyId: string; email: string }) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  notifications: EmailLog[];
  companies: Company[];
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode, onAddCompany, onAddLog, onSearch, searchQuery, notifications, companies, onToggleSidebar }) => {
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800 flex items-center justify-between px-4 md:px-10 z-40 transition-all">
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-3 md:hidden rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-accent transition-all active:scale-90"
        >
          <span className="text-xl">☰</span>
        </button>

        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 md:pl-6 flex items-center text-slate-400 group-focus-within:text-accent transition-colors text-base md:text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              placeholder="Query metadata..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 bg-slate-100/50 dark:bg-slate-900/50 border-none rounded-2xl md:rounded-3xl focus:ring-2 focus:ring-accent/50 outline-none dark:text-white transition-all text-sm font-bold tracking-tight placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-6 ml-4">
        <div className="hidden sm:flex items-center space-x-2 md:space-x-4">
          <button onClick={onToggleDarkMode} className="p-3 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-accent transition-all">
            {isDarkMode ? '🔆' : '🌙'}
          </button>
        </div>

        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-3 md:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 relative hover:text-accent transition-all"
          >
            🔔
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 md:w-6 md:h-6 bg-accent text-white text-[9px] md:text-[10px] flex items-center justify-center rounded-xl font-black shadow-[0_0_10px_rgba(244,124,32,0.5)] border-2 border-white dark:border-slate-950">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-6 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-6 duration-400 translate-x-[-10px] sm:translate-x-0">
              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="font-black text-xs md:text-sm uppercase tracking-[0.2em] text-slate-400">Pipeline Alert</p>
                <span className="text-[9px] md:text-[10px] bg-accent text-white font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">{notifications.length} Critical</span>
              </div>
              <div className="max-h-[25rem] md:max-h-[30rem] overflow-y-auto">
                {notifications.length > 0 ? notifications.map(n => {
                  const comp = companies.find(c => c.id === n.companyId);
                  return (
                    <div
                      key={n.id}
                      className="p-6 md:p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors group"
                      onClick={() => {
                        onAddLog({ companyId: n.companyId, email: n.emailAddress });
                        setShowNotifs(false);
                      }}
                    >
                      <p className="text-base md:text-lg font-black text-slate-900 dark:text-white group-hover:text-accent transition-colors leading-tight">{comp?.companyName}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[150px]">{n.emailAddress}</p>
                        <span className="text-[9px] md:text-[10px] text-accent font-black whitespace-nowrap ml-2">FOLLOW UP</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-16 md:p-20 text-center">
                    <div className="text-5xl md:text-6xl mb-6 opacity-20">🏝️</div>
                    <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Operational Zero</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <button className="w-full py-5 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-t border-slate-100 dark:border-slate-800 hover:text-accent transition-colors">Audit All Actions</button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
