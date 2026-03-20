'use client';

import React, { useState, useCallback } from 'react';
import PhotoField from './shared/PhotoField';

interface Contact {
  name: string;
  role: string;
  department: string;
  number: string;
}

interface ClientFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  publicInviteWarning?: boolean;
}

export default function ClientForm({ initialData, onSubmit, onCancel, loading, publicInviteWarning }: ClientFormProps) {
  const sanitizedInitialData = initialData
    ? Object.fromEntries(
        Object.entries(initialData).map(([key, value]) => [
          key,
          value === null || value === undefined ? '' : value,
        ])
      )
    : {};

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    document: '',
    source: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    birthday: '',
    notes: '',
    avatar_url: '',
    contacts: [] as Contact[],
    ...sanitizedInitialData
  });

  const sourceOptions = ['Google', 'Facebook', 'Instagram', 'Indicação', 'Site', 'Outro'];
  const stateOptions = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  const updateRegData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateRegData(name, value);
  };

  const fetchCep = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev: any) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  const addContact = () => {
    const newContact: Contact = { name: '', role: '', department: '', number: '' };
    updateRegData('contacts', [...formData.contacts, newContact]);
  };

  const removeContact = (index: number) => {
    const newContacts = formData.contacts.filter((_: Contact, i: number) => i !== index);
    updateRegData('contacts', newContacts);
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    updateRegData('contacts', newContacts);
  };

  const [passwordChecked, setPasswordChecked] = useState(false);
  const [shakeAlert, setShakeAlert] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (publicInviteWarning && !passwordChecked) {
      setShakeAlert(false);
      setTimeout(() => setShakeAlert(true), 10);
      return;
    }
    onSubmit(formData);
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
  const sectionTitle = "text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Lateral: Foto e Perfil */}
        <div className="space-y-8">
          <PhotoField 
            value={formData.avatar_url}
            onUpload={(url) => updateRegData('avatar_url', url)}
            folder="avatars"
            label="Foto do Cliente"
            shape="round"
            aspect={1}
            icon="person"
          />

          <div className="space-y-6">
            <div className="group/field">
              <label className={labelClass}>Como nos conheceu?</label>
              <select name="source" value={formData.source} onChange={handleInputChange} className={inputClass}>
                <option value="" className="bg-navy-900">Selecione...</option>
                {sourceOptions.map(s => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
              </select>
            </div>
            <div className="group/field">
              <label className={labelClass}>Data de Nascimento</label>
              <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Central: Dados Pessoais e Endereço */}
        <div className="lg:col-span-2 space-y-12">
          
          <section>
            <h4 className={sectionTitle}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Informações Pessoais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 group/field">
                <label className={labelClass}>Nome Completo *</label>
                <input name="full_name" value={formData.full_name} onChange={handleInputChange} className={inputClass} placeholder="Nome do cliente" required />
              </div>
              <div className="group/field">
                <label className={labelClass}>E-mail *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="cliente@email.com" required />
              </div>
              <div className="group/field">
                <label className={labelClass}>WhatsApp / Telefone</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className={inputClass} placeholder="(00) 00000-0000" />
              </div>
              <div className="group/field">
                <label className={labelClass}>CPF / CNPJ</label>
                <input name="document" value={formData.document} onChange={handleInputChange} className={inputClass} placeholder="000.000.000-00" />
              </div>
            </div>
          </section>

          <section>
            <h4 className={sectionTitle}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Endereço e Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group/field">
                <label className={labelClass}>CEP</label>
                <input name="cep" value={formData.cep} onChange={handleInputChange} onBlur={fetchCep} className={inputClass} placeholder="00000-000" />
              </div>
              <div className="md:col-span-2 group/field">
                <label className={labelClass}>Logradouro (Rua/Av)</label>
                <input name="street" value={formData.street} onChange={handleInputChange} className={inputClass} placeholder="Rua..." />
              </div>
              <div className="group/field">
                <label className={labelClass}>Número</label>
                <input name="number" value={formData.number} onChange={handleInputChange} className={inputClass} placeholder="123" />
              </div>
              <div className="group/field">
                <label className={labelClass}>Bairro</label>
                <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className={inputClass} placeholder="Bairro" />
              </div>
              <div className="group/field">
                <label className={labelClass}>Complemento</label>
                <input name="complement" value={formData.complement} onChange={handleInputChange} className={inputClass} placeholder="Apto, Sala..." />
              </div>
              <div className="md:col-span-2 group/field">
                <label className={labelClass}>Cidade</label>
                <input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="Cidade" />
              </div>
              <div className="group/field">
                <label className={labelClass}>Estado</label>
                <select name="state" value={formData.state} onChange={handleInputChange} className={inputClass}>
                  <option value="" className="bg-navy-900">UF</option>
                  {stateOptions.map(s => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Additional Contacts */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h4 className={sectionTitle}>
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                Contatos Adicionais
              </h4>
              <button 
                type="button" 
                onClick={addContact}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors bg-navy-950 border border-slate-800 px-3 py-1.5 rounded-lg"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar Contato
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.contacts.map((contact: Contact, index: number) => (
                <div key={index} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative animate-fade-in group/contact">
                  <button 
                    type="button" 
                    onClick={() => removeContact(index)}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover/contact:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} className={`${inputClass} !py-2.5`} placeholder="Nome" />
                    </div>
                    <div>
                      <label className={labelClass}>Cargo</label>
                      <input value={contact.role} onChange={(e) => updateContact(index, 'role', e.target.value)} className={`${inputClass} !py-2.5`} placeholder="Cargo" />
                    </div>
                    <div>
                      <label className={labelClass}>Setor</label>
                      <input value={contact.department} onChange={(e) => updateContact(index, 'department', e.target.value)} className={`${inputClass} !py-2.5`} placeholder="Setor" />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp</label>
                      <input value={contact.number} onChange={(e) => updateContact(index, 'number', e.target.value)} className={`${inputClass} !py-2.5`} placeholder="WhatsApp" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className={sectionTitle}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Observações Adicionais
            </h4>
            <div className="group/field">
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${inputClass} min-h-[120px] resize-none`} placeholder="Histórico, alertas..." />
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="flex flex-col gap-6 pt-10 border-t border-slate-800/50">
        
        {publicInviteWarning && (
          <div className={`bg-[#332a00] border border-amber-500/30 rounded-3xl p-6 flex flex-col gap-4 transition-transform shadow-lg ${shakeAlert ? 'animate-shake' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Acesso Inicial ao Sistema</h4>
                <p className="text-sm text-amber-100/70 leading-relaxed font-medium">
                  Ao finalizar o cadastro, será criada a sua conta. A sua senha temporária de acesso inicial será <strong className="text-amber-300 font-mono bg-black/40 px-2 py-0.5 rounded shadow-inner">temp123</strong>. Você DEVE alterá-la no seu primeiro acesso.
                </p>
              </div>
            </div>
            
            <hr className="border-amber-500/10 my-1" />
            
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <input type="checkbox" className="hidden" checked={passwordChecked} onChange={(e) => setPasswordChecked(e.target.checked)} />
              <div className={`h-6 w-6 rounded-md border-2 transition-all flex items-center justify-center shadow-lg ${passwordChecked ? 'bg-amber-500 border-amber-500 text-black' : 'bg-black/50 border-amber-500/30 group-hover:border-amber-500 group-hover:bg-amber-500/10'}`}>
                <span className={`material-symbols-outlined text-[16px] font-black transition-all ${passwordChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>check</span>
              </div>
              <span className={`text-sm font-bold transition-colors ${passwordChecked ? 'text-amber-400' : 'text-amber-100/60 group-hover:text-amber-200'}`}>
                Estou ciente que minha senha provisória será temp123.
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-col-reverse md:flex-row items-center md:justify-end gap-3 md:gap-4 w-full">
          <button 
            type="button" 
            onClick={onCancel} 
            className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 rounded-2xl border border-slate-800 text-slate-400 text-sm font-bold hover:bg-white/[0.02] hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50" 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="w-full md:w-auto px-6 md:px-10 py-3.5 md:py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check</span>
                {initialData ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
