
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Company } from '../types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCompany?: Company;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onSave, editingCompany }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    emails: [''],
    phoneNumber: '',
    location: '',
    tags: '',
    notes: '',
    isInterested: false
  });

  useEffect(() => {
    if (editingCompany) {
      setFormData({
        companyName: editingCompany.companyName,
        emails: editingCompany.emails,
        phoneNumber: editingCompany.phoneNumber || '',
        location: editingCompany.location || '',
        tags: editingCompany.tags?.join(', ') || '',
        notes: editingCompany.notes || '',
        isInterested: editingCompany.isInterested || false
      });
    } else {
       setFormData({
        companyName: '',
        emails: [''],
        phoneNumber: '',
        location: '',
        tags: '',
        notes: '',
        isInterested: false
      });
    }
  }, [editingCompany, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      emails: formData.emails.filter(e => e.trim().length > 0)
    };

    if (editingCompany) await db.updateCompany(editingCompany.id, dataToSave);
    else await db.addCompany(dataToSave);
    
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
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              {editingCompany ? 'Modify Contact' : 'New Prospect'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lead Engineering</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <span className="text-xl">✕</span>
          </button>
        </header>
        
        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto invisible-scroll">
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
                <input required type="text" value={formData.companyName} onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold tracking-tight text-sm" placeholder="Enter entity name..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm" placeholder="Location..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, isInterested: !p.isInterested }))}
                    className={`w-full py-3.5 rounded-2xl font-black border transition-all text-[10px] uppercase tracking-widest ${formData.isInterested ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800'}`}
                  >
                    {formData.isInterested ? '⭐ Interested' : 'Set Interest'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Channels</label>
                {formData.emails.map((email, idx) => (
                  <input key={idx} required type="email" value={email} onChange={(e) => {
                    const next = [...formData.emails];
                    next[idx] = e.target.value;
                    setFormData(p => ({ ...p, emails: next }));
                  }} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm" placeholder="primary@domain.com" />
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm" placeholder="Fintech, HR, etc." />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contextual Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white focus:border-accent outline-none transition-all font-bold text-sm min-h-[120px] resize-none" placeholder="Strategic intelligence..." />
              </div>
            </div>
          </div>
          
          {/* Fixed Footer */}
          <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl font-black bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-xl shadow-primary/20 transition-all uppercase text-[10px] tracking-[0.2em]">
              {editingCompany ? 'Update Contact' : 'Save Prospect'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CompanyModal;
