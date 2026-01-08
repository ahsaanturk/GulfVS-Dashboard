
import React from 'react';
import { Company } from '../types';
import { db } from '../db';

interface CompaniesProps {
  companies: Company[];
  onRefresh: () => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string, name: string) => void;
  onAddLog: (companyId: string, email: string) => void;
  searchQuery: string;
}

const CompaniesPage: React.FC<CompaniesProps> = ({ companies, onRefresh, onEdit, onDelete, onAddLog, searchQuery: globalSearch }) => {
  const [localSearch, setLocalSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'interested' | 'pending'>('all');
  const [sortMode, setSortMode] = React.useState<'nameAsc' | 'nameDesc' | 'dateNew' | 'dateOld'>('nameAsc');

  const filteredCompanies = companies.filter(c => {
    // 1. Search Logic (Global OR Local)
    const search = localSearch || globalSearch;
    const matchesSearch = !search ? true : (
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.emails.some(e => e.toLowerCase().includes(search.toLowerCase())) ||
      (c.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    // 2. Filter Logic
    const matchesFilter =
      statusFilter === 'all' ? true :
        statusFilter === 'interested' ? c.isInterested :
          statusFilter === 'pending' ? !c.isInterested : true;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortMode) {
      case 'nameAsc': return a.companyName.localeCompare(b.companyName);
      case 'nameDesc': return b.companyName.localeCompare(a.companyName);
      case 'dateNew': return b.createdAt - a.createdAt;
      case 'dateOld': return a.createdAt - b.createdAt;
      default: return 0;
    }
  });

  const handleExport = () => {
    const exportData = filteredCompanies.map(c => ({
      'Company Name': c.companyName,
      'Emails': c.emails.join(', '),
      'Phone': c.phoneNumber || '-',
      'Location': c.location || '-',
      'Designation': c.designation || '-',
      'Interest Status': c.isInterested ? 'High Interest' : 'Pending',
      'Tags': (c.tags || []).join(', '),
      'Notes': c.notes || '-'
    }));
    db.exportToExcel(exportData, 'GulfVS_Companies');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Contacts</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm tracking-wide mt-2">Manage and segment your contact database.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Sort Controls */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="nameAsc">Sort: Name (A-Z)</option>
            <option value="nameDesc">Sort: Name (Z-A)</option>
            <option value="dateNew">Sort: Newest First</option>
            <option value="dateOld">Sort: Oldest First</option>
          </select>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
              <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>All</button>
              <button onClick={() => setStatusFilter('interested')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === 'interested' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-slate-400 hover:text-green-500'}`}>Interested</button>
              <button onClick={() => setStatusFilter('pending')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === 'pending' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>Pending</button>
            </div>
            <button onClick={handleExport} className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-all dark:text-white uppercase tracking-widest">Export CSV</button>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-[2rem] shadow-glass border border-slate-200/50 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search companies, emails, or tags..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 overflow-hidden shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase font-black text-slate-400 tracking-widest text-center">
                <th className="px-6 py-6 text-left">Company Info</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-6 py-6 text-left">Contact Details</th>
                <th className="px-6 py-6">Location</th>
                <th className="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredCompanies.length > 0 ? filteredCompanies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                  <td className="px-6 py-5 align-top">
                    <div className="font-black text-slate-900 dark:text-white text-sm tracking-tight group-hover:text-primary transition-colors">{c.companyName}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.tags?.map(t => <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase tracking-wider">{t}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    {c.isInterested ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] bg-green-500/10 text-green-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider border border-green-500/20">
                        Interested
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top">
                    {c.emails[0] && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">📧</div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{c.emails[0]}</span>
                      </div>
                    )}
                    {c.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">📱</div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{c.phoneNumber}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.location || 'Gulf Region'}</span>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onAddLog(c.id, c.emails[0] || '')}
                        className="p-3 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                        title="Add Interaction Log"
                      >
                        📝
                      </button>
                      <button
                        onClick={() => onEdit(c)}
                        className="p-3 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        title="Edit Contact"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(c.id, c.companyName)}
                        className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Purge Contact & Logs"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="mb-4 text-4xl opacity-20">🕵️</div>
                    <p className="text-slate-400 font-bold text-sm">No contacts match your criteria.</p>
                    <button onClick={() => { setLocalSearch(''); setStatusFilter('all'); }} className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Clear Filters</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCompanies.length > 0 ? filteredCompanies.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden">

            {/* Card Status Indicator Strip */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${c.isInterested ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

            <div className="pl-3 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none">{c.companyName}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.tags?.map(t => <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg font-black uppercase tracking-wider">{t}</span>)}
                  </div>
                </div>
                {c.isInterested && <span className="text-xl">⭐</span>}
              </div>

              {/* Details */}
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-black/20 rounded-2xl">
                {c.emails[0] && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-sm shadow-sm">📧</div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono break-all">{c.emails[0]}</span>
                  </div>
                )}
                {c.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-sm shadow-sm">📱</div>
                    <span className="text-xs font-bold text-slate-500 font-mono">{c.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Mobile Actions - Huge Touch Targets */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  onClick={() => onAddLog(c.id, c.emails[0] || '')}
                  className="col-span-2 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>📝 Log</span>
                </button>
                <button
                  onClick={() => onEdit(c)}
                  className="col-span-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xl active:scale-95 transition-all"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(c.id, c.companyName)}
                  className="col-span-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl font-bold text-xl active:scale-95 transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center">
            <div className="text-5xl opacity-20 mb-4">🕵️</div>
            <p className="text-slate-400 font-bold text-sm">No matches.</p>
            <button onClick={() => { setLocalSearch(''); setStatusFilter('all'); }} className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs uppercase">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;


