'use client';

import React, { useState, useEffect } from 'react';

interface ReportSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: any;
    onConfirm: (selectedEqIds: string[], period: 'current' | 'all') => void;
}

export default function ReportSelectionModal({ isOpen, onClose, contract, onConfirm }: ReportSelectionModalProps) {
    const [selectedEqIds, setSelectedEqIds] = useState<string[]>([]);
    const [period, setPeriod] = useState<'current' | 'all'>('current');

    useEffect(() => {
        if (isOpen && contract?.equipment_list) {
            // Default select all
            setSelectedEqIds(contract.equipment_list.map((eq: any) => eq.id));
        }
    }, [isOpen, contract]);

    if (!isOpen || !contract) return null;

    const toggleEq = (id: string) => {
        setSelectedEqIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedEqIds.length === contract.equipment_list?.length) {
            setSelectedEqIds([]);
        } else {
            setSelectedEqIds(contract.equipment_list?.map((eq: any) => eq.id) || []);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl scale-in italic-font-fix">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none">Opções do Relatório</span>
                            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">Configurar PDF</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl font-light">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {/* Period selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            Período de Referência
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setPeriod('current')}
                                className={`p-4 rounded-2xl border transition-all text-left group ${
                                    period === 'current' 
                                        ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500/50' 
                                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className={`h-4 w-4 rounded-full border-2 mb-3 flex items-center justify-center transition-all ${
                                    period === 'current' ? 'border-primary-500 bg-primary-500' : 'border-slate-700'
                                }`}>
                                    {period === 'current' && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                                </div>
                                <div className="text-xs font-bold text-white uppercase tracking-tight">Mês Atual</div>
                                <div className="text-[10px] text-slate-500 mt-1 italic font-medium">Apenas manutenções deste mês.</div>
                            </button>

                            <button 
                                onClick={() => setPeriod('all')}
                                className={`p-4 rounded-2xl border transition-all text-left group ${
                                    period === 'all' 
                                        ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500/50' 
                                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className={`h-4 w-4 rounded-full border-2 mb-3 flex items-center justify-center transition-all ${
                                    period === 'all' ? 'border-primary-500 bg-primary-500' : 'border-slate-700'
                                }`}>
                                    {period === 'all' && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                                </div>
                                <div className="text-xs font-bold text-white uppercase tracking-tight">Todo o Histórico</div>
                                <div className="text-[10px] text-slate-500 mt-1 italic font-medium">Incluir todos os registros disponíveis.</div>
                            </button>
                        </div>
                    </div>

                    {/* Equipment selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">ac_unit</span>
                                Selecionar Equipamentos
                            </label>
                            <button 
                                onClick={toggleAll}
                                className="text-[9px] font-black uppercase text-primary-500 hover:text-primary-400 tracking-widest transition-colors"
                            >
                                {selectedEqIds.length === contract.equipment_list?.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </button>
                        </div>
                        <div className="bg-navy-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-white/5">
                            {contract.equipment_list?.map((eq: any) => {
                                const hasLogs = eq.maintenance_logs && eq.maintenance_logs.length > 0;
                                const isOk = eq.checklist_status === 'ok';
                                const isDisabled = period === 'all' ? !hasLogs : !isOk;
                                const isSelected = selectedEqIds.includes(eq.id) && !isDisabled;

                                return (
                                    <div 
                                        key={eq.id}
                                        onClick={() => !isDisabled && toggleEq(eq.id)}
                                        className={`p-4 flex items-center gap-3 transition-colors group ${
                                            isDisabled ? 'opacity-30 cursor-not-allowed bg-black/20' : 'cursor-pointer hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                                            isSelected 
                                                ? 'bg-primary-500 border-primary-500 text-white' 
                                                : 'border-slate-700 group-hover:border-slate-500'
                                        }`}>
                                            {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{eq.tag}</span>
                                                {isDisabled && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                                        {period === 'current' ? 'Pendente' : 'Sem Histórico'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-500 italic uppercase tracking-widest">{eq.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all outline-none"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onConfirm(selectedEqIds, period)}
                        disabled={selectedEqIds.length === 0}
                        className="flex-[2] py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/10 disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                    >
                        Gerar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
}
