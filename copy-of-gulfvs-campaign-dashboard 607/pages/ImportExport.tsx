
import React, { useState, useRef } from 'react';
import { Company, EmailLog } from '../types';
import { db } from '../db';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

interface ImportExportProps {
  companies: Company[];
  logs: EmailLog[];
}

type DataSource = 'logs' | 'companies';
type Timeframe = 'daily' | 'monthly' | 'all';

const ImportExportPage: React.FC<ImportExportProps> = ({ companies, logs }) => {
  const [source, setSource] = useState<DataSource>('logs');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ added: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vaultInputRef = useRef<HTMLInputElement>(null);

  const getFilteredData = () => {
    let data: any[] = source === 'logs' ? [...logs] : [...companies];
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    if (timeframe === 'daily') {
      data = data.filter(item => {
        const date = source === 'logs' ? item.dateSent : item.createdAt;
        return date >= today;
      });
    } else if (timeframe === 'monthly') {
      data = data.filter(item => {
        const date = source === 'logs' ? item.dateSent : item.createdAt;
        return date >= monthStart;
      });
    }

    if (source === 'logs') {
      return data.map(l => {
        const company = companies.find(c => c.id === l.companyId);
        return {
          'Target Company': company?.companyName || 'Unknown',
          'Email Address': l.emailAddress,
          'Type': l.emailType,
          'Date Sent': new Date(l.dateSent).toLocaleString(),
          'Note': l.note || '-',
          'Follow-up Date': l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '-',
          'Status': l.completed ? 'Completed' : 'Pending'
        };
      });
    } else {
      return data.map(c => ({
        'Company Name': c.companyName,
        'Emails': c.emails.join(', '),
        'Phone': c.phoneNumber || '-',
        'Tags': (c.tags || []).join(', '),
        'Location': c.location || '-',
        'Interest Status': c.isInterested ? 'High Interest' : 'Pending',
        'Created At': new Date(c.createdAt).toLocaleString(),
        'Notes': c.notes || '-'
      }));
    }
  };

  const handleExportJSON = () => {
    const data = getFilteredData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GulfVS_${source}_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const data = getFilteredData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `GulfVS_${source}_${timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper to process large arrays in chunks to keep UI responsive
  const processInChunks = async <T, R>(items: T[], mapper: (item: T) => R, chunkSize = 100): Promise<R[]> => {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      results.push(...chunk.map(mapper));
      // Yield control back to browser to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return results;
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let rawData: any[] = [];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
          const content = evt.target?.result as string;
          const parsed = JSON.parse(content);
          // Check if user accidentally uploaded a full vault into the lead merge
          if (parsed.companies && Array.isArray(parsed.companies)) {
            rawData = parsed.companies;
          } else if (Array.isArray(parsed)) {
            rawData = parsed;
          } else {
            throw new Error("INVALID_FORMAT");
          }
        } else {
          // Handle Excel/CSV via XLSX
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        if (rawData.length === 0) {
          alert("Selected file contains no readable records.");
          setIsImporting(false);
          return;
        }

        // Chunked mapping phase to prevent UI lock
        const mappedCompanies = await processInChunks(rawData, (row) => {
          const name = row['Company Name'] || row['companyName'] || row['Company'] || row['Name'] || row['Entity'];
          const emailRaw = row['Emails'] || row['emails'] || row['Email'] || row['Email Address'] || row['Contact Email'];
          const phone = row['Phone'] || row['phoneNumber'] || row['PhoneNumber'] || row['Mobile'];
          const loc = row['Location'] || row['location'] || row['Region'] || row['Address'] || row['Country'];
          const tagRaw = row['Tags'] || row['tags'] || row['Labels'] || row['Categories'];
          const notes = row['Notes'] || row['notes'] || row['Comments'] || row['Context'] || row['Description'];
          const interested = row['Interest Status'] || row['isInterested'] || row['Interested'] || row['Status'];

          if (!name || !emailRaw) return null;

          const emails = typeof emailRaw === 'string' 
            ? emailRaw.split(',').map(s => s.trim()).filter(Boolean) 
            : [String(emailRaw).trim()];
          
          const tags = typeof tagRaw === 'string' 
            ? tagRaw.split(',').map(s => s.trim()).filter(Boolean) 
            : (Array.isArray(tagRaw) ? tagRaw : []);

          return {
            companyName: String(name).trim(),
            emails,
            phoneNumber: phone ? String(phone).trim() : undefined,
            location: loc ? String(loc).trim() : undefined,
            tags,
            notes: notes ? String(notes).trim() : undefined,
            isInterested: interested === 'High Interest' || interested === true || String(interested).toLowerCase() === 'true'
          };
        });

        const validCompanies = mappedCompanies.filter(Boolean) as Omit<Company, 'id' | 'createdAt'>[];
        
        if (validCompanies.length === 0) {
          throw new Error("SCHEMA_MISMATCH");
        }

        const result = await db.bulkAddCompanies(validCompanies);
        setImportStatus(result);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Refresh local state without full reload if possible, but reload is safest for full sync
        setTimeout(() => window.location.reload(), 1500);

      } catch (err: any) {
        console.error("Import error:", err);
        if (err.message === "INVALID_FORMAT" || err.message === "SCHEMA_MISMATCH") {
          alert("Invalid Vault Format: The structure does not match GulfVS Protocol.");
        } else {
          alert("Integrity Scan Failed: Ensure the file is a valid Excel or JSON lead list.");
        }
      } finally {
        setIsImporting(false);
      }
    };

    if (file.name.toLowerCase().endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleVaultImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (window.confirm("WARNING: This will replace your current environment with the imported vault. Continue?")) {
          await db.importProjectData(data);
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid Vault File: Structure does not match GulfVS Protocol.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Data Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm tracking-wide mt-2">STRUCTURED INTELLIGENCE EXPORT & INGESTION</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Full Environment Sync */}
          <div className="bg-gradient-to-br from-[#1a2d5a] to-[#2a4175] p-8 rounded-[2.5rem] shadow-2xl text-white">
            <h3 className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">Environment Restore</h3>
            <p className="text-xs font-medium mb-6 opacity-80 leading-relaxed">
              Import a <span className="font-black">gulfvs_vault.json</span> file shared by a colleague to perfectly replicate their entire project state.
            </p>
            <input type="file" ref={vaultInputRef} onChange={handleVaultImport} className="hidden" accept=".json" />
            <button 
              onClick={() => vaultInputRef.current?.click()}
              className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
            >
              🚀 Import Shared Vault
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] shadow-glass border border-slate-200/50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Export Configuration</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Source</label>
                <div className="grid grid-cols-1 gap-2">
                  {[{ id: 'logs', label: 'Log Details', icon: '📟' }, { id: 'companies', label: 'Contacts', icon: '💎' }].map(opt => (
                    <button key={opt.id} onClick={() => setSource(opt.id as DataSource)} className={`flex items-center space-x-4 px-6 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${source === opt.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                      <span className="text-xl">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal scope</label>
                <div className="flex flex-wrap gap-2">
                  {[{ id: 'daily', label: 'Daily' }, { id: 'monthly', label: 'Monthly' }, { id: 'all', label: 'All-Time' }].map(opt => (
                    <button key={opt.id} onClick={() => setTimeframe(opt.id as Timeframe)} className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${timeframe === opt.id ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] shadow-glass border border-slate-200/50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Import Intelligence</h3>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">Merge specific lead lists (CSV/Excel/JSON) without affecting logs.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv,.json,.xlsx,.xls" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isImporting} 
              className={`w-full py-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center space-y-2 group ${isImporting ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' : 'bg-primary/5 border-primary/20 hover:border-primary hover:bg-primary/10'}`}
            >
              <div className={`text-2xl transition-transform ${isImporting ? 'animate-spin' : 'group-hover:scale-110'}`}>
                {isImporting ? '🌀' : '📥'}
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest text-primary">
                {isImporting ? 'Decrypting Vault...' : 'Merge Contact List'}
              </span>
            </button>
            {importStatus && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-800 rounded-2xl animate-in zoom-in-95 text-center">
                <p className="text-xl font-black text-green-700 leading-none">{importStatus.added}</p>
                <p className="text-[8px] font-black uppercase text-green-600 mt-1">Merged Successfully</p>
                {importStatus.skipped > 0 && (
                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">Skipped {importStatus.skipped} Duplicates</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[2.5rem] shadow-glass border border-slate-200/50 dark:border-slate-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-widest">Report Generator</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: Operational</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary dark:text-accent tracking-tighter">{getFilteredData().length}</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Records found</p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={handleExportExcel} className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 hover:border-green-500 hover:bg-green-50/10 transition-all duration-300">
                <div className="w-20 h-20 rounded-3xl bg-green-500/10 text-green-500 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📊</div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Spreadsheet</h4>
                <p className="text-xs text-slate-500 font-medium">Standard formatted .XLSX workbook.</p>
              </button>
              <button onClick={handleExportJSON} className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all duration-300">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📄</div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Raw Objects</h4>
                <p className="text-xs text-slate-500 font-medium">Machine-readable .JSON structure.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage;
