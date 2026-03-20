'use client';

import React, { useState, useEffect } from 'react';
import { getClients, getEquipmentsByClient } from '@/app/actions/equipments';
import { getServices } from '@/app/actions/services';
import { getStockItems } from '@/app/actions/stock';
import { getTechnicians } from '@/app/actions/equipments';
import PhotoField from './shared/PhotoField';

interface OrderFormProps {
    initialData?: any;
    onSubmit: (formData: any, services: any[], parts: any[]) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export default function OrderForm({ initialData, onSubmit, onCancel, loading }: OrderFormProps) {
    const [clients, setClients] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [availableParts, setAvailableParts] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        client_id: initialData?.client_id || '',
        equipment_id: initialData?.equipment_id || '',
        description: initialData?.description || '',
        validity_days: initialData?.validity_days?.toString() || '30',
        notes: initialData?.notes || '',
        image_url: initialData?.image_url || '',
        status: initialData?.status || 'pending',
        scheduled_at: initialData?.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
        technician_id: initialData?.technician_id || '',
        priority: initialData?.priority || 'medium',
    });

    const [selectedServices, setSelectedServices] = useState<any[]>(
        initialData?.services || initialData?.order_services || []
    );
    const [selectedParts, setSelectedParts] = useState<any[]>(
        initialData?.parts || initialData?.order_parts || []
    );

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            const [clientsData, servicesData, partsData, techsData] = await Promise.all([
                getClients(),
                getServices(),
                getStockItems(),
                getTechnicians()
            ]);
            setClients(clientsData);
            setAvailableServices(servicesData);
            setAvailableParts(partsData);
            setTechnicians(techsData);

            if (!initialData?.name) {
                // Auto-generate name for new orders
                const now = new Date();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const yy = String(now.getFullYear()).slice(-2);
                // We'll use a random 4-digit ID for now as placeholder, 
                // but real ID would come from server.
                const randomId = Math.floor(1000 + Math.random() * 9000);
                setFormData((prev: any) => ({ ...prev, name: `Pedido ${randomId} - ${mm} - ${yy}` }));
            }
        };
        loadData();
    }, [initialData]);

    // Load equipments when client changes
    useEffect(() => {
        if (formData.client_id) {
            getEquipmentsByClient(formData.client_id).then(setEquipments);
        } else {
            setEquipments([]);
        }
    }, [formData.client_id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const addService = (serviceId: string) => {
        const service = availableServices.find(s => s.id === serviceId);
        if (service && !selectedServices.find(s => s.id === serviceId)) {
            setSelectedServices([...selectedServices, { ...service, quantity: 1, unit: 'UN' }]);
        }
    };

    const removeService = (serviceId: string) => {
        setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    };

    const updateServiceQuantity = (serviceId: string, field: string, value: string) => {
        setSelectedServices(selectedServices.map(s => 
            s.id === serviceId ? { ...s, [field]: field === 'quantity' ? (parseFloat(value) || 1) : value } : s
        ));
    };

    const addPart = (partId: string) => {
        const part = availableParts.find(p => p.id === partId);
        if (part && !selectedParts.find(p => p.id === partId)) {
            setSelectedParts([...selectedParts, { ...part, quantity: 1 }]);
        }
    };

    const removePart = (partId: string) => {
        setSelectedParts(selectedParts.filter(p => p.id !== partId));
    };

    const updatePartQuantity = (partId: string, field: string, value: string) => {
        setSelectedParts(selectedParts.map(p => 
            p.id === partId ? { ...p, [field]: field === 'quantity' ? (parseFloat(value) || 1) : value } : p
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData, selectedServices, selectedParts);
    };

    const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
    const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
    const sectionTitle = "text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2";

    const calculateTotal = () => {
        const servicesTotal = selectedServices.reduce((acc, s) => acc + (parseFloat(s.price) * (s.quantity || 1)), 0);
        const partsTotal = selectedParts.reduce((acc, p) => acc + (parseFloat(p.price || p.unit_price) * (p.quantity || 1)), 0);
        return servicesTotal + partsTotal;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Lateral: Foto e Status */}
                <div className="space-y-8">
                    <PhotoField 
                        value={formData.image_url}
                        onUpload={(url) => setFormData((p: any) => ({ ...p, image_url: url }))}
                        folder="orders"
                        label="Foto do Pedido"
                        icon="receipt_long"
                    />
                    
                    <div className="space-y-6">
                        <div className="group/field">
                            <label className={labelClass}>Status do Pedido</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className={inputClass}
                            >
                                <option value="pending" className="bg-navy-900">⏳ Pendente (Orçamento)</option>
                                <option value="approved" className="bg-navy-900">✅ Aprovado (Agendado)</option>
                                <option value="completed" className="bg-navy-900">🏁 Concluído</option>
                                <option value="cancelled" className="bg-navy-900">❌ Cancelado</option>
                            </select>
                        </div>

                        <div className="group/field relative">
                            <label className={labelClass}>Data de Agendamento</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xl group-focus-within/field:text-primary-500 transition-colors">
                                    calendar_month
                                </span>
                                <input 
                                    type="datetime-local"
                                    name="scheduled_at"
                                    value={formData.scheduled_at}
                                    onChange={handleInputChange}
                                    className={`${inputClass} pl-12`}
                                />
                            </div>
                        </div>

                        <div className="group/field">
                            <label className={labelClass}>Técnico Responsável</label>
                            <select
                                name="technician_id"
                                value={formData.technician_id}
                                onChange={handleInputChange}
                                className={inputClass}
                            >
                                <option value="" className="bg-navy-900">Não atribuído</option>
                                {technicians.map(t => (
                                    <option key={t.id} value={t.id} className="bg-navy-900">{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="group/field">
                            <label className={labelClass}>Prioridade</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                className={inputClass}
                            >
                                <option value="low" className="bg-navy-900">Baixa</option>
                                <option value="medium" className="bg-navy-900">Média</option>
                                <option value="high" className="bg-navy-900">Alta / Urgente</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Central: Dados do Pedido, Serviços e Peças */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h4 className={sectionTitle}>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                            Identificação e Vínculo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 group/field">
                                <label className={labelClass}>Identificação do Pedido *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="Ex: Pedido 0001 - 03 - 24"
                                    required
                                />
                            </div>

                            <div className="group/field">
                                <label className={labelClass}>Cliente Proprietário *</label>
                                <select
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" className="bg-navy-900">Selecionar...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} className="bg-navy-900">{c.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="group/field">
                                <label className={labelClass}>Equipamento Atendido *</label>
                                <select
                                    name="equipment_id"
                                    value={formData.equipment_id}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    disabled={!formData.client_id}
                                    required
                                >
                                    <option value="" className="bg-navy-900">Selecionar...</option>
                                    {equipments.map(e => (
                                        <option key={e.id} value={e.id} className="bg-navy-900">{e.name} ({e.tag})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="group/field">
                                <label className={labelClass}>Validade do Orçamento (Dias)</label>
                                <input
                                    type="number"
                                    name="validity_days"
                                    value={formData.validity_days}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="30"
                                />
                            </div>

                            <div className="md:col-span-2 group/field">
                                <label className={labelClass}>Descrição do Problema / Solicitação</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`${inputClass} min-h-[100px] resize-none`}
                                    placeholder="Descreva o que precisa ser feito..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Services Selector */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className={sectionTitle}>
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                                Serviços Executados
                            </h4>
                            <select 
                                className="bg-navy-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/50"
                                onChange={(e) => {
                                    if(e.target.value) {
                                        addService(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="" className="bg-navy-900">+ Adicionar Serviço</option>
                                {availableServices.map(s => (
                                    <option key={s.id} value={s.id} className="bg-navy-900">{s.name} - R$ {s.price}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedServices.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl group/item gap-4 animate-fade-in">
                                    <div className="flex-1 flex flex-col">
                                        <span className="text-sm font-bold text-white mb-1">{s.name}</span>
                                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Unitário: R$ {parseFloat(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text"
                                                value={s.unit || 'UN'}
                                                onChange={(e) => updateServiceQuantity(s.id, 'unit', e.target.value)}
                                                className="w-14 bg-navy-950 border border-slate-800 rounded-xl py-2 px-1 text-center text-[10px] font-black text-slate-500"
                                                placeholder="UN"
                                            />
                                            <input 
                                                type="number"
                                                value={s.quantity || 1}
                                                onChange={(e) => updateServiceQuantity(s.id, 'quantity', e.target.value)}
                                                className="w-20 bg-navy-950 border border-slate-800 rounded-xl py-2 px-1 text-center text-sm text-white font-black"
                                                min="0"
                                            />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => removeService(s.id)}
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {selectedServices.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-slate-800/50 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Nenhum serviço selecionado
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Parts Selector */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className={sectionTitle}>
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                                Peças e Materiais
                            </h4>
                            <select 
                                className="bg-navy-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/50"
                                onChange={(e) => {
                                    if(e.target.value) {
                                        addPart(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="" className="bg-navy-900">+ Adicionar Peça</option>
                                {availableParts.map(p => (
                                    <option key={p.id} value={p.id} className="bg-navy-900">{p.name} - R$ {p.unit_price}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-3">
                            {selectedParts.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl group/item animate-fade-in">
                                    <div className="flex-1 flex flex-col">
                                        <span className="text-sm font-bold text-white mb-1">{p.name}</span>
                                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                                            Estoque: {p.current_quantity} {p.unit} | Unitário: R$ {parseFloat(p.price || p.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text"
                                                value={p.unit || 'UN'}
                                                onChange={(e) => updatePartQuantity(p.id, 'unit', e.target.value)}
                                                className="w-14 bg-navy-950 border border-slate-800 rounded-xl py-2 px-1 text-center text-[10px] font-black text-slate-500"
                                                placeholder="UN"
                                            />
                                            <input 
                                                type="number"
                                                value={p.quantity}
                                                onChange={(e) => updatePartQuantity(p.id, 'quantity', e.target.value)}
                                                className="w-20 bg-navy-950 border border-slate-800 rounded-xl py-2 px-1 text-center text-sm text-white font-black"
                                                min="0"
                                            />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => removePart(p.id)}
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {selectedParts.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-slate-800/50 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Nenhuma peça selecionada
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h4 className={sectionTitle}>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                            Anotações Internas
                        </h4>
                        <div className="group/field">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className={`${inputClass} min-h-[100px] resize-none`}
                                placeholder="Anotações privadas para a equipe..."
                            />
                        </div>
                    </section>
                </div>
            </div>

            {/* Total Preview */}
            <div className="bg-navy-950/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group/total">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-6 relative">
                    <div className="h-16 w-16 rounded-[2rem] bg-primary-600/10 flex items-center justify-center text-primary-600 shadow-inner group-hover/total:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-4xl">payments</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-2">Total Estimado</p>
                        <p className="text-sm text-slate-400 font-medium">Soma de todos os serviços e produtos selecionados</p>
                    </div>
                </div>
                <div className="text-right relative">
                    <span className="text-5xl font-black text-white pr-2 tracking-tighter tabular-nums drop-shadow-lg">
                        R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-800/50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-8 py-4 rounded-2xl border border-slate-800 text-slate-400 text-sm font-bold hover:bg-white/[0.02] hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                            {initialData ? 'Atualizar Pedido' : 'Gerar Pedido'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
