
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Company, EmailType } from '../types';
import { draftEmailNote } from '../geminiService';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  companies: Company[];
  initialPrefill?: { companyId: string; email: string; sourceLogId?: string; emailType?: EmailType };
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSave, companies, initialPrefill }) => {
  const [formData, setFormData] = useState({
    companyId: '',
    emailAddress: '',
    emailType: 'Follow-up' as EmailType,
    note: '',
    followUpDate: '',
    completed: false
  });
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPrefill) {
        setFormData({
          companyId: initialPrefill.companyId,
          emailAddress: initialPrefill.email,
          emailType: initialPrefill.emailType || 'Follow-up',
          note: '',
          followUpDate: '',
          completed: false
        });
      } else {
        setFormData({
          companyId: '',
          emailAddress: '',
          emailType: 'First-time',
          note: '',
          followUpDate: '',
          completed: false
        });
      }
    }
  }, [isOpen, initialPrefill]);

  const selectedCompany = companies.find(c => c.id === formData.companyId);

  useEffect(() => {
    if (selectedCompany && !formData.emailAddress && !initialPrefill) {
      setFormData(p => ({ ...p, emailAddress: selectedCompany.emails[0] }));
    }
  }, [selectedCompany, initialPrefill]);

  const handleAiDraft = async () => {
    if (!selectedCompany) return;
    setIsAiDrafting(true);
    const draft = await draftEmailNote(selectedCompany.companyName, selectedCompany.tags || [], formData.emailType);
    setFormData(p => ({ ...p, note: draft }));
    setIsAiDrafting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.emailType === 'First-time') {
      const alreadySent = await db.hasReceivedFirstTime(formData.emailAddress);
      if (alreadySent) {
        setError(`A first-time email has already been sent to ${formData.emailAddress}. Please select 'Follow-up' instead.`);
        return;
      }
    }

    await db.addLog({
      ...formData,
      dateSent: Date.now(),
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).getTime() : undefined
    });

    if (initialPrefill?.sourceLogId) {
      await db.updateLog(initialPrefill.sourceLogId, { completed: true });
    }

    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-slate-200/50 dark:border-slate-800">
        {/* Fixed Header */}
        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Audit Reach</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Outreach Registry</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <span className="text-xl">✕</span>
          </button>
        </header>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto invisible-scroll">
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/50">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Selection *</label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData(p => ({ ...p, companyId: e.target.value, emailAddress: '' }))}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select target company...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {formData.companyId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Channel *</label>
                  <select
                    required
                    value={formData.emailAddress}
                    onChange={(e) => setFormData(p => ({ ...p, emailAddress: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Choose active email...</option>
                    {selectedCompany?.emails.map((email, idx) => (
                      <option key={idx} value={email}>{email}</option>
                    )) || <option value={formData.emailAddress}>{formData.emailAddress}</option>}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Log Type</label>
                <div className="flex gap-3">
                  {(['First-time', 'Follow-up'] as EmailType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, emailType: t }))}
                      className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.emailType === t 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comm Notes</label>
                  <button 
                    type="button" 
                    onClick={handleAiDraft}
                    disabled={!formData.companyId || isAiDrafting}
                    className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {isAiDrafting ? 'Drafting...' : '✨ AI Compose'}
                  </button>
                </div>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm min-h-[100px] resize-none"
                  placeholder="Summary of interaction..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Follow-up</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData(p => ({ ...p, followUpDate: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">Abort</button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl font-black bg-accent text-white hover:bg-accent/90 active:scale-95 shadow-xl shadow-accent/20 transition-all uppercase text-[10px] tracking-[0.2em]">Confirm Record</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default LogModal;
