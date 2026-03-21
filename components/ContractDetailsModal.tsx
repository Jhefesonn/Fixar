'use client';

import React, { useState, useEffect } from 'react';
import { getContractById, saveMaintenanceChecklist, saveContract, deleteMaintenanceLog } from '@/app/actions/equipments';
import ChecklistModal from './ChecklistModal';
import ContractFormModal from './ContractFormModal';
import ReportSelectionModal from './ReportSelectionModal';
import ConsolidatedReportModal from './ConsolidatedReportModal';
import { format, addMonths, differenceInDays, isAfter, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string | null;
}

export default function ContractDetailsModal({ isOpen, onClose, contractId }: ContractDetailsModalProps) {
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [selectedEquipmentForChecklist, setSelectedEquipmentForChecklist] = useState<any>(null);
    const [savingChecklist, setSavingChecklist] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [savingContract, setSavingContract] = useState(false);
    const [expandedEqId, setExpandedEqId] = useState<string | null>(null);
    const [selectedLogForEdit, setSelectedLogForEdit] = useState<any>(null);
    const [isReportSelectionOpen, setIsReportSelectionOpen] = useState(false);
    const [isConsolidatedReportOpen, setIsConsolidatedReportOpen] = useState(false);
    const [consolidatedLogs, setConsolidatedLogs] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && contractId) {
            loadData();
        } else {
            setContract(null);
            setError(null);
        }
    }, [isOpen, contractId]);

    const loadData = async () => {
        if (!contractId) return;
        setLoading(true);
        try {
            const data = await getContractById(contractId);
            setContract(data);
        } catch (err: any) {
            console.error('Error loading contract details:', err);
            setError(err.message || 'Falha ao carregar detalhes do contrato.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChecklist = async (checklistData: any, notes: string, structure: any, technicianName?: string, technicianId?: string, technicianDocument?: string) => {
        if (!selectedEquipmentForChecklist || !contract) return;
        try {
            setSavingChecklist(true);
            await saveMaintenanceChecklist(
                selectedEquipmentForChecklist.id,
                checklistData,
                notes,
                contract.id,
                structure,
                technicianName,
                technicianId,
                technicianDocument,
                selectedLogForEdit?.id
            );
            setIsChecklistOpen(false);
            setSelectedEquipmentForChecklist(null);
            setSelectedLogForEdit(null);
            await loadData();
        } catch (err: any) {
            console.error('Error saving checklist:', err);
            alert('Erro ao salvar checklist. Tente novamente.');
        } finally {
            setSavingChecklist(false);
        }
    };

    const handleDeleteChecklist = async (logId: string) => {
        if (!confirm('Tem certeza que deseja excluir este checklist?')) return;
        try {
            await deleteMaintenanceLog(logId);
            await loadData();
        } catch (err) {
            alert('Erro ao excluir checklist.');
        }
    };

    const handleSaveContract = async (contractData: any, equipmentIds: string[], equipmentIdsToRemoveLogs: string[] = []) => {
        try {
            setSavingContract(true);
            const dataToSave = { ...contractData, client_id: contractData.client_id || contract?.client_id };
            await saveContract(dataToSave, equipmentIds, equipmentIdsToRemoveLogs);
            setIsEditModalOpen(false);
            await loadData();
        } catch (err) {
            console.error('Error saving contract:', err);
            alert('Erro ao salvar contrato.');
        } finally {
            setSavingContract(false);
        }
    };

    const handleConfirmReportSelection = (selectedEqIds: string[], period: 'current' | 'all') => {
        if (!contract || !contract.equipment_list) return;

        let allLogs: any[] = [];
        const now = new Date();

        contract.equipment_list.forEach((eq: any) => {
            if (selectedEqIds.includes(eq.id) && eq.maintenance_logs) {
                let eqLogs = [...eq.maintenance_logs];
                
                // Filter by period
                if (period === 'current') {
                    eqLogs = eqLogs.filter(log => isSameMonth(parseISO(log.performed_at), now));
                    // If multiple in current month, take the latest
                    eqLogs = eqLogs.sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()).slice(0, 1);
                }

                // Add equipment info to log for display
                eqLogs = eqLogs.map(log => ({
                    ...log,
                    equipments: {
                        name: eq.name,
                        tag: eq.tag
                    }
                }));

                allLogs = [...allLogs, ...eqLogs];
            }
        });

        if (allLogs.length === 0) {
            alert('Nenhum registro de manutenção encontrado para os critérios selecionados.');
            return;
        }

        setConsolidatedLogs(allLogs);
        setIsReportSelectionOpen(false);
        setIsConsolidatedReportOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-slate-200 contract-details-overlay">
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .modal-premium {
                    background: #020617;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 32px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}} />

            <div className="modal-premium w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in italic-font-fix print:hidden hide-on-print">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
                            <span className="material-symbols-outlined text-2xl">description</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Detalhes do Contrato</span>
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                {loading ? 'Carregando...' : contract?.name || 'Contrato'}
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <span className="material-symbols-outlined font-light">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <div className="h-10 w-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Buscando Informações...</span>
                        </div>
                    ) : error ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                            <span className="material-symbols-outlined text-5xl text-red-500 opacity-20">error</span>
                            <p className="text-slate-400 font-medium italic">{error}</p>
                            <button onClick={loadData} className="px-6 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">Tentar Novamente</button>
                        </div>
                    ) : contract ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* General Info */}
                            <div className="lg:col-span-12 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                                        <p className="text-white font-bold">{contract.type || 'N/A'}</p>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Periodicidade</label>
                                        <p className="text-white font-bold capitalize">{contract.periodicity || 'Mensal'}</p>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Início</label>
                                        <p className="text-white font-bold">
                                            {contract.start_date ? format(parseISO(contract.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Equipment List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary-500 text-lg">ac_unit</span>
                                            Equipamentos ({contract.equipment_list?.length || 0})
                                        </h4>
                                        <button 
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-600/10 text-primary-500 hover:bg-primary-600 hover:text-white transition-all border border-primary-500/20 hover:border-primary-600"
                                            title="Adicionar ou Remover Equipamentos"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </button>
                                    </div>
                                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-white/[0.02] sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipamento</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Local & Checklist</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {contract.equipment_list?.map((eq: any) => (
                                                        <React.Fragment key={eq.id}>
                                                            <tr 
                                                                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                                onClick={(e) => {
                                                                    if ((e.target as HTMLElement).closest('button')) return;
                                                                    setExpandedEqId(expandedEqId === eq.id ? null : eq.id);
                                                                }}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                                                            <span className={`material-symbols-outlined text-[16px] transition-transform ${expandedEqId === eq.id ? 'rotate-90 text-primary-500' : 'text-slate-500'}`}>chevron_right</span>
                                                                            {eq.tag}
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-500 italic ml-6">{eq.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                                    <span className="text-xs text-slate-400 font-medium">{eq.environment || 'N/A'}</span>
                                                                    {eq.checklist_status === 'ok' ? (
                                                                        <span className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-inner shadow-emerald-500/10" title="Manutenção dentro do prazo">
                                                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                            <span className="hidden sm:inline">OK</span>
                                                                        </span>
                                                                    ) : eq.checklist_status === 'pending' ? (
                                                                        <button
                                                                            onClick={() => { setSelectedEquipmentForChecklist(eq); setSelectedLogForEdit(null); setIsChecklistOpen(true); }}
                                                                            className="h-8 px-3 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-600 hover:text-white border border-amber-500/20 hover:border-amber-600 outline-none text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 group/btn shadow-lg"
                                                                            title="Manutenção fora do prazo"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px] group-hover/btn:rotate-12 transition-transform">warning</span>
                                                                            <span className="hidden sm:inline">Pendente</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => { setSelectedEquipmentForChecklist(eq); setSelectedLogForEdit(null); setIsChecklistOpen(true); }}
                                                                            className="h-8 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 hover:border-red-600 outline-none text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 group/btn shadow-lg"
                                                                            title="Nenhum checklist foi gerado"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px] group-hover/btn:rotate-12 transition-transform">close</span>
                                                                            <span className="hidden sm:inline w-max">Não Realizado</span>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {/* Accordion Content */}
                                                            {expandedEqId === eq.id && (
                                                                <tr className="bg-black/20">
                                                                    <td colSpan={2} className="p-0 border-y border-white/5">
                                                                        <div className="p-6 pl-12 space-y-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                                                    <span className="material-symbols-outlined text-[14px]">history</span>
                                                                                    Histórico de Checklists
                                                                                </h5>
                                                                                <button
                                                                                    onClick={() => { setSelectedEquipmentForChecklist(eq); setSelectedLogForEdit(null); setIsChecklistOpen(true); }}
                                                                                    className="text-[10px] font-bold text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                                                    Novo Checklist
                                                                                </button>
                                                                            </div>
                                                                            
                                                                            {eq.maintenance_logs && eq.maintenance_logs.length > 0 ? (
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    {eq.maintenance_logs
                                                                                        .filter((log: any) => log.contract_id === contract.id)
                                                                                        .sort((a: any, b: any) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
                                                                                        .map((log: any) => (
                                                                                        <div key={log.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                                                                                            <div className="flex items-center gap-4">
                                                                                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                                                                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                                                                                </div>
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-white font-bold text-sm">
                                                                                                        {format(parseISO(log.performed_at), "dd MMM yyyy", { locale: ptBR })}
                                                                                                    </span>
                                                                                                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]" title={log.technician_name}>
                                                                                                        Téc: {log.technician_name || 'N/A'}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setSelectedEquipmentForChecklist(eq);
                                                                                                        setSelectedLogForEdit(log);
                                                                                                        setIsChecklistOpen(true);
                                                                                                    }}
                                                                                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                                                                                                    title="Editar"
                                                                                                >
                                                                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleDeleteChecklist(log.id)}
                                                                                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                                                    title="Excluir"
                                                                                                >
                                                                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-center p-6 border border-dashed border-white/5 rounded-2xl">
                                                                                    <span className="text-[11px] text-slate-500 italic">Nenhum checklist registrado para este equipamento no contrato atual.</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Area */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Client Card */}
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cliente</span>
                                            <span className="text-sm font-bold text-white truncate max-w-[150px]">{contract.client_name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                         <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500 italic">WhatsApp</span>
                                            <span className="text-slate-300 font-bold">{contract.client?.whatsapp || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500 italic">E-mail</span>
                                            <span className="text-slate-300 font-bold truncate max-w-[120px]">{contract.client?.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Card */}
                                <div className="p-6 bg-gradient-to-br from-primary-950/20 to-navy-950 border border-white/5 rounded-3xl space-y-6 relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary-500/5 blur-3xl rounded-full"></div>
                                    
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investimento Mensal</span>
                                        <div className="text-3xl font-black text-white mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.monthly_price)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {(() => {
                                            const startDate = parseISO(contract.start_date);
                                            const endDate = addMonths(startDate, contract.duration_months);
                                            const today = new Date();
                                            const daysRemaining = differenceInDays(endDate, today);
                                            const isExpired = !isAfter(endDate, today);
                                            const progress = Math.min(100, Math.max(0, (differenceInDays(today, startDate) / differenceInDays(endDate, startDate)) * 100));
                                            
                                            return (
                                                <>
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                                        <span className="text-slate-500 italic">Prazos</span>
                                                        <span className={isExpired ? 'text-red-500' : 'text-primary-500 animate-pulse'}>
                                                            {isExpired ? 'Expirado' : `${daysRemaining} dias`}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-navy-900 rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-primary-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 px-1">
                                                        <span>{format(startDate, 'dd/MM/yy')}</span>
                                                        <span>{format(endDate, 'dd/MM/yy')}</span>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 rounded-xl border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={() => setIsReportSelectionOpen(true)}
                        className="px-8 py-3 rounded-xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/10"
                    >
                        Gerar PDF
                    </button>
                </div>
            </div>

            <ChecklistModal 
                isOpen={isChecklistOpen}
                onClose={() => {
                    setIsChecklistOpen(false);
                    setSelectedEquipmentForChecklist(null);
                    setSelectedLogForEdit(null);
                }}
                onSubmit={handleSaveChecklist}
                loading={savingChecklist}
                initialItems={contract?.checklist_template}
                initialData={selectedLogForEdit ? {
                    checklist_data: selectedLogForEdit.checklist_data,
                    notes: selectedLogForEdit.notes,
                    technician_name: selectedLogForEdit.technician_name,
                    technician_id: selectedLogForEdit.technician_id,
                    technician_document: selectedLogForEdit.technician_document
                } : undefined}
                equipmentId={selectedEquipmentForChecklist?.id}
                equipmentName={selectedEquipmentForChecklist?.name}
                equipmentTag={selectedEquipmentForChecklist?.tag}
            />

            <ContractFormModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleSaveContract}
                initialData={contract}
                loading={savingContract}
            />

            <ReportSelectionModal 
                isOpen={isReportSelectionOpen}
                onClose={() => setIsReportSelectionOpen(false)}
                contract={contract}
                onConfirm={handleConfirmReportSelection}
            />

            <ConsolidatedReportModal 
                isOpen={isConsolidatedReportOpen}
                onClose={() => setIsConsolidatedReportOpen(false)}
                logs={consolidatedLogs}
                contract={contract}
                organizationId={contract?.organization_id || ''}
            />
        </div>
    );
}
