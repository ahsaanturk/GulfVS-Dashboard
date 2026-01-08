
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Execute Purge", 
  isDanger = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/50 dark:border-slate-800">
        <div className="p-8 md:p-10 text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center text-3xl shadow-xl ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
            {isDanger ? '⚠️' : 'ℹ️'}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isDanger ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700' : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'}`}
            >
              {confirmLabel}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Cancel Operation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
