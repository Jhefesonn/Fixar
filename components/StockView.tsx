'use client';

import React, { useState, useEffect } from 'react';
import { 
    getStockItems, 
    adminCreateStockItem, 
    adminUpdateStockItem, 
    adminDeleteStockItem,
    adminRestockItem 
} from '@/app/actions/stock';
import StockForm from './StockForm';

interface StockViewProps {
    externalSearch?: string;
}

export default function StockView({ externalSearch = "" }: StockViewProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [itemToRestock, setItemToRestock] = useState<any>(null);
    const [restockData, setRestockData] = useState({ quantity: 1, cost: 0, margin: 0 });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getStockItems();
            setItems(data || []);
        } catch (err) {
            console.error('Erro ao buscar estoque:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveItem = async (formData: any) => {
        setSaving(true);
        try {
            if (isEditing && itemToEdit) {
                await adminUpdateStockItem(itemToEdit.id, formData);
                showToast('Item atualizado com sucesso!');
            } else {
                await adminCreateStockItem(formData);
                showToast('Item cadastrado com sucesso!');
            }
            setIsModalOpen(false);
            setIsEditing(false);
            setItemToEdit(null);
            fetchItems();
        } catch (err: any) {
            showToast('Erro ao salvar item: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        setSaving(true);
        try {
            await adminDeleteStockItem(itemToDelete.id);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchItems();
            showToast('Item excluído com sucesso!');
        } catch (err: any) {
            showToast('Erro ao excluir item: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = items.filter(i => 
        i.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        i.barcode?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        i.internal_code?.toLowerCase().includes(externalSearch.toLowerCase()) ||
        i.brand?.toLowerCase().includes(externalSearch.toLowerCase())
    );

    return (
        <>
        <div className="space-y-8 animate-fade-in relative">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">inventory_2</span>
                        Estoque
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Controle de peças, ferramentas e insumos</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setIsEditing(false); setItemToEdit(null); setIsModalOpen(true); }}
                        className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
                        <span className="font-bold text-sm">Novo Item</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-navy-900/50 border border-slate-800/50 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="hidden md:block overflow-x-auto custom-scrollbar border-b border-slate-800/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-navy-950/50 border-b border-slate-800/50">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item / Identificação</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Financeiro</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estoque Mob.</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Consultando estoque...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isLowStock = parseFloat(item.current_quantity) <= parseFloat(item.min_quantity);
                                    
                                    return (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4 min-w-[300px]">
                                                    <div className="h-14 w-14 rounded-2xl bg-navy-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg relative">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-slate-700">
                                                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                                                            </div>
                                                        )}
                                                        {isLowStock && (
                                                            <div className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-navy-950 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <button 
                                                            onClick={() => { setSelectedItem(item); setIsDetailsOpen(true); }}
                                                            className="text-left group/name"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-white group-hover/name:text-amber-500 transition-colors truncate">{item.name}</span>
                                                                {item.brand && <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-slate-800 text-[9px] font-black text-slate-500 uppercase">{item.brand}</span>}
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] text-slate-500 font-medium">Cod: {item.internal_code || '---'}</span>
                                                            {item.barcode && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                                                    <span className="material-symbols-outlined text-[12px]">barcode</span>
                                                                    <span>{item.barcode}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-white tabular-nums">R$ {item.unit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-slate-500 font-black uppercase">Custo: R$ {item.cost_price?.toFixed(2)}</span>
                                                        <span className="text-[9px] text-emerald-500 font-black uppercase"> {item.markup_percentage?.toFixed(1)}% MK</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-end gap-1.5">
                                                        <span className={`text-base font-black tabular-nums ${isLowStock ? 'text-red-500' : 'text-white'}`}>
                                                            {item.current_quantity}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold mb-0.5">{item.unit}</span>
                                                    </div>
                                                    {isLowStock ? (
                                                        <span className="text-[9px] font-black text-red-500/80 uppercase tracking-widest flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">warning</span>
                                                            Estoque Baixo
                                                        </span>
                                                    ) : (
                                                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                                                style={{ width: `${Math.min((item.current_quantity / (item.min_quantity * 3)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => { 
                                                            setItemToRestock(item); 
                                                            setRestockData({ 
                                                                quantity: 1, 
                                                                cost: parseFloat(item.cost_price) || 0,
                                                                margin: parseFloat(item.profit_margin) || 0
                                                            });
                                                            setIsRestockModalOpen(true); 
                                                        }}
                                                        className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center shadow-lg"
                                                        title="Repor Peças"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add_box</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setItemToEdit(item); setIsEditing(true); setIsModalOpen(true); }}
                                                        className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-primary-600 hover:border-primary-600/30 transition-all flex items-center justify-center shadow-lg"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                                        className="h-9 w-9 rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center shadow-lg"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-700">
                                            <span className="material-symbols-outlined text-6xl">inventory_2</span>
                                            <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Nenhum item em estoque</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden flex flex-col divide-y divide-slate-800/20">
                    {loading ? (
                        <div className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Consultando estoque...</span>
                            </div>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                            const isLowStock = parseFloat(item.current_quantity) <= parseFloat(item.min_quantity);
                            
                            return (
                                <div key={item.id} className="p-5 flex flex-col gap-4 active:bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-navy-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-700">
                                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                                </div>
                                            )}
                                            {isLowStock && (
                                                <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-navy-950 animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-base font-bold text-white truncate leading-tight">{item.name}</span>
                                                {isLowStock && (
                                                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-widest shrink-0">Baixo</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cod: {item.internal_code || '---'}</span>
                                                {item.brand && <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-slate-800 text-[9px] font-bold text-slate-400">{item.brand}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Preço Sugerido</span>
                                            <span className="text-sm font-black text-white tabular-nums">
                                                R$ {item.unit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1 text-left">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-left">Qtd Atual</span>
                                            <div className="flex items-end gap-1.5">
                                                <span className={`text-base font-black tabular-nums ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {item.current_quantity}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold mb-0.5">{item.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => { 
                                                setItemToRestock(item); 
                                                setRestockData({ 
                                                    quantity: 1, 
                                                    cost: parseFloat(item.cost_price) || 0,
                                                    margin: parseFloat(item.profit_margin) || 0
                                                });
                                                setIsRestockModalOpen(true); 
                                            }}
                                            className="flex-1 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-500 active:bg-amber-500 active:text-navy-950 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_box</span>
                                            Repor
                                        </button>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { setItemToEdit(item); setIsEditing(true); setIsModalOpen(true); }}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-primary-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-6 py-20 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                            Nenhum item em estoque
                        </div>
                    )}
                </div>
            </div>
        </div>

                 {/* Modal Reposição */}
            {isRestockModalOpen && itemToRestock && (
                <div 
                    className="fixed inset-0 z-[1520] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsRestockModalOpen(false); }}
                >
                    <div className="bg-navy-900 border border-slate-800 rounded-[32px] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        {/* Header Centralizado */}
                        <div className="p-8 border-b border-slate-800/50 flex flex-col items-center text-center bg-navy-950/50 relative">
                            <button 
                                onClick={() => setIsRestockModalOpen(false)} 
                                className="absolute right-4 top-4 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500 transition-all active:scale-95 z-10"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                            
                            <div className="h-14 w-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-4 shadow-lg shadow-primary-500/5">
                                <span className="material-symbols-outlined text-3xl">add_box</span>
                            </div>
                            
                            <h3 className="text-xl font-black text-white leading-tight">
                                <span className="block text-[10px] text-primary-500 font-black uppercase tracking-[0.3em] mb-2">Entrada de Material</span>
                                <span className="italic opacity-90 block truncate max-w-[300px] mx-auto text-base font-medium">{itemToRestock.name}</span>
                            </h3>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Form Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group/field">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Quantidade</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={restockData.quantity} 
                                            onChange={(e) => setRestockData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-inner"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[9px] font-bold uppercase tracking-widest">{itemToRestock.unit}</span>
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Preço Compra</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[9px] font-bold uppercase">R$</span>
                                        <input 
                                            type="number" 
                                            value={restockData.cost} 
                                            onChange={(e) => setRestockData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="group/field col-span-2">
                                    <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Margem de Lucro %</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            max="99.99"
                                            value={restockData.margin} 
                                            onChange={(e) => setRestockData(prev => ({ ...prev, margin: Math.min(parseFloat(e.target.value) || 0, 99.99) }))}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-navy-950 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 text-[10px] font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Previsão - Compacto */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-slate-800 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">query_stats</span>
                                    Resultado Pós-Reposição
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Custo Médio</p>
                                        <p className="text-lg font-black text-white tabular-nums tracking-tight">
                                            <span className="text-[10px] opacity-40 font-medium mr-1">R$</span>
                                            {(( (parseFloat(itemToRestock.current_quantity) * parseFloat(itemToRestock.cost_price)) + (restockData.quantity * restockData.cost) ) / (parseFloat(itemToRestock.current_quantity) + restockData.quantity || 1)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-800/50 pl-4">
                                        <p className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest">Preço Venda</p>
                                        <p className="text-lg font-black text-emerald-400 tabular-nums tracking-tight">
                                            <span className="text-[10px] opacity-40 font-medium mr-1">R$</span>
                                            {(
                                                (( (parseFloat(itemToRestock.current_quantity) * parseFloat(itemToRestock.cost_price)) + (restockData.quantity * restockData.cost) ) / (parseFloat(itemToRestock.current_quantity) + restockData.quantity || 1)) 
                                                / (1 - (restockData.margin / 100))
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 pt-2">
                                <button onClick={() => setIsRestockModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-white/[0.02] hover:text-white transition-all active:scale-95">
                                    Cancelar
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (restockData.quantity <= 0) return showToast('A quantidade deve ser maior que zero', 'error');
                                        setSaving(true);
                                        try {
                                            await adminRestockItem(itemToRestock.id, restockData.quantity, restockData.cost, restockData.margin);
                                            showToast('Reposição realizada com sucesso!');
                                            setIsRestockModalOpen(false);
                                            fetchItems();
                                        } catch (err: any) {
                                            showToast('Erro ao repor: ' + err.message, 'error');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                    className="flex-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Gravando...' : 'Gravar Entrada'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                >
                    <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <span className="material-symbols-outlined text-3xl">{isEditing ? 'edit_square' : 'inventory_2'}</span>
                                </div>
                                <div>
                                    <span className="block">{isEditing ? 'Editar Item' : 'Novo Item no Estoque'}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Gestão de Peças e Ferramentas</span>
                                </div>
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                            <StockForm 
                                initialData={isEditing ? itemToEdit : null}
                                onSubmit={handleSaveItem}
                                onCancel={() => setIsModalOpen(false)}
                                loading={saving}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalhes */}
            {isDetailsOpen && selectedItem && (
                <div 
                    className="fixed inset-0 z-[1510] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsOpen(false); }}
                >
                    <div className="bg-navy-900 border border-slate-800 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in">
                        {/* Header Detalhes */}
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white leading-none">{selectedItem.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{selectedItem.brand || 'Marca não informada'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { setIsDetailsOpen(false); setItemToEdit(selectedItem); setIsEditing(true); setIsModalOpen(true); }}
                                    className="h-12 px-6 rounded-2xl bg-white/5 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center gap-2 font-bold text-xs"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Editar
                                </button>
                                <button 
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 lg:p-10 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Image & Identification */}
                                <div className="space-y-8">
                                    <div className="aspect-[4/3] rounded-[32px] bg-navy-950 border border-slate-800 overflow-hidden shadow-2xl relative group">
                                        {selectedItem.image_url ? (
                                            <img src={selectedItem.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center text-slate-800 gap-4">
                                                <span className="material-symbols-outlined text-7xl">image</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sem imagem disponível</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                                            {selectedItem.unit}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-slate-800/50">
                                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Códigos e Identificação</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">Código Interno (SKU)</span>
                                                    <span className="text-xs font-black text-white uppercase tabular-nums tracking-wider">{selectedItem.internal_code || '---'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium font-medium">EAN / Código de Barras</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-600">barcode</span>
                                                        <span className="text-xs font-black text-white tabular-nums tracking-widest">{selectedItem.barcode || 'Não registrado'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-slate-800/50">
                                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Detalhes Adicionais</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed italic">
                                                {selectedItem.details || 'Nenhuma descrição adicional informada para este item.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Financial & Inventory */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Financial Summary Card */}
                                        <div className="p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xl relative overflow-hidden group">
                                            <div className="absolute -right-6 -top-6 h-32 w-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Resumo Financeiro</h4>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Preço de Venda</p>
                                                    <p className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                                        <span className="text-lg opacity-40 font-medium mr-1">R$</span>
                                                        {selectedItem.unit_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Custo do Item</p>
                                                        <p className="text-lg font-bold text-white tabular-nums">R$ {selectedItem.cost_price?.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Margem Real</p>
                                                        <p className="text-lg font-bold text-emerald-400 tabular-nums">R$ {(selectedItem.unit_price - selectedItem.cost_price).toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pt-4">
                                                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase whitespace-nowrap">
                                                        Markup: {selectedItem.markup_percentage?.toFixed(1)}%
                                                    </div>
                                                    <div className="px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-[10px] font-black text-primary-500 uppercase whitespace-nowrap">
                                                        Margem Lucro: {selectedItem.profit_margin?.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inventory Status Card */}
                                        <div className={`p-8 rounded-[32px] border shadow-xl relative overflow-hidden ${
                                            parseFloat(selectedItem.current_quantity) <= parseFloat(selectedItem.min_quantity)
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-white/[0.02] border-slate-800'
                                        }`}>
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${
                                                parseFloat(selectedItem.current_quantity) <= parseFloat(selectedItem.min_quantity) ? 'text-red-500' : 'text-slate-500'
                                            }`}>Status do Estoque</h4>

                                            <div className="space-y-8">
                                                <div className="flex items-end justify-between">
                                                    <div className="flex items-end gap-2">
                                                        <span className="text-5xl font-black text-white tabular-nums leading-none">{selectedItem.current_quantity}</span>
                                                        <span className="text-sm text-slate-500 font-bold mb-1">{selectedItem.unit}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Nível Mínimo</p>
                                                        <p className="text-lg font-bold text-white tabular-nums">{selectedItem.min_quantity} {selectedItem.unit}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="h-3 w-full bg-navy-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                parseFloat(selectedItem.current_quantity) <= parseFloat(selectedItem.min_quantity) ? 'bg-red-500' : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min((selectedItem.current_quantity / (selectedItem.min_quantity * 3)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                        <span className={parseFloat(selectedItem.current_quantity) <= parseFloat(selectedItem.min_quantity) ? 'text-red-500' : 'text-slate-600'}>
                                                            {parseFloat(selectedItem.current_quantity) <= parseFloat(selectedItem.min_quantity) ? 'Reposição Imediata' : 'Nível Saudável'}
                                                        </span>
                                                        <span className="text-slate-600">Capacidade Sugerida: {(selectedItem.min_quantity * 3).toFixed(0)} {selectedItem.unit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Excluir */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-[1510] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
                    <div className="bg-navy-900 border border-red-500/20 rounded-[40px] w-full max-w-md p-10 text-center shadow-2xl scale-in">
                        <div className="h-24 w-24 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-8 ring-8 ring-red-500/5">
                            <span className="material-symbols-outlined text-5xl">warning</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4">Remover Item?</h3>
                        <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                            Você está removendo <span className="text-white font-bold">{itemToDelete.name}</span> permanentemente do seu controle de estoque.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 rounded-3xl border border-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">Cancelar</button>
                            <button onClick={handleDeleteItem} disabled={saving} className="flex-1 py-5 rounded-3xl bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95">
                                {saving ? 'Removendo...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        
        {/* Toast - Posicionado no canto inferior direito, fora da div animada */}
        {toast && (
            <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-fade-in transition-all ${
                toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : 'bg-red-950/90 border-red-500/30 text-red-400'
            }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <span className="material-symbols-outlined text-2xl">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-white leading-tight">{toast.message}</p>
                    <p className="text-[10px] font-medium opacity-60 mt-0.5">Gestão de Estoque</p>
                </div>
                <button onClick={() => setToast(null)} className="ml-4 h-8 w-8 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        )}
        </>
    );
}
