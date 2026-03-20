'use client';

import React, { useState } from 'react';
import PhotoField from './shared/PhotoField';

interface ServiceFormProps {
    initialData?: any;
    onSubmit: (formData: any) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export default function ServiceForm({ initialData, onSubmit, onCancel, loading }: ServiceFormProps) {
    const sanitizedInitialData = initialData
        ? Object.fromEntries(
            Object.entries(initialData).map(([key, value]) => [
                key,
                value === null ? '' : value,
            ])
        )
        : {};

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        estimated_time: '',
        image_url: '',
        ...sanitizedInitialData,
    });

    const updateRegData = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
    const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
    const sectionTitle = "text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Lateral: Foto */}
                <div className="space-y-8">
                    <PhotoField 
                        value={formData.image_url}
                        onUpload={(url) => updateRegData('image_url', url)}
                        folder="services"
                        label="Imagem do Serviço"
                        aspect={4/3}
                        icon="construction"
                    />
                    
                    <div className="p-6 bg-navy-950/30 border border-slate-800/50 rounded-3xl">
                        <h4 className={sectionTitle}>Resumo</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                            Defina serviços padrão para facilitar a criação de orçamentos e ordens de serviço.
                        </p>
                    </div>
                </div>

                {/* Central: Informações */}
                <div className="md:col-span-2 space-y-12">
                    <section>
                        <h4 className={sectionTitle}>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                            Informações Gerais
                        </h4>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="group/field">
                                <label className={labelClass}>Nome do Serviço *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="Ex: Manutenção Preventiva - Ar Condicionado"
                                    required
                                />
                            </div>

                            <div className="group/field">
                                <label className={labelClass}>Descrição Detalhada</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`${inputClass} min-h-[120px] resize-none`}
                                    placeholder="Descreva o que está incluso neste serviço..."
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className={sectionTitle}>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                            Precificação e Tempo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group/field">
                                <label className={labelClass}>Preço Sugerido (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs pointer-events-none">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className={`${inputClass} pl-12 font-black tabular-nums`}
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group/field">
                                <label className={labelClass}>Tempo Estimado</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg pointer-events-none">schedule</span>
                                    <input
                                        name="estimated_time"
                                        value={formData.estimated_time}
                                        onChange={handleInputChange}
                                        className={`${inputClass} pl-12`}
                                        placeholder="Ex: 1h 30m, 2h..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

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
                                    <span className="material-symbols-outlined text-lg">save_as</span>
                                    {initialData ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
