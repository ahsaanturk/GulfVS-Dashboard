
import React from 'react';
import { DashboardMetrics, EmailLog, Company } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  logs: EmailLog[];
  companies: Company[];
  onAddLog: () => void;
  onAddCompany: () => void;
  searchQuery: string;
}

const DashboardPage: React.FC<DashboardProps> = ({ metrics, logs, companies, onAddLog, onAddCompany, searchQuery }) => {
  const filteredLogs = logs.filter(l => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logDate = new Date(l.dateSent);
    logDate.setHours(0, 0, 0, 0);

    // Strict match for today only
    if (logDate.getTime() !== today.getTime()) return false;

    const comp = companies.find(c => c.id === l.companyId);
    const searchString = `${comp?.companyName || ''} ${l.emailAddress} ${l.note || ''} ${l.emailType}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  }).slice(0, 8);

  const StatCard = ({ title, value, icon, color, subValue }: any) => (
    <div className="group bg-white dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] md:rounded-4xl shadow-glass border border-slate-200/50 dark:border-slate-800 transition-all hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl ${color}`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className={`p-3 md:p-4 rounded-2xl bg-opacity-10 ${color} shadow-inner`}>
            <span className="text-xl md:text-2xl">{icon}</span>
          </div>
          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">LIVE</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
          <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        </div>
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <p className="text-[9px] md:text-[10px] text-slate-400 font-bold italic tracking-wide truncate">{subValue}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">Ops <span className="text-accent">HQ</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-sm flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>
            Intelligence Stream
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button onClick={onAddCompany} className="px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center">Contact +</button>
          <button onClick={onAddLog} className="px-6 md:px-8 py-3 md:py-4 bg-accent text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl shadow-accent/40 hover:scale-105 active:scale-95 transition-all text-center">Log +</button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard title="Leads" value={metrics.totalCompanies} icon="💎" color="bg-blue-600" subValue="Market segment" />
        <StatCard title="Activity" value={metrics.emailsToday} icon="📤" color="bg-orange-600" subValue={`${metrics.emailsWeek} weekly`} />
        <StatCard title="Score" value={`${metrics.responseRate}%`} icon="🎯" color="bg-green-600" subValue="Optimized conversion" />
        <StatCard title="Alerts" value={metrics.overdueFollowUps} icon="🔥" color="bg-red-600" subValue="Requires attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <section className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] md:rounded-4xl shadow-glass border border-slate-200/50 dark:border-slate-800 overflow-hidden">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50 backdrop-blur-md">
              <div>
                <h2 className="font-black text-lg md:text-xl text-slate-900 dark:text-white uppercase tracking-widest">Live Feed</h2>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Pulse</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                const company = companies.find(c => c.id === log.companyId);
                return (
                  <div key={log.id} className="p-6 md:p-10 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-xl transition-transform duration-500 group-hover:rotate-12 ${log.emailType === 'First-time' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20' : 'bg-gradient-to-br from-orange-400 to-accent text-white shadow-orange-500/20'}`}>
                      <span className="text-xl md:text-2xl">{log.emailType === 'First-time' ? '🚀' : '🔄'}</span>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-4">
                        <div className="mb-2 sm:mb-0">
                          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-accent transition-colors truncate">{company?.companyName}</p>
                          <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 truncate">{log.emailAddress}</p>
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-end sm:self-auto">{new Date(log.dateSent).toLocaleDateString()}</span>
                      </div>
                      {log.note && (
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-full opacity-40"></div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-4 md:pl-6 py-1 md:py-2 italic line-clamp-3">"{log.note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="p-20 text-center">
                  <p className="text-slate-200 dark:text-slate-800 font-black text-4xl md:text-6xl mb-6">NULL</p>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs md:text-sm">Empty Stream</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6 md:space-y-10">
          <section className="bg-white dark:bg-slate-900/50 p-8 md:p-10 rounded-[2.5rem] md:rounded-4xl shadow-glass border border-slate-200/50 dark:border-slate-800">
            <h2 className="font-black text-[10px] md:text-sm text-slate-400 mb-6 md:mb-10 uppercase tracking-[0.2em] text-center">Conversion Saturation</h2>
            <div className="space-y-6 md:space-y-10">
              <div className="relative">
                <div className="flex mb-4 md:mb-6 items-end justify-between">
                  <div>
                    <span className="text-[8px] md:text-[10px] font-black py-1.5 md:py-2 px-3 md:px-4 uppercase rounded-xl text-accent bg-accent/10 border border-accent/20 tracking-widest">
                      CRITICAL INDEX
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{metrics.responseRate}%</span>
                    <p className="text-[9px] md:text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Interests</p>
                  </div>
                </div>
                <div className="overflow-hidden h-4 md:h-5 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
                  <div
                    style={{ width: `${metrics.responseRate}%` }}
                    className="shadow-[0_0_10px_rgba(244,124,32,0.4)] flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-accent to-orange-400 rounded-full transition-all duration-1000 ease-out"
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                <div className="text-center p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105">
                  <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">Logs</p>
                  <p className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{logs.length}</p>
                </div>
                <div className="text-center p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-transform hover:scale-105">
                  <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">Starred</p>
                  <p className="text-2xl md:text-4xl font-black text-green-500 tracking-tighter">{companies.filter(c => c.isInterested).length}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
