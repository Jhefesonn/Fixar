'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, adminCreateOrder, adminUpdateOrder, adminDeleteOrder, getOrderDetails, adminUpdateOrderStatus } from '@/app/actions/orders';
import OrderForm from './OrderForm';
import { supabase } from '@/lib/supabase';

interface OrdersViewProps {
    externalSearch?: string;
}

export default function OrdersView({ externalSearch = "" }: OrdersViewProps) {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [availableContacts, setAvailableContacts] = useState<any[]>([]);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        const { data } = await supabase.from('site_config').select('logo_url').eq('id', 1).single();
        if (data) setLogoUrl(data.logo_url);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data || []);
        } catch (err) {
            console.error('Erro ao buscar pedidos:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveOrder = async (formData: any, services: any[], parts: any[]) => {
        setSaving(true);
        try {
            if (isEditing && orderToEdit) {
                await adminUpdateOrder(orderToEdit.id, formData, services, parts);
                showToast('Pedido atualizado com sucesso!');
            } else {
                await adminCreateOrder(formData, services, parts);
                showToast('Pedido gerado com sucesso!');
            }
            setIsModalOpen(false);
            setIsEditing(false);
            setOrderToEdit(null);
            fetchOrders();
        } catch (err: any) {
            showToast('Erro ao salvar pedido: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setSaving(true);
        try {
            await adminDeleteOrder(orderToDelete.id);
            setIsDeleteModalOpen(false);
            setOrderToDelete(null);
            fetchOrders();
            showToast('Pedido excluído com sucesso!');
        } catch (err: any) {
            showToast('Erro ao excluir pedido: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEditOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const fullOrder = await getOrderDetails(orderId);
            if (fullOrder) {
                setOrderToEdit(fullOrder);
                setIsEditing(true);
                setIsModalOpen(true);
            } else {
                showToast('Erro ao carregar dados do pedido.', 'error');
            }
        } catch (err: any) {
            showToast('Erro ao carregar pedido: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`);
    };
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await adminUpdateOrderStatus(orderId, newStatus);
            showToast('Status atualizado!');
            fetchOrders();
            // Also update selectedOrder if it's the one we're editing
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err: any) {
            showToast('Erro ao atualizar status: ' + err.message, 'error');
        }
    };

    const handlePrint = (orderId: string) => {
        window.open(`/admin/orders/${orderId}/print`, '_blank');
    };

    const openShareModal = (order: any) => {
        const contacts = [];
        
        // Primary WhatsApp
        if (order.client?.whatsapp) {
            contacts.push({
                id: 'primary',
                name: order.client.full_name,
                role: 'Principal',
                number: order.client.whatsapp,
                selected: true
            });
        }

        // Additional Contacts
        if (Array.isArray(order.client?.contacts)) {
            order.client.contacts.forEach((c: any, index: number) => {
                if (c.number) {
                    contacts.push({
                        id: `contact-${index}`,
                        name: c.name || `Contato ${index + 1}`,
                        role: c.role || c.department || 'Adicional',
                        number: c.number,
                        selected: false
                    });
                }
            });
        }

        if (contacts.length === 0) {
            showToast('Nenhum número de WhatsApp encontrado para este cliente', 'error');
            return;
        }

        setAvailableContacts(contacts);
        setSelectedOrder(order);
        setIsShareModalOpen(true);
    };

    const handleSendWhatsApp = () => {
        const selected = availableContacts.filter(c => c.selected);
        if (selected.length === 0) {
            showToast('Selecione pelo menos um contato', 'error');
            return;
        }

        const servicesText = selectedOrder.services?.map((s: any) => `- ${s.name} (Qtd: ${s.quantity || 1})`).join('%0A') || '';
        const total = (
            (selectedOrder.services?.reduce((acc: number, s: any) => acc + (parseFloat(s.price) * (parseFloat(s.quantity) || 1)), 0) || 0) +
            (selectedOrder.parts?.reduce((acc: number, p: any) => acc + (parseFloat(p.price) * (parseFloat(p.quantity) || 1)), 0) || 0)
        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        const message = `Olá, segue o orçamento do pedido ${selectedOrder.name}:%0A%0AServiços:%0A${servicesText}%0A%0ATotal: R$ ${total}%0A%0AFico no aguardo!`;
        
        // Open each selected contact in a new tab
        selected.forEach((contact, index) => {
            const cleanPhone = contact.number.replace(/\D/g, '');
            const url = `https://wa.me/${cleanPhone}/?text=${message}`;
            
            // To avoid popup blockers, we might need a small delay or a better strategy. 
            // For now, opening them as separate tabs.
            setTimeout(() => {
                window.open(url, '_blank');
            }, index * 1000); 
        });

        setIsShareModalOpen(false);
        showToast(`Enviando para ${selected.length} contato(s)...`);
    };

    const filteredOrders = orders.filter(o => 
        o.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        o.client?.full_name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        o.equipment?.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        o.equipment?.tag?.toLowerCase().includes(externalSearch.toLowerCase())
    );

    const getStatusSelector = (order: any) => {
        const statusOptions = [
            { id: 'pending', label: '⏳ Pendente', color: 'text-amber-500' },
            { id: 'approved', label: '✅ Aprovado', color: 'text-blue-500' },
            { id: 'completed', label: '🏁 Concluído', color: 'text-emerald-500' },
            { id: 'cancelled', label: '❌ Cancelado', color: 'text-red-500' }
        ];

        return (
            <select
                value={order.status}
                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                className={`bg-navy-950/50 border border-slate-800 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer ${
                    statusOptions.find(o => o.id === order.status)?.color || 'text-slate-500'
                }`}
            >
                {statusOptions.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-navy-900 text-slate-300">
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    };

    return (
        <>
        <div className="space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isDetailsOpen ? 'no-print' : ''}`}>
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-500 text-3xl">assignment</span>
                        Pedidos
                    </h2>
                </div>

                <button 
                    onClick={() => { setIsEditing(false); setOrderToEdit(null); setIsModalOpen(true); }}
                    className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                    <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
                    <span className="font-bold text-sm">Novo Pedido</span>
                </button>
            </div>

            {/* List Table/Cards */}
            <div className={`bg-navy-900/50 border border-slate-800/50 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl ${isDetailsOpen ? 'no-print' : ''}`}>
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-navy-950/50 border-b border-slate-800/50">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identificação / Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cliente / Equipamento</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Data</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading && !isDetailsOpen ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Carregando pedidos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(order.id)}
                                                    className="text-sm font-bold text-white hover:text-primary-500 transition-colors text-left"
                                                >
                                                    {order.name}
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    {getStatusSelector(order)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-slate-300">{order.client?.full_name || 'N/A'}</span>
                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                    {order.equipment?.name} ({order.equipment?.tag})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium text-slate-400">
                                                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">
                                                    Validade: {order.validity_days} dias
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => handleEditOrder(order.id)}
                                                    className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-primary-600 hover:border-primary-600/30 transition-all flex items-center justify-center shadow-lg"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setOrderToDelete(order); setIsDeleteModalOpen(true); }}
                                                    className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center shadow-lg"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-slate-600 text-sm font-black uppercase tracking-[0.2em]">
                                        Nenhum pedido encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-slate-800/30">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <div key={order.id} className="p-5 space-y-4 active:bg-white/[0.02]">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => handleViewDetails(order.id)}
                                            className="text-base font-bold text-white text-left"
                                        >
                                            {order.name}
                                        </button>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {getStatusSelector(order)}
                                </div>

                                <div className="bg-navy-950/40 rounded-2xl p-4 border border-slate-800/50 space-y-3">
                                    <div>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Cliente</p>
                                        <p className="text-sm font-bold text-slate-300">{order.client?.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Equipamento</p>
                                        <p className="text-xs font-bold text-slate-400">{order.equipment?.name} ({order.equipment?.tag})</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleViewDetails(order.id)}
                                        className="flex-1 py-3 bg-white/5 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 active:bg-white/10"
                                    >
                                        Ver Detalhes
                                    </button>
                                    <button 
                                        onClick={() => handleEditOrder(order.id)}
                                        className="h-11 w-11 flex items-center justify-center bg-navy-950 border border-slate-800 rounded-xl text-slate-500 active:text-primary-500"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button 
                                        onClick={() => { setOrderToDelete(order); setIsDeleteModalOpen(true); }}
                                        className="h-11 w-11 flex items-center justify-center bg-navy-950 border border-slate-800 rounded-xl text-slate-500 active:text-red-500"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                            Nenhum pedido encontrado
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1550] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                                    <span className="material-symbols-outlined text-3xl">{isEditing ? 'edit_document' : 'assignment_add'}</span>
                                </div>
                                <div>
                                    <span className="block">{isEditing ? 'Editar Pedido' : 'Novo Pedido'}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Gestão de Ordem de Serviço</span>
                                </div>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all active:scale-95">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                            <OrderForm 
                                initialData={isEditing ? orderToEdit : null}
                                onSubmit={handleSaveOrder}
                                onCancel={() => setIsModalOpen(false)}
                                loading={saving}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <div className="fixed inset-0 z-[1560] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsOpen(false); }}>
                    <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                                    <span className="material-symbols-outlined text-3xl">assignment</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white leading-none">{selectedOrder.name}</h3>
                                    <div className="mt-2 flex items-center gap-3">
                                        {getStatusSelector(selectedOrder)}
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Criado em {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 lg:p-10 overflow-y-auto custom-scrollbar space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="aspect-video rounded-[32px] bg-navy-950 border border-slate-800 overflow-hidden shadow-2xl">
                                        {selectedOrder.image_url ? (
                                            <img src={selectedOrder.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center text-slate-800 gap-4">
                                                <span className="material-symbols-outlined text-6xl">image</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Sem foto anexada</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-slate-800/50">
                                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-4">Informações do Cliente</h4>
                                        <p className="text-sm font-bold text-white mb-1">{selectedOrder.client?.full_name}</p>
                                        <p className="text-xs text-slate-500 font-medium">Equipamento: {selectedOrder.equipment?.name} ({selectedOrder.equipment?.tag})</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-slate-800/50">
                                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-4">Descrição do Pedido</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed italic">{selectedOrder.description || 'Nenhuma descrição detalhada.'}</p>
                                    </div>

                                    {/* Services List */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">construction</span>
                                            Serviços Lançados
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedOrder.services?.map((s: any) => (
                                                <div key={s.id} className="flex justify-between items-center p-3 bg-navy-950/50 border border-slate-800/50 rounded-xl">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{s.name}</span>
                                                        <span className="text-[9px] text-slate-600 font-black uppercase">Qtd: {s.quantity || 1}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-primary-500">R$ {(parseFloat(s.price) * (parseFloat(s.quantity) || 1)).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {(!selectedOrder.services || selectedOrder.services.length === 0) && (
                                                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest text-center py-4 border-2 border-dashed border-slate-800/50 rounded-xl">Nenhum serviço</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parts List */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                                            Peças e Materiais
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedOrder.parts?.map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center p-3 bg-navy-950/50 border border-slate-800/50 rounded-xl">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{p.name}</span>
                                                        <span className="text-[9px] text-slate-600 font-black uppercase">Qtd: {p.quantity}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-primary-500">R$ {(parseFloat(p.price) * parseFloat(p.quantity)).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            {(!selectedOrder.parts || selectedOrder.parts.length === 0) && (
                                                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest text-center py-4 border-2 border-dashed border-slate-800/50 rounded-xl">Nenhuma peça</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Total Footer */}
                                    <div className="pt-6 border-t border-slate-800/50 flex justify-between items-end no-print">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Geral</span>
                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                                            R$ { (
                                                (selectedOrder.services?.reduce((acc: number, s: any) => acc + (parseFloat(s.price) * (parseFloat(s.quantity) || 1)), 0) || 0) +
                                                (selectedOrder.parts?.reduce((acc: number, p: any) => acc + (parseFloat(p.price) * (parseFloat(p.quantity) || 1)), 0) || 0)
                                            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }
                                        </span>
                                    </div>
                                </div>
                            </div>
                                               {/* Versão para Impressão - Redesenhadaconforme especificações */}
                            <div className="hidden print:block fixed inset-0 bg-white text-black p-0 z-[9999] overflow-visible">
                                <div className="max-w-[750px] mx-auto p-12 flex flex-col min-h-screen font-sans border border-slate-100 shadow-sm relative">
                                    {/* Cabeçalho: Logo à esquerda, Número à direita */}
                                    <div className="flex justify-between items-center mb-10 pb-8 border-b-2 border-slate-100">
                                        <div className="flex items-center gap-4">
                                            {logoUrl ? (
                                                <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                                            ) : (
                                                <div className="h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                                    <span className="material-symbols-outlined text-4xl">ac_unit</span>
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-3xl font-black text-primary-600 tracking-tight leading-none uppercase">FiXAr</h1>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">Refrigeração</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orçamento Nº</h2>
                                            <p className="text-2xl font-black text-black">#{selectedOrder.name.replace('Pedido ', '')}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: {selectedOrder.status === 'pending' ? 'PENDENTE' : selectedOrder.status === 'approved' ? 'APROVADO' : selectedOrder.status === 'completed' ? 'CONCLUÍDO' : 'CANCELADO'}</p>
                                        </div>
                                    </div>

                                    {/* Cliente e Foto (Miniatura) */}
                                    <div className="flex gap-8 mb-10 items-start">
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2 border-l-4 border-primary-600 pl-3">Informações do Cliente</h3>
                                                <div className="pl-4 space-y-1">
                                                    <p className="text-base font-black text-black">{selectedOrder.client?.full_name}</p>
                                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                        {selectedOrder.client?.street}, {selectedOrder.client?.number} {selectedOrder.client?.complement && `- ${selectedOrder.client.complement}`}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 pl-5 uppercase font-medium">
                                                        {selectedOrder.client?.neighborhood} • {selectedOrder.client?.city} - {selectedOrder.client?.state} • CEP {selectedOrder.client?.cep}
                                                    </p>
                                                    <p className="text-xs text-slate-600 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">phone_iphone</span>
                                                        <span className="font-bold">WhatsApp:</span> {selectedOrder.client?.whatsapp}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-l-4 border-slate-200 pl-3">Equipamento</h3>
                                                <div className="pl-4">
                                                    <p className="text-xs font-bold text-black">{selectedOrder.equipment?.name} (<span className="text-primary-600">TAG: {selectedOrder.equipment?.tag}</span>)</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Foto: Apenas se existir */}
                                        {selectedOrder.image_url && (
                                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden shrink-0 rotate-1">
                                                <img src={selectedOrder.image_url} alt="Foto do Pedido" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Lista de Serviços */}
                                    {selectedOrder.services?.length > 0 && (
                                        <div className="mb-8">
                                            <div className="bg-slate-50 p-2 border-b-2 border-slate-200 mb-3 flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Serviços Executados / Propostos</h3>
                                                <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">Mão de Obra</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                                                        <th className="py-2 pl-4">Descrição do Serviço</th>
                                                        <th className="py-2 text-center w-20">Qtd.</th>
                                                        <th className="py-2 text-right w-32 pr-4">Preço</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedOrder.services.map((s: any) => (
                                                        <tr key={s.id} className="text-xs">
                                                            <td className="py-3 pl-4 font-bold text-black">{s.name}</td>
                                                            <td className="py-3 text-center text-slate-600">{s.quantity || 1} {s.unit || 'un'}</td>
                                                            <td className="py-3 text-right pr-4 font-black text-black">R$ {(parseFloat(s.price) * (parseFloat(s.quantity) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={2} className="py-2 pl-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total em Serviços</td>
                                                        <td className="py-2 text-right pr-4 text-xs font-black text-black">R$ {selectedOrder.services.reduce((acc: number, s: any) => acc + (parseFloat(s.price) * (parseFloat(s.quantity) || 1)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}

                                    {/* Lista de Peças */}
                                    {selectedOrder.parts?.length > 0 && (
                                        <div className="mb-8">
                                            <div className="bg-slate-50 p-2 border-b-2 border-slate-200 mb-3 flex justify-between items-center">
                                                <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Peças e Materiais Utilizados</h3>
                                                <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">Suprimentos</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                                                        <th className="py-2 pl-4">Descrição do Item</th>
                                                        <th className="py-2 text-center w-20">Qtd.</th>
                                                        <th className="py-2 text-right w-32 pr-4">Preço</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedOrder.parts.map((p: any) => (
                                                        <tr key={p.id} className="text-xs">
                                                            <td className="py-3 pl-4 font-bold text-black">{p.name}</td>
                                                            <td className="py-3 text-center text-slate-600">{p.quantity} {p.unit || 'un'}</td>
                                                            <td className="py-3 text-right pr-4 font-black text-black">R$ {(parseFloat(p.price) * parseFloat(p.quantity)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={2} className="py-2 pl-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Total em Materiais</td>
                                                        <td className="py-2 text-right pr-4 text-xs font-black text-black">R$ {selectedOrder.parts.reduce((acc: number, p: any) => acc + (parseFloat(p.price) * parseFloat(p.quantity)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}

                                    {/* Soma Total unificada com design premium */}
                                    <div className="mt-auto pt-8">
                                        <div className="flex justify-between items-end gap-10">
                                            <div className="flex-1 space-y-6">
                                                {/* Meios de Pagamento */}
                                                <div>
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Meios de Pagamento</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                                                            <span className="material-symbols-outlined text-lg text-primary-600">pix</span>
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase">PIX (CNPJ)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                                                            <span className="material-symbols-outlined text-lg text-primary-600">credit_card</span>
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase">Cartão de Crédito</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Informações da Empresa */}
                                                <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black uppercase tracking-wider">FiXAr Refrigeração</p>
                                                        <p className="text-[8px] text-slate-400 uppercase tracking-widest leading-none">Arapongas - Paraná | CNPJ: 59.509.239/0001-34</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary-500 italic">Especialistas em Climatização</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Valor Final Destacado */}
                                            <div className="w-64 bg-primary-600 p-8 rounded-[32px] text-white shadow-2xl shadow-primary-600/30 transform scale-105 origin-bottom-right">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Valor Total Geral</h3>
                                                <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">
                                                    R$ {(
                                                        (selectedOrder.services?.reduce((acc: number, s: any) => acc + (parseFloat(s.price) * (parseFloat(s.quantity) || 1)), 0) || 0) +
                                                        (selectedOrder.parts?.reduce((acc: number, p: any) => acc + (parseFloat(p.price) * (parseFloat(p.quantity) || 1)), 0) || 0)
                                                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-white/20">
                                                    <p className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">Este orçamento é válido por {selectedOrder.validity_days} dias a partir da data de emissão.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Rodapé e Data por extenso */}
                                    <div className="mt-12 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                                        Emitido eletronicamente via Sistema FiXAr em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Buttons for Details */}
                            <div className="p-8 border-t border-slate-800/50 bg-navy-950/30 flex flex-wrap gap-4 items-center justify-between no-print">
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handlePrint(selectedOrder.id)}
                                        className="h-12 px-6 rounded-2xl bg-white/[0.02] border border-slate-800 text-slate-400 font-black uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 hover:bg-white/[0.05] transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-lg">print</span>
                                        Imprimir Orçamento
                                    </button>
                                    <button 
                                        onClick={() => openShareModal(selectedOrder)}
                                        className="h-12 px-6 rounded-2xl bg-emerald-600 border border-emerald-500/30 text-white font-black uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                    >
                                        <span className="material-symbols-outlined text-lg">share</span>
                                        Enviar WhatsApp
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setOrderToEdit(selectedOrder);
                                        setIsEditing(true);
                                        setIsModalOpen(true);
                                        setIsDetailsOpen(false);
                                    }}
                                    className="h-12 px-6 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    Editar Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[1570] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsShareModalOpen(false); }}>
                    <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-500">share</span>
                                Enviar Orçamento
                            </h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">Selecione os contatos para envio:</p>
                            
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                {availableContacts.map((contact, idx) => (
                                    <label key={contact.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                                        contact.selected ? 'bg-primary-600/10 border-primary-600/50' : 'bg-navy-950/50 border-slate-800 hover:border-slate-700'
                                    }`}>
                                        <input 
                                            type="checkbox" 
                                            checked={contact.selected}
                                            onChange={() => {
                                                const newContacts = [...availableContacts];
                                                newContacts[idx].selected = !newContacts[idx].selected;
                                                setAvailableContacts(newContacts);
                                            }}
                                            className="hidden"
                                        />
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            contact.selected ? 'bg-primary-600 text-white' : 'bg-navy-950 border border-slate-800 text-slate-600 group-hover:text-slate-400'
                                        }`}>
                                            <span className="material-symbols-outlined font-black">
                                                {contact.selected ? 'check_box' : 'check_box_outline_blank'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{contact.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black uppercase text-primary-500 tracking-widest">{contact.role}</span>
                                                <span className="text-[10px] text-slate-500">{contact.number}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
                                <button 
                                    onClick={handleSendWhatsApp}
                                    className="w-full py-5 rounded-3xl bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                    Enviar Agora
                                </button>
                                <button onClick={() => setIsShareModalOpen(false)} className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Delete */}
            {isDeleteModalOpen && orderToDelete && (
                <div className="fixed inset-0 z-[1580] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
                    <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-10 text-center shadow-2xl scale-in">
                        <div className="h-24 w-24 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-8 ring-8 ring-red-500/5">
                            <span className="material-symbols-outlined text-5xl">warning</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4">Excluir Pedido?</h3>
                        <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                            Esta ação é irreversível. O pedido <span className="text-white font-bold">{orderToDelete.name}</span> será removido permanentemente.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 rounded-3xl border border-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Cancelar</button>
                            <button onClick={handleDeleteOrder} disabled={saving} className="flex-1 py-5 rounded-3xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">
                                {saving ? 'Excluindo...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        {/* Toast */}
        {toast && (
            <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-fade-in transition-all ${
                toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : 'bg-red-950/90 border-red-500/30 text-red-400'
            }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <span className="material-symbols-outlined text-2xl">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-white leading-tight">{toast.message}</p>
                    <p className="text-[10px] font-medium opacity-60 mt-0.5">Gestão de Pedidos</p>
                </div>
                <button onClick={() => setToast(null)} className="ml-4 h-8 w-8 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        )}
        </>
    );
}
