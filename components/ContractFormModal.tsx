import React, { useState, useEffect } from 'react';
import { getClients, getEquipmentsByClient } from '@/app/actions/equipments';
import ConfirmModal from './ConfirmModal';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contract: any, equipmentIds: string[], equipmentIdsToRemoveLogs?: string[]) => Promise<void>;
  loading?: boolean;
  initialData?: any;
}

export default function ContractFormModal({ isOpen, onClose, onSubmit, loading, initialData }: ContractFormModalProps) {
  const [contract, setContract] = useState<any>({
    name: '',
    type: 'Manutenção Preventiva',
    periodicity: 'monthly',
    monthly_price: '',
    start_date: new Date().toISOString().slice(0, 10),
    duration_months: '12',
    client_id: ''
  });

  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [initialEquipmentIds, setInitialEquipmentIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [showRemovalConfirm, setShowRemovalConfirm] = useState(false);
  
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const data = await getClients();
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadEquipments = async (clientId: string) => {
    if (!clientId) {
      setEquipments([]);
      return;
    }
    setLoadingEquipments(true);
    try {
      const data = await getEquipmentsByClient(clientId);
      setEquipments(data || []);
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err);
    } finally {
      setLoadingEquipments(false);
    }
  };

  useEffect(() => {
    if (initialData && isOpen) {
      setContract({
        id: initialData.id,
        name: initialData.name || '',
        type: initialData.type || 'Manutenção Preventiva',
        periodicity: initialData.periodicity || 'monthly',
        monthly_price: initialData.monthly_price?.toString() || '',
        start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        duration_months: initialData.duration_months?.toString() || '12',
        client_id: initialData.client_id || ''
      });
      
      if (initialData.client_id) {
        loadEquipments(initialData.client_id);
      }
      
      // Se tiver lista de equipamentos no initialData (vinda do getContracts)
      let ids: string[] = [];
      if (initialData.equipment_list) {
        ids = initialData.equipment_list.map((e: any) => e.id);
      } else if (initialData.equipment_id) {
        // Caso antigo/fallback
        ids = [initialData.equipment_id];
      }
      setSelectedEquipmentIds(ids);
      setInitialEquipmentIds(ids);
    } else if (isOpen) {
      setContract({
        name: '',
        type: 'Manutenção Preventiva',
        periodicity: 'monthly',
        monthly_price: '',
        start_date: new Date().toISOString().slice(0, 10),
        duration_months: '12',
        client_id: ''
      });
      setEquipments([]);
      setSelectedEquipmentIds([]);
      setInitialEquipmentIds([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract.client_id) return alert('Selecione um cliente');
    if (selectedEquipmentIds.length === 0) return alert('Selecione ao menos um equipamento');
    
    // Verificar se houve remoção de equipamentos
    const currentRemoved = initialEquipmentIds.filter(id => !selectedEquipmentIds.includes(id));
    
    if (currentRemoved.length > 0) {
      setRemovedIds(currentRemoved);
      setShowRemovalConfirm(true);
      return;
    }

    onSubmit(contract, selectedEquipmentIds, []);
  };

  const handleConfirmRemoval = (deleteLogs: boolean) => {
    setShowRemovalConfirm(false);
    onSubmit(contract, selectedEquipmentIds, deleteLogs ? removedIds : []);
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 transition-all placeholder:text-slate-600 shadow-inner group-hover/field:border-slate-700 disabled:opacity-50";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 text-left";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${initialData?.id ? 'bg-amber-500/10 text-amber-500' : 'bg-primary-600/10 text-primary-600'}`}>
              <span className="material-symbols-outlined">{initialData?.id ? 'edit_note' : 'add_task'}</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {initialData?.id ? 'Editar Contrato' : 'Novo Contrato'}
            </h3>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Esquerda: Dados do Contrato */}
            <div className="space-y-6">
              <div className="group/field">
                <label className={labelClass}>Nome do Contrato</label>
                <input 
                  value={contract.name} 
                  onChange={(e) => setContract({...contract, name: e.target.value})}
                  className={inputClass} 
                  placeholder="Ex: Contrato Mensal de Limpeza"
                  required 
                />
              </div>

              <div className="group/field">
                <label className={labelClass}>Cliente</label>
                <select
                  disabled={!!initialData || loadingClients}
                  className={inputClass}
                  value={contract.client_id}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setContract({...contract, client_id: cid});
                    loadEquipments(cid);
                  }}
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="group/field">
                <label className={labelClass}>Tipo de Serviço</label>
                <input 
                  value={contract.type} 
                  onChange={(e) => setContract({...contract, type: e.target.value})}
                  className={inputClass} 
                  placeholder="Ex: Preventiva" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group/field">
                  <label className={labelClass}>Periodicidade</label>
                  <select
                    className={inputClass}
                    value={contract.periodicity}
                    onChange={(e) => setContract({...contract, periodicity: e.target.value})}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="bimonthly">Bimestral</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div className="group/field">
                  <label className={labelClass}>Duração (Meses)</label>
                  <input 
                    type="number"
                    value={contract.duration_months} 
                    onChange={(e) => setContract({...contract, duration_months: e.target.value})}
                    className={inputClass} 
                    placeholder="12"
                    required
                  />
                </div>
              </div>

              <div className="group/field">
                <label className={labelClass}>Data de Início</label>
                <input 
                  type="date"
                  value={contract.start_date} 
                  onChange={(e) => setContract({...contract, start_date: e.target.value})}
                  className={inputClass} 
                  required
                />
              </div>
              
              <div className="group/field">
                <label className={labelClass}>Valor Mensal Total (R$)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={contract.monthly_price} 
                    onChange={(e) => setContract({...contract, monthly_price: e.target.value})}
                    className={`${inputClass} !pl-11 font-bold text-emerald-500`}
                    placeholder="0,00" 
                    required
                  />
                </div>
                <p className="text-[9px] text-slate-600 mt-2 ml-1 italic">* Cobrança única para todos os equipamentos vinculados</p>
              </div>
            </div>

            {/* Direita: Seleção de Equipamentos */}
            <div className="flex flex-col h-full min-h-[300px] md:min-h-[400px]">
              <label className={labelClass}>Equipamentos Vinculados ({selectedEquipmentIds.length})</label>
              <div className="flex-1 bg-navy-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-navy-900/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lista de Máquinas</span>
                  {equipments.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedEquipmentIds.length === equipments.length) setSelectedEquipmentIds([]);
                        else setSelectedEquipmentIds(equipments.map(e => e.id));
                      }}
                      className="text-[9px] font-black text-primary-500 uppercase hover:text-primary-400 transition-colors"
                    >
                      {selectedEquipmentIds.length === equipments.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                  {loadingEquipments ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="h-6 w-6 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : !contract.client_id ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-2">
                      <span className="material-symbols-outlined text-slate-800 text-3xl">person</span>
                      <p className="text-[11px] text-slate-600 font-medium">Selecione um cliente para carregar equipamentos</p>
                    </div>
                  ) : equipments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-2">
                       <span className="material-symbols-outlined text-slate-800 text-3xl">ac_unit</span>
                       <p className="text-[11px] text-slate-600 font-medium">Este cliente não possui equipamentos cadastrados</p>
                    </div>
                  ) : (
                    equipments.map(equip => {
                      const isSelected = selectedEquipmentIds.includes(equip.id);
                      return (
                        <div 
                          key={equip.id}
                          onClick={() => toggleEquipment(equip.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                            isSelected 
                            ? 'bg-primary-600/10 border-primary-600/30 text-white' 
                            : 'bg-navy-900/30 border-transparent text-slate-500 hover:bg-navy-900/50'
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-800'
                          }`}>
                            {isSelected && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">{equip.name}</span>
                            <span className="text-[9px] font-black uppercase opacity-60">{equip.tag}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex items-center gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-4 rounded-2xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/[0.02] transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || loadingEquipments}
              className="flex-1 px-8 py-4 rounded-2xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  Finalizar Contrato
                </>
              )}
            </button>
          </div>
        </form>

        <ConfirmModal 
          isOpen={showRemovalConfirm}
          onClose={() => setShowRemovalConfirm(false)}
          onConfirm={() => handleConfirmRemoval(true)}
          title="Remover Registros?"
          message={`Você removeu ${removedIds.length} equipamento(s) deste contrato. Deseja apagar permanentemente os registros de checklist realizados para esses equipamentos neste contrato?`}
          confirmLabel="Sim, Apagar Logs"
          cancelLabel="Não, Manter Logs"
          type="warning"
        />
      </div>
    </div>
  );
}
