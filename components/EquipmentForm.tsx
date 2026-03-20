'use client';

import React, { useState, useEffect } from 'react';
import PhotoField from './shared/PhotoField';
import BarcodeButton from './shared/BarcodeButton';
import { getClients } from '@/app/actions/equipments';

interface EquipmentFormProps {
  initialData?: any;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  fixedClientId?: string;
  defaultHasContract?: boolean;
}

export default function EquipmentForm({ initialData, onSubmit, onCancel, loading, fixedClientId, defaultHasContract }: EquipmentFormProps) {
  const sanitizedInitialData = initialData
    ? Object.fromEntries(
        Object.entries(initialData).map(([key, value]) => [
          key,
          value === null || value === undefined ? '' : value,
        ])
      )
    : {};

  const [formData, setFormData] = useState({
    tag: '',
    name: '',
    brand: '',
    client_id: fixedClientId || '',
    environment: '',
    model: '',
    capacity: '',
    voltage: '',
    refrigerant_fluid: '',
    has_contract: defaultHasContract || false,
    contract_periodicity: 'monthly',
    photo_url: '',
    ...sanitizedInitialData
  });

  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const initialLoaded = React.useRef(false);

  useEffect(() => {
    if (initialLoaded.current) return;

    const loadInitialData = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);

        if (initialData?.id) {
          const { getEquipmentContracts } = await import('@/app/actions/equipments');
          const contractsData = await getEquipmentContracts(initialData.id);
          setContracts(contractsData.length > 0 ? contractsData : []);
          initialLoaded.current = true;
        } else if (defaultHasContract) {
          setContracts([{ 
            id: crypto.randomUUID(),
            name: 'Contrato Padrão', 
            type: 'Manutenção Preventiva', 
            periodicity: 'monthly',
            start_date: new Date().toISOString().split('T')[0],
            duration_months: 12,
            monthly_price: 0
          }]);
          initialLoaded.current = true;
        } else {
          initialLoaded.current = true;
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadInitialData();
  }, [initialData?.id, defaultHasContract]);

  const addContract = () => {
    setContracts([...contracts, { 
      id: crypto.randomUUID(), 
      name: 'Novo Contrato', 
      type: 'Manutenção Preventiva', 
      periodicity: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      duration_months: 12,
      monthly_price: 0
    }]);
  };

  const removeContract = (index: number) => {
    setContracts(contracts.filter((_, i) => i !== index));
  };

  const updateContract = (index: number, field: string, value: any) => {
    const newContracts = [...contracts];
    newContracts[index] = { ...newContracts[index], [field]: value };
    setContracts(newContracts);
  };

  const updateRegData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    updateRegData(name, val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-set has_contract based on contracts list
    const has_contract = contracts.length > 0;
    
    // Pass everything to the parent component
    await onSubmit({ ...formData, has_contract, contracts });
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
  const sectionTitle = "text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Lateral: Foto e Identificação Rápida */}
        <div className="space-y-8">
          <PhotoField 
            value={formData.photo_url}
            onUpload={(url) => updateRegData('photo_url', url)}
            folder="equipments"
            label="Foto do Equipamento"
            aspect={4/3}
            icon="ac_unit"
          />

          <div className="space-y-6">
            <div className="group/field">
              <label className={labelClass}>Identificação (TAG / Serial)</label>
              <div className="relative">
                <input name="tag" value={formData.tag} onChange={handleInputChange} className={`${inputClass} pr-14`} placeholder="000000" />
                <BarcodeButton onScan={(code) => updateRegData('tag', code)} title="Leitor de TAG" />
              </div>
            </div>
            
            <div className="group/field">
              <label className={labelClass}>Cliente Proprietário *</label>
              <select
                name="client_id"
                className={inputClass}
                value={formData.client_id}
                onChange={(e) => updateRegData('client_id', e.target.value)}
                disabled={!!fixedClientId}
                required
              >
                <option value="">Selecione...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Central: Detalhes Técnicos */}
        <div className="lg:col-span-2 space-y-12">
          
          <section>
            <h4 className={sectionTitle}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Informações Gerais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 group/field">
                <label className={labelClass}>Nome do Equipamento *</label>
                <input name="name" value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="Ex: Ar Condicionado Split" required />
              </div>
              <div className="group/field">
                <label className={labelClass}>Marca</label>
                <input name="brand" value={formData.brand} onChange={handleInputChange} className={inputClass} placeholder="Ex: LG, Samsung, Midea..." />
              </div>
              <div className="group/field">
                <label className={labelClass}>Modelo</label>
                <input name="model" value={formData.model} onChange={handleInputChange} className={inputClass} placeholder="Ex: ASW-12B4" />
              </div>
            </div>
          </section>

          <section>
            <h4 className={sectionTitle}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Especificações Técnicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group/field">
                <label className={labelClass}>Ambiente / Localização</label>
                <input name="environment" value={formData.environment} onChange={handleInputChange} className={inputClass} placeholder="Ex: Escritório 01" />
              </div>
              <div className="group/field">
                <label className={labelClass}>Capacidade (BTUs/TR)</label>
                <input name="capacity" value={formData.capacity} onChange={handleInputChange} className={inputClass} placeholder="Ex: 12.000 BTUs" />
              </div>
              <div className="group/field">
                <label className={labelClass}>Tensão (V)</label>
                <input name="voltage" value={formData.voltage} onChange={handleInputChange} className={inputClass} placeholder="220V" />
              </div>
              <div className="md:col-span-1 group/field">
                <label className={labelClass}>Fluido Refrigerante</label>
                <input name="refrigerant_fluid" value={formData.refrigerant_fluid} onChange={handleInputChange} className={inputClass} placeholder="R-410A" />
              </div>
            </div>
          </section>

          <section>
            <div className="bg-navy-950/50 border border-slate-800/50 rounded-2xl p-6 flex items-center gap-4 group/notice transition-all hover:border-primary-600/20 shadow-inner">
              <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">info</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Gestão de Contratos</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 leading-relaxed">
                  Contratos são gerenciados de forma centralizada na aba <span className="text-primary-500">Contratos</span>.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-800/50">
        <button type="button" onClick={onCancel} className="px-8 py-4 rounded-2xl border border-slate-800 text-slate-400 text-sm font-bold hover:bg-white/[0.02] hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3" disabled={loading}>
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">check</span>
              {initialData ? 'Atualizar Equipamento' : 'Cadastrar Equipamento'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
