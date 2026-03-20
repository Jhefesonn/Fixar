'use client';

import React, { useState, useEffect } from 'react';
import { 
    getServices, 
    adminCreateService, 
    adminUpdateService, 
    adminDeleteService 
} from '@/app/actions/services';
import ServiceForm from './ServiceForm';

interface ServicesViewProps {
    onBack?: () => void;
    externalSearch?: string;
}

export default function ServicesView({ onBack, externalSearch = "" }: ServicesViewProps) {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await getServices();
            setServices(data || []);
        } catch (err) {
            console.error('Erro ao buscar serviços:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveService = async (formData: any) => {
        setSaving(true);
        try {
            if (isEditing && serviceToEdit) {
                await adminUpdateService(serviceToEdit.id, formData);
                showToast('Serviço atualizado com sucesso!');
            } else {
                await adminCreateService(formData);
                showToast('Serviço cadastrado com sucesso!');
            }
            setIsModalOpen(false);
            setIsEditing(false);
            setServiceToEdit(null);
            fetchServices();
        } catch (err: any) {
            showToast('Erro ao salvar serviço: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;
        setSaving(true);
        try {
            await adminDeleteService(serviceToDelete.id);
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
            fetchServices();
            showToast('Serviço excluído com sucesso!');
        } catch (err: any) {
            showToast('Erro ao excluir serviço: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredServices = services.filter(s => 
        s.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        s.description?.toLowerCase().includes(externalSearch.toLowerCase())
    );

    return (
        <>
        <div className="space-y-8 animate-fade-in relative">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-600 text-3xl">construction</span>
                        Serviços
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Gerencie o catálogo de serviços prestados</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setIsEditing(false); setServiceToEdit(null); setIsModalOpen(true); }}
                        className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
                        <span className="font-bold text-sm">Novo Serviço</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-navy-900/50 border border-slate-800/50 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="hidden md:block overflow-x-auto custom-scrollbar border-b border-slate-800/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-navy-950/50 border-b border-slate-800/50">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Serviço</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Preço Base</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">Tempo Estimado</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Carregando catálogo...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4 min-w-[250px]">
                                                <div className="h-12 w-16 rounded-xl bg-navy-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg">
                                                    {service.image_url ? (
                                                        <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-700">
                                                            <span className="material-symbols-outlined text-xl">construction</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-white group-hover:text-primary-600 transition-colors truncate">{service.name}</span>
                                                    <span className="text-[10px] text-slate-500 truncate mt-0.5">{service.description || 'Sem descrição'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-white tabular-nums">
                                                R$ {service.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                <span className="text-xs font-bold">{service.estimated_time || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => { setServiceToEdit(service); setIsEditing(true); setIsModalOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-primary-600 hover:border-primary-600/30 transition-all flex items-center justify-center shadow-lg"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setServiceToDelete(service); setIsDeleteModalOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center shadow-lg"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-navy-950 border border-slate-800 flex items-center justify-center text-slate-600">
                                                <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
                                            </div>
                                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Nenhum serviço encontrado.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden flex flex-col divide-y divide-slate-800/30">
                    {loading ? (
                        <div className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-10 w-10 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Carregando catálogo...</span>
                            </div>
                        </div>
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <div key={service.id} className="p-5 flex flex-col gap-4 active:bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-20 rounded-xl bg-navy-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg">
                                        {service.image_url ? (
                                            <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-700">
                                                <span className="material-symbols-outlined text-2xl">construction</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-base font-bold text-white truncate">{service.name}</span>
                                        <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{service.description || 'Sem descrição'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Preço Base</span>
                                        <span className="text-sm font-black text-white tabular-nums">
                                            R$ {service.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-left">Estimativa</span>
                                        <div className="flex items-center gap-1.5 text-slate-300">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            <span className="text-xs font-bold">{service.estimated_time || '---'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => { setServiceToEdit(service); setIsEditing(true); setIsModalOpen(true); }}
                                        className="flex-1 py-2.5 bg-navy-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 active:bg-slate-800 transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <span className="material-symbols-outlined text-sm group-active:text-primary-600">edit</span>
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => { setServiceToDelete(service); setIsDeleteModalOpen(true); }}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-6 py-20 text-center">
                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Nenhum serviço encontrado.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Modals */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary-600">{isEditing ? 'edit_square' : 'construction'}</span>
                                {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <ServiceForm 
                                initialData={isEditing ? serviceToEdit : null}
                                onSubmit={handleSaveService}
                                onCancel={() => setIsModalOpen(false)}
                                loading={saving}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && serviceToDelete && (
                <div className="fixed inset-0 z-[1510] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
                    <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl scale-in">
                        <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">warning</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Excluir Serviço?</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Você está prestes a excluir o serviço <span className="text-white font-bold">{serviceToDelete.name}</span>. Esta ação não poderá ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteService}
                                disabled={saving}
                                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                            >
                                {saving ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        {/* Toast - Posicionado no canto inferior direito, fora da div animada */}
        {toast && (
            <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in transition-all max-w-lg ${
                toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : 
                'bg-red-950/90 border-red-500/30 text-red-400'
            }`}>
                <span className="material-symbols-outlined text-xl">
                    {toast.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <p className="text-sm font-medium text-white/90">{toast.message}</p>
                <button onClick={() => setToast(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        )}
        </>
    );
}
