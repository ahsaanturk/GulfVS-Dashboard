
import React from 'react';
import { Company, EmailLog, EmailType } from '../types';
import { db } from '../db';

interface ActionsProps {
  companies: Company[];
  logs: EmailLog[];
  onRefresh: () => void;
  onFollowUp: (prefill: { companyId: string; email: string; sourceLogId?: string; emailType?: EmailType }) => void;
}

const ActionsPage: React.FC<ActionsProps> = ({ companies, logs, onRefresh, onFollowUp }) => {
  const todayStart = new Date().setHours(0,0,0,0);
  
  const dueToday = logs.filter(l => l.followUpDate && !l.completed && new Date(l.followUpDate).setHours(0,0,0,0) === todayStart);
  const overdue = logs.filter(l => l.followUpDate && !l.completed && new Date(l.followUpDate).setHours(0,0,0,0) < todayStart);
  const contactedIds = new Set(logs.map(l => l.companyId));
  const coldLeads = companies.filter(c => !contactedIds.has(c.id));
  const upcoming = logs.filter(l => l.followUpDate && !l.completed && new Date(l.followUpDate).setHours(0,0,0,0) > todayStart);

  const ActionSection = ({ title, items, icon, color, renderItem }: any) => (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] md:rounded-[2.5rem] shadow-glass border border-slate-200/50 dark:border-slate-800 overflow-hidden flex flex-col h-full">
      <div className={`px-6 md:px-8 py-5 md:py-6 flex items-center justify-between ${color}`}>
        <div className="flex items-center space-x-3 md:space-x-4">
          <span className="text-xl md:text-2xl bg-white/20 p-2 rounded-xl backdrop-blur-sm">{icon}</span>
          <h3 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] text-white">{title}</h3>
        </div>
        <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md">{items.length}</span>
      </div>
      <div className="flex-1 divide-y divide-slate-50 dark:divide-slate-800/50 overflow-y-auto max-h-[400px]">
        {items.length > 0 ? items.map(renderItem) : (
          <div className="p-16 md:p-20 text-center">
            <p className="text-slate-300 dark:text-slate-700 font-black text-xs uppercase tracking-widest italic">All clear</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Operations</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm tracking-wide mt-2">PRIORITY INTERVENTION STREAMS</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <ActionSection 
          title="Due Today" 
          icon="⚡" 
          color="bg-orange-500 shadow-lg shadow-orange-500/20"
          items={dueToday} 
          renderItem={(log: EmailLog) => {
            const comp = companies.find(c => c.id === log.companyId);
            return (
              <div key={log.id} className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors gap-4">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white tracking-tight text-lg truncate">{comp?.companyName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider truncate">{log.emailAddress}</p>
                </div>
                <button 
                  onClick={() => onFollowUp({ companyId: log.companyId, email: log.emailAddress, sourceLogId: log.id })} 
                  className="bg-primary text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto uppercase tracking-widest"
                >
                  FOLLOW-UP
                </button>
              </div>
            );
          }}
        />

        <ActionSection 
          title="Overdue" 
          icon="🔥" 
          color="bg-red-500 shadow-lg shadow-red-500/20"
          items={overdue} 
          renderItem={(log: EmailLog) => {
            const comp = companies.find(c => c.id === log.companyId);
            return (
              <div key={log.id} className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/50 transition-colors gap-4">
                <div className="min-w-0">
                  <p className="font-black text-red-600 dark:text-red-400 tracking-tight text-lg truncate">{comp?.companyName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Missed: {new Date(log.followUpDate!).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => onFollowUp({ companyId: log.companyId, email: log.emailAddress, sourceLogId: log.id })} 
                  className="bg-red-600 text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-xl w-full sm:w-auto uppercase tracking-widest"
                >
                  FOLLOW-UP
                </button>
              </div>
            );
          }}
        />

        <ActionSection 
          title="Cold Leads" 
          icon="❄️" 
          color="bg-blue-600 shadow-lg shadow-blue-500/20"
          items={coldLeads} 
          renderItem={(c: Company) => (
            <div key={c.id} className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
              <div className="min-w-0">
                <p className="font-black text-slate-900 dark:text-white tracking-tight text-lg truncate">{c.companyName}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest truncate">{c.emails[0]}</p>
              </div>
              <button 
                onClick={() => onFollowUp({ companyId: c.id, email: c.emails[0], emailType: 'First-time' })} 
                className="bg-blue-600 text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto uppercase tracking-widest"
              >
                START CHATTING
              </button>
            </div>
          )}
        />

        <ActionSection 
          title="Upcoming Pipeline" 
          icon="📅" 
          color="bg-primary shadow-lg shadow-primary/20"
          items={upcoming} 
          renderItem={(log: EmailLog) => {
            const comp = companies.find(c => c.id === log.companyId);
            return (
              <div key={log.id} className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white tracking-tight text-lg truncate">{comp?.companyName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Scheduled: {new Date(log.followUpDate!).toLocaleDateString()}</p>
                </div>
                <div className="shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(26,45,90,0.5)]"></div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default ActionsPage;
