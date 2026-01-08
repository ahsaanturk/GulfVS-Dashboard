
import React from 'react';
import { EmailLog, Company } from '../types';
import { db } from '../db';

interface LogsProps {
  logs: EmailLog[];
  companies: Company[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}

const LogsPage: React.FC<LogsProps> = ({ logs, companies, onRefresh, onDelete, searchQuery }) => {
  const filteredLogs = logs.filter(l => {
    const comp = companies.find(c => c.id === l.companyId);
    const text = (comp?.companyName || '') + l.emailAddress + (l.note || '') + l.emailType;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Grouping Logic
  const groupedLogs = React.useMemo(() => {
    const groups: { [key: string]: EmailLog[] } = {};
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);

    filteredLogs.forEach(log => {
      const logDate = new Date(log.dateSent).setHours(0, 0, 0, 0);
      let key = new Date(log.dateSent).toLocaleDateString();
      if (logDate === today) key = 'Today';
      else if (logDate === yesterday) key = 'Yesterday';

      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    // Sort groups: Today -> Yesterday -> Dates descending
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Today') return -1;
      if (b[0] === 'Today') return 1;
      if (a[0] === 'Yesterday') return -1;
      if (b[0] === 'Yesterday') return 1;
      // Parse dates for other keys to sort descending
      const firstLogA = new Date(a[1][0]?.dateSent || 0).getTime();
      const firstLogB = new Date(b[1][0]?.dateSent || 0).getTime();
      return firstLogB - firstLogA;
    });
  }, [filteredLogs]);

  const handleExport = () => {
    const exportData = logs.map(l => {
      const comp = companies.find(c => c.id === l.companyId);
      return {
        'Target Company': comp?.companyName || 'Unknown',
        'Email Address': l.emailAddress,
        'Email Type': l.emailType,
        'Date Sent': new Date(l.dateSent).toLocaleDateString(),
        'Status': l.completed ? 'Completed' : 'Pending',
        'Note Summary': l.note || '-'
      };
    });
    db.exportToExcel(exportData, 'GulfVS_Outreach_Logs');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Log Details</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Audit trail of all professional communication.</p>
        </div>
        <button onClick={handleExport} className="px-6 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all dark:text-white">DOWNLOAD FULL LOG (CSV)</button>
      </header>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-750 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-5">Target Company</th>
              <th className="px-6 py-5">Email Type</th>
              <th className="px-6 py-5">Note Summary</th>
              <th className="px-6 py-5">Date Sent</th>
              <th className="px-6 py-5 text-right">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          {groupedLogs.length > 0 ? groupedLogs.map(([group, groupLogs]) => (
            <tbody key={group} className="divide-y divide-gray-50 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <td colSpan={6} className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                  {group} <span className="text-slate-400 font-normal">({groupLogs.length})</span>
                </td>
              </tr>
              {groupLogs.map(log => {
                const comp = companies.find(c => c.id === log.companyId);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{comp?.companyName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{log.emailAddress}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${log.emailType === 'First-time' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {log.emailType}
                      </span>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <p className="text-xs text-gray-500 italic line-clamp-1">{log.note || 'No notes'}</p>
                    </td>
                    <td className="px-6 py-5 text-xs text-gray-400 font-medium">{new Date(log.dateSent).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-right">
                      {log.completed ? (
                        <span className="text-[10px] text-green-500 font-bold uppercase">✓ Completed</span>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold uppercase">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => onDelete(log.id)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Remove entry"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )) : (
            <tbody>
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold">Log is empty.</td></tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-6">
        {groupedLogs.length > 0 ? groupedLogs.map(([group, groupLogs]) => (
          <div key={group} className="space-y-4">
            <h3 className="px-2 text-xs font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50/90 dark:bg-black/20 backdrop-blur-sm py-2 z-10 rounded-lg">
              {group} <span className="opacity-50">({groupLogs.length})</span>
            </h3>
            {groupLogs.map(log => {
              const comp = companies.find(c => c.id === log.companyId);
              return (
                <div key={log.id} className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${log.emailType === 'First-time' ? 'bg-blue-500' : 'bg-orange-500'}`} />

                  <div className="pl-3 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none">{comp?.companyName || 'Unknown'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">{log.emailAddress}</p>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(log.dateSent).toLocaleDateString()}</span>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${log.emailType === 'First-time' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>
                        {log.emailType}
                      </span>
                      {log.completed ? (
                        <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-1 rounded-lg font-black uppercase tracking-wider">✓ Completed</span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded-lg font-black uppercase tracking-wider">Pending</span>
                      )}
                    </div>

                    {/* Note */}
                    <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-2xl">
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                        "{log.note || 'No additional notes provided.'}"
                      </p>
                    </div>

                    {/* Mobile Action */}
                    <button
                      onClick={() => onDelete(log.id)}
                      className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-400 rounded-xl font-black text-xs uppercase tracking-widest border border-red-100 dark:border-red-900/20 active:scale-95 transition-all hover:bg-red-100 hover:text-red-600"
                    >
                      Trash Entry 🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )) : (
          <div className="py-20 text-center">
            <div className="text-5xl opacity-20 mb-4">📭</div>
            <p className="text-slate-400 font-bold text-sm">No log entries found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
