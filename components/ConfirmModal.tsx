'use client';

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info' | 'warning';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirmar', 
  cancelLabel = 'Cancelar',
  type = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorClasses = {
    danger: 'bg-red-500/10 text-red-500 border-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    info: 'bg-primary-600/10 text-primary-600 border-primary-600/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
  };

  const btnClasses = {
    danger: 'bg-red-500 font-black',
    info: 'bg-primary-600 font-black',
    warning: 'bg-amber-500 font-black'
  };

  const icon = type === 'danger' ? 'delete_forever' : type === 'warning' ? 'warning' : 'help';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-slate-800 rounded-[32px] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl scale-in">
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className={`h-20 w-20 rounded-[24px] flex items-center justify-center mb-6 border ${colorClasses[type]}`}>
            <span className="material-symbols-outlined text-4xl leading-none">{icon}</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase tracking-widest">{title}</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed italic">{message}</p>
        </div>

        <div className="p-8 pt-6 flex flex-col gap-3">
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-4 rounded-2xl text-white text-[10px] uppercase tracking-[0.2em] transition-all ${btnClasses[type]}`}
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-4 rounded-2xl border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.02] transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
