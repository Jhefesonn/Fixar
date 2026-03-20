'use client';

import React, { useState } from 'react';
import PhotoField from './shared/PhotoField';
import BarcodeButton from './shared/BarcodeButton';

interface StockFormProps {
    initialData?: any;
    onSubmit: (formData: any) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export default function StockForm({ initialData, onSubmit, onCancel, loading }: StockFormProps) {
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
        brand: '',
        details: '',
        barcode: '',
        internal_code: '',
        unit: 'UN',
        cost_price: '0',
        unit_price: '0',
        profit_margin: '0',
        markup_percentage: '0',
        current_quantity: '0',
        min_quantity: '0',
        image_url: '',
        ...sanitizedInitialData,
    });

    const updateRegData = (field: string, value: any) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [field]: value };
            
            // Auto-calculate Financials
            const cost = parseFloat(field === 'cost_price' ? value : prev.cost_price) || 0;
            let marginPercent = parseFloat(field === 'profit_margin' ? value : prev.profit_margin) || 0;
            
            if (marginPercent >= 100) marginPercent = 99.99;
            if (field === 'profit_margin') newData.profit_margin = marginPercent.toString();

            const price = parseFloat(field === 'unit_price' ? value : prev.unit_price) || 0;

            if (field === 'cost_price' || field === 'profit_margin') {
                const factor = 1 - (marginPercent / 100);
                const calculatedPrice = cost / factor;
                newData.unit_price = calculatedPrice.toFixed(2);
                
                if (cost > 0) {
                    newData.markup_percentage = (((calculatedPrice - cost) / cost) * 100).toFixed(2);
                }
            } else if (field === 'unit_price') {
                if (price > 0) {
                    const marginValue = price - cost;
                    const calculatedMargin = (marginValue / price) * 100;
                    newData.profit_margin = Math.min(calculatedMargin, 99.99).toFixed(2);
                    
                    if (cost > 0) {
                        newData.markup_percentage = ((marginValue / cost) * 100).toFixed(2);
                    }
                }
            }
            
            return newData;
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateRegData(name, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
    const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
    const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
    const sectionTitle = "text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Lateral: Foto e Marca */}
                <div className="space-y-8">
                    <PhotoField 
                        value={formData.image_url}
                        onUpload={(url) => updateRegData('image_url', url)}
                        folder="stock"
                        label="Foto do Produto"
                        aspect={4/3}
                        icon="inventory_2"
                    />

                    <div className="space-y-6">
                        <div className="group/field">
                            <label className={labelClass}>Marca / Fabricante</label>
                            <input name="brand" value={formData.brand} onChange={handleInputChange} className={inputClass} placeholder="Ex: Samsung, LG..." />
                        </div>
                        <div className="group/field">
                            <label className={labelClass}>Unidade de Medida</label>
                            <select name="unit" value={formData.unit} onChange={handleInputChange} className={inputClass}>
                                <option value="UN" className="bg-navy-900">Unidade (UN)</option>
                                <option value="KG" className="bg-navy-900">Quilo (KG)</option>
                                <option value="L" className="bg-navy-900">Litro (L)</option>
                                <option value="M" className="bg-navy-900">Metro (M)</option>
                                <option value="CX" className="bg-navy-900">Caixa (CX)</option>
                                <option value="PAR" className="bg-navy-900">Par (PAR)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-8 bg-navy-950/50 border border-slate-800 rounded-[2.5rem] flex flex-col items-center text-center group/card transition-all hover:border-primary-600/30">
                        <div className="h-16 w-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-3xl">payments</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Lucro Estimado</p>
                        <p className="text-3xl font-black text-white tabular-nums drop-shadow-md">
                            R$ {(parseFloat(formData.unit_price || '0') - parseFloat(formData.cost_price || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-emerald-500 font-extrabold mt-2 uppercase tracking-widest">Lucro por Unidade</p>
                    </div>
                </div>

                {/* Central: Informações e Financeiro */}
                <div className="lg:col-span-2 space-y-12">
                    
                    <section>
                        <h4 className={sectionTitle}>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                            Identificação do Item
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 group/field">
                                <label className={labelClass}>Nome da Peça / Item *</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="Ex: Compressor 12.000 BTUs R410A" required />
                            </div>
                            <div className="md:col-span-2 group/field">
                                <label className={labelClass}>Detalhes / Especificações</label>
                                <textarea name="details" value={formData.details} onChange={handleInputChange} className={`${inputClass} min-h-[100px] resize-none`} placeholder="Detalhes técnicos, compatibilidade..." />
                            </div>
                            
                            <div className="group/field">
                                <label className={labelClass}>Código de Barras (EAN)</label>
                                <div className="relative">
                                    <input name="barcode" value={formData.barcode} onChange={handleInputChange} className={`${inputClass} pr-14`} placeholder="0000000000000" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <BarcodeButton onScan={(code) => updateRegData('barcode', code)} />
                                    </div>
                                </div>
                            </div>
                            <div className="group/field">
                                <label className={labelClass}>Código Interno (SKU)</label>
                                <input name="internal_code" value={formData.internal_code} onChange={handleInputChange} className={inputClass} placeholder="Ex: COMP-001" />
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        
                        <section className="space-y-6">
                            <h4 className={sectionTitle}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Financeiro
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group/field">
                                    <label className={labelClass}>Preço de Custo</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">R$</span>
                                        <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleInputChange} onFocus={selectOnFocus} className={`${inputClass} pl-12 font-black tabular-nums`} />
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className={labelClass}>Margem Lucro %</label>
                                    <div className="relative">
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">%</span>
                                        <input type="number" step="0.1" name="profit_margin" value={formData.profit_margin} onChange={handleInputChange} onFocus={selectOnFocus} max="99.99" className={`${inputClass} pr-12 font-black tabular-nums border-emerald-500/10`} />
                                    </div>
                                </div>
                                
                                <div className="group/field">
                                    <label className={labelClass}>Preço de Venda</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">R$</span>
                                        <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} onFocus={selectOnFocus} className={`${inputClass} pl-12 font-black tabular-nums border-emerald-500/20 text-emerald-400`} />
                                    </div>
                                </div>
                                <div className="group/field">
                                    <label className={labelClass}>Markup %</label>
                                    <div className="relative">
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">%</span>
                                        <input value={formData.markup_percentage} readOnly className={`${inputClass} pr-12 bg-navy-900/50 cursor-default border-none text-slate-500 font-bold tabular-nums`} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className={sectionTitle}>
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Inventário
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group/field">
                                    <label className={labelClass}>Estoque Atual</label>
                                    <input type="number" step="0.01" name="current_quantity" value={formData.current_quantity} onChange={handleInputChange} onFocus={selectOnFocus} className={`${inputClass} font-black tabular-nums`} />
                                </div>
                                <div className="group/field">
                                    <label className={labelClass}>Mínimo Alerta</label>
                                    <input type="number" step="0.01" name="min_quantity" value={formData.min_quantity} onChange={handleInputChange} onFocus={selectOnFocus} className={`${inputClass} font-black tabular-nums border-red-500/10`} />
                                </div>
                                
                                {parseFloat(formData.current_quantity) <= parseFloat(formData.min_quantity) && parseFloat(formData.current_quantity) > 0 && (
                                    <div className="col-span-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 animate-pulse">
                                        <span className="material-symbols-outlined text-amber-500">warning</span>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Estoque Crítico / Baixo</span>
                                    </div>
                                )}
                            </div>
                        </section>
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
                                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                                    {initialData ? 'Atualizar Item' : 'Cadastrar Item'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
