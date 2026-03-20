'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getClients } from '@/app/actions/equipments';
import { saveFinancialRecord, saveFinancialDocument, FinancialRecord, getRecentOrders, getActiveContracts } from '@/app/actions/financial';
import { getOrderDetails } from '@/app/actions/orders';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: FinancialRecord | null;
}

export default function InvoiceModal({ isOpen, onClose, onSuccess, initialData }: InvoiceModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [originType, setOriginType] = useState<'order' | 'contract' | 'none'>('none');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    paid_at: '',
    status: 'pending' as any,
    type: 'income' as any,
    category: 'other',
    client_id: '',
    order_id: '',
    contract_id: '',
    equipment_id: ''
  });

  const [displayInfo, setDisplayInfo] = useState({
    client_name: '',
    equipment_name: ''
  });

  useEffect(() => {
    if (isOpen) {
      getClients().then(setClients);
      getRecentOrders().then(setOrders);
      getActiveContracts().then(setContracts);

      if (initialData) {
        setFormData({
          description: initialData.description,
          amount: initialData.amount.toString(),
          due_date: initialData.due_date ? initialData.due_date.slice(0, 10) : '',
          paid_at: initialData.paid_at ? initialData.paid_at.slice(0, 10) : '',
          status: initialData.status,
          type: initialData.type,
          category: initialData.category,
          client_id: initialData.client_id || '',
          order_id: initialData.order_id || '',
          contract_id: initialData.contract_id || '',
          equipment_id: (initialData as any).equipment_id || ''
        });
        if (initialData.order_id) setOriginType('order');
        else if (initialData.contract_id) setOriginType('contract');
        
        setDisplayInfo({
          client_name: initialData.client?.full_name || '',
          equipment_name: (initialData as any).equipment?.name || (initialData as any).equipment_id ? 'Equipamento Vinculado' : ''
        });
      } else {
        setFormData({
          description: '',
          amount: '',
          due_date: new Date().toISOString().slice(0, 10),
          paid_at: '',
          status: 'pending',
          type: 'income',
          category: 'other',
          client_id: '',
          order_id: '',
          contract_id: '',
          equipment_id: ''
        });
        setOriginType('none');
        setDisplayInfo({ client_name: '', equipment_name: '' });
      }
    }
  }, [isOpen, initialData]);

  // Auto-fill logic
  const handleOriginChange = async (type: 'order' | 'contract' | 'none', id: string) => {
    if (type === 'order') {
      const order = orders.find(o => o.id === id);
      if (order) {
        setFormData(prev => ({ 
          ...prev, 
          order_id: id, 
          contract_id: '', 
          client_id: order.client_id,
          equipment_id: order.equipment_id,
          description: `Faturamento: ${order.name}`,
          category: 'order'
        }));

        setDisplayInfo({
          client_name: (order as any).client?.full_name || 'Cliente identificado',
          equipment_name: (order as any).equipment?.name || 'Equipamento identificado'
        });

        // Try to get total amount from order details
        try {
          const details = await getOrderDetails(id);
          if (details) {
            const servicesTotal = (details.services || []).reduce((acc: number, s: any) => acc + (s.price * s.quantity), 0);
            const partsTotal = (details.parts || []).reduce((acc: number, p: any) => acc + (p.price * p.quantity), 0);
            setFormData(prev => ({ ...prev, amount: (servicesTotal + partsTotal).toString() }));
          }
        } catch (e) { console.error(e); }
      }
    } else if (type === 'contract') {
      const contract = contracts.find(c => c.id === id);
      if (contract) {
        setFormData(prev => ({ 
          ...prev, 
          contract_id: id, 
          order_id: '', 
          client_id: contract.client_id,
          equipment_id: contract.equipment_id,
          description: `Manutenção Mensal: ${contract.name}`,
          amount: contract.monthly_price?.toString() || '',
          category: 'contract'
        }));
        setDisplayInfo({
          client_name: (contract as any).client_name || 'Cliente identificado',
          equipment_name: (contract as any).equipment_name || 'Equipamento identificado'
        });
      }
    } else {
      setFormData(prev => ({ ...prev, order_id: '', contract_id: '' }));
      setDisplayInfo({ client_name: '', equipment_name: '' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save the record
      const recordData = {
        ...initialData,
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        due_date: formData.due_date || null,
        paid_at: formData.paid_at || null,
        client_id: formData.client_id || null,
        order_id: formData.order_id || null,
        contract_id: formData.contract_id || null,
        equipment_id: formData.equipment_id || null
      };

      const record = await saveFinancialRecord(recordData);

      // 2. Upload file if exists
      if (file && record.id) {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${record.id}-${Date.now()}.${fileExt}`;
        const filePath = `financial/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);

        await saveFinancialDocument({
          record_id: record.id,
          file_url: publicUrl,
          file_name: file.name,
          document_type: 'invoice',
          client_id: formData.client_id || null,
          order_id: formData.order_id || null,
          contract_id: formData.contract_id || null,
          equipment_id: formData.equipment_id || null
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro detalhado ao salvar financeiro:', err);
      // Try to extract a useful message
      let msg = 'Erro desconhecido.';
      if (err.message) msg = err.message;
      else if (typeof err === 'string') msg = err;
      else msg = JSON.stringify(err);
      
      alert(`Erro ao salvar lançamento financeiro: ${msg}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-navy-900 border border-slate-800 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in">
        {/* Header */}
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white">{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Financeiro & Notas Fiscais</p>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-left">
          
          {/* 1. Origem e Seleção */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origem do Lançamento</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setOriginType('order')}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${originType === 'order' ? 'bg-primary-600/10 border-primary-600 text-primary-500' : 'bg-navy-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
              >
                <span className="material-symbols-outlined">plumbing</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Pedido (O.S)</span>
              </button>
              <button 
                type="button"
                onClick={() => setOriginType('contract')}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all ${originType === 'contract' ? 'bg-accent/10 border-accent text-accent' : 'bg-navy-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
              >
                <span className="material-symbols-outlined">contract</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Contrato</span>
              </button>
            </div>

            {originType === 'order' && (
              <div className="animate-fade-in space-y-2">
                <label className={labelClass}>Selecionar Pedido de Serviço *</label>
                <select 
                  name="order_id" 
                  value={formData.order_id} 
                  onChange={(e) => handleOriginChange('order', e.target.value)} 
                  className={inputClass}
                  required
                >
                  <option value="">Selecione uma O.S...</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}

            {originType === 'contract' && (
              <div className="animate-fade-in space-y-2">
                <label className={labelClass}>Selecionar Contrato *</label>
                <select 
                  name="contract_id" 
                  value={formData.contract_id} 
                  onChange={(e) => handleOriginChange('contract', e.target.value)} 
                  className={inputClass}
                  required
                >
                  <option value="">Selecione um contrato...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </section>

          {/* 2. Informações Automáticas */}
          {(formData.client_id || formData.equipment_id) && (
            <section className="animate-fade-in space-y-4 pt-4 border-t border-slate-800/50">
               <div className="flex items-center gap-3 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vínculos Automáticos</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-navy-950 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Cliente</label>
                    <p className="text-xs font-bold text-slate-300">{displayInfo.client_name || 'Nenhum'}</p>
                  </div>
                </div>
                <div className="p-4 bg-navy-950 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">precision_manufacturing</span>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Equipamento</label>
                    <p className="text-xs font-bold text-slate-300">{displayInfo.equipment_name || 'Nenhum'}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. Dados Financeiros */}
          <section className="space-y-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados do Lançamento</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className={labelClass}>Descrição do Lançamento *</label>
                <input 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Ex: Nota Fiscal 123 - Manutenção"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Valor (R$) *</label>
                <input 
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`${inputClass} !text-emerald-500 font-black text-lg`}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Status do Pagamento</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago / Recebido</option>
                  <option value="overdue">Atrasado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Data de Vencimento</label>
                <input 
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Data do Pagamento</label>
                <input 
                  name="paid_at"
                  type="date"
                  value={formData.paid_at}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                    className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-navy-950 border-slate-800 text-slate-600'}`}
                  >
                    Receita
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                    className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-navy-950 border-slate-800 text-slate-600'}`}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Categoria</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className={inputClass}>
                  <option value="order">Pedido de Serviço</option>
                  <option value="contract">Contrato Mensal</option>
                  <option value="part">Compra de Peças</option>
                  <option value="other">Outros</option>
                </select>
              </div>
            </div>
          </section>

          {/* 4. Documento */}
          <section className="space-y-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Documento em Anexo</h4>
            </div>

            <div className="p-6 bg-navy-950/50 border border-slate-800 rounded-3xl">
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="hidden"
                  id="invoice-file"
                  accept=".pdf,image/*"
                />
                <label 
                  htmlFor="invoice-file"
                  className="flex flex-col items-center justify-center gap-3 p-8 bg-navy-900 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-primary-600 hover:bg-primary-600/5 transition-all text-slate-500 hover:text-primary-500"
                >
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {file ? file.name : 'Clique p/ anexar Nota Fiscal ou Recibo'}
                    </p>
                    <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest mt-1">PDF ou Imagem até 10MB</p>
                  </div>
                </label>
              </div>
              {uploading && (
                <div className="flex items-center gap-3 mt-4 px-4 py-2 bg-primary-600/10 rounded-xl">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 animate-progress"></div>
                  </div>
                  <span className="text-[9px] font-black text-primary-500 uppercase whitespace-nowrap">Upload...</span>
                </div>
              )}
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-slate-800/50 bg-navy-950/50 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 rounded-2xl border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800">Cancelar</button>
          <button 
            type="submit"
            onClick={handleSubmit} 
            disabled={loading || (originType === 'none' && !initialData)}
            className={`px-10 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${loading || (originType === 'none' && !initialData) ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-primary-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
          >
            {loading ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
