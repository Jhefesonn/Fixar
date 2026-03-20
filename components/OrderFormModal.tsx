'use client';

import React from 'react';
import OrderForm from './OrderForm';

interface OrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any, services: any[], parts: any[]) => Promise<void>;
    initialData?: any;
    loading?: boolean;
}

export default function OrderFormModal({ isOpen, onClose, onSubmit, initialData, loading }: OrderFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1560] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">receipt_long</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                {initialData?.id ? 'Editar Pedido' : 'Gerar Pedido Avulso'}
                            </h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                {initialData?.id ? 'Atualize as informações do pedido' : 'Crie um novo orçamento ou ordem de serviço'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all group"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">close</span>
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <OrderForm 
                        initialData={initialData}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
