
import React from 'react';
import { Company } from '../types';
import { db } from '../db';

interface CompaniesProps {
  companies: Company[];
  onRefresh: () => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string, name: string) => void;
  searchQuery: string;
}

const CompaniesPage: React.FC<CompaniesProps> = ({ companies, onRefresh, onEdit, onDelete, searchQuery }) => {
  const filteredCompanies = companies.filter(c => 
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.emails.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => db.exportToCSV(companies, 'GulfVS_Companies');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Contacts</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage and segment your contact database.</p>
        </div>
        <button onClick={handleExport} className="px-6 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all dark:text-white">EXPORT AS CSV</button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                <th className="px-6 py-5">Company Info</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Contact Details</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredCompanies.length > 0 ? filteredCompanies.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{c.companyName}</div>
                    <div className="flex gap-1 mt-1">
                      {c.tags?.map(t => <span key={t} className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">{t}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {c.isInterested ? (
                      <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold uppercase">Interested ⭐</span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full font-bold uppercase">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{c.emails[0]}</div>
                    <div className="text-[10px] text-gray-400">{c.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-5 text-xs text-gray-500 font-medium">{c.location || 'Gulf Region'}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(c)} 
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                        title="Edit Contact"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(c.id, c.companyName)} 
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Purge Contact & Logs"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">No matching records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
