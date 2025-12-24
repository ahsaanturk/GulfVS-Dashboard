
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

  const handleExport = () => db.exportToCSV(logs, 'GulfVS_Outreach_Logs');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Log Details</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Audit trail of all professional communication.</p>
        </div>
        <button onClick={handleExport} className="px-6 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all dark:text-white">DOWNLOAD FULL LOG (CSV)</button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
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
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filteredLogs.length > 0 ? filteredLogs.map(log => {
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
            }) : (
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold">Log is empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsPage;
