'use client';

import React, { useState, useEffect } from 'react';
import { getContracts, saveContract, adminDeleteContract } from '@/app/actions/equipments';
import ContractFormModal from './ContractFormModal';
import ContractDetailsModal from './ContractDetailsModal';

interface ContractsViewProps {
  externalSearch?: string;
}

export default function ContractsView({ externalSearch = '' }: ContractsViewProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await getContracts();
      setContracts(data || []);
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
      showToast('Erro ao buscar contratos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (contractData: any, equipmentIds: string[], equipmentIdsToRemoveLogs: string[] = []) => {
    setSaving(true);
    try {
      const result = await saveContract(contractData, equipmentIds, equipmentIdsToRemoveLogs);
      if (result.success) {
        showToast(isEditing ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!', 'success');
        setIsModalOpen(false);
        setIsEditing(false);
        setContractToEdit(null);
        fetchContracts();
      }
    } catch (err: any) {
      showToast('Erro ao salvar contrato: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    setSaving(true);
    try {
      await adminDeleteContract(contractToDelete.id);
      setIsDeleteModalOpen(false);
      setContractToDelete(null);
      fetchContracts();
      showToast('Contrato excluído com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao excluir contrato: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    c.type?.toLowerCase().includes(externalSearch.toLowerCase())
  );

  return (
    <>
      <div className="animate-fade-in group/view">        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">Gestão de Contratos</h1>
            <p className="text-slate-500 text-sm">Contratos por cliente e máquinas.</p>
          </div>
          <button 
            onClick={() => { setIsEditing(false); setContractToEdit(null); setIsModalOpen(true); }}
            className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
            <span className="font-bold text-sm">Novo Contrato</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="h-12 w-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Carregando Contratos...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center text-center px-4 bg-navy-900/50 border border-dashed border-slate-800 rounded-[40px]">
            <div className="h-20 w-20 rounded-full bg-slate-800/20 flex items-center justify-center text-slate-700 mb-6">
              <span className="material-symbols-outlined text-4xl">description</span>
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-slate-600 text-sm max-w-xs leading-relaxed">Não há contratos que correspondam à sua busca.</p>
          </div>
        ) : (
          <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy-950/50 border-b border-slate-800">
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contrato / Tipo</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Máquinas</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Valor Mensal</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-white/[0.015] transition-colors group/row text-white">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <button 
                            onClick={() => { setSelectedContractId(contract.id); setIsDetailsModalOpen(true); }}
                            className="text-left text-sm font-bold text-white hover:text-primary-400 transition-colors cursor-pointer group-hover/row:text-primary-600 outline-none"
                          >
                            {contract.name}
                          </button>
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{contract.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-300">{contract.client_name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="flex -space-x-2">
                              {contract.equipment_list?.slice(0, 3).map((eq: any) => (
                                <div key={eq.id} className="h-7 w-7 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-center text-[9px] font-black text-primary-600 shadow-lg ring-2 ring-navy-900" title={eq.name}>
                                   {eq.name.substring(0, 1).toUpperCase()}
                                </div>
                              ))}
                              {contract.equipment_count > 3 && (
                                <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black text-white shadow-lg ring-2 ring-navy-900">
                                   +{contract.equipment_count - 3}
                                </div>
                              )}
                           </div>
                           <span className="text-[11px] text-slate-500 font-medium">
                              {contract.equipment_count} {contract.equipment_count === 1 ? 'máquina' : 'máquinas'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.monthly_price)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setContractToEdit(contract); setIsEditing(true); setIsModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-600/30 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => { setContractToDelete(contract); setIsDeleteModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col divide-y divide-slate-800/50">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <button 
                        onClick={() => { setSelectedContractId(contract.id); setIsDetailsModalOpen(true); }}
                        className="text-left text-base font-bold text-white truncate hover:text-primary-400 transition-colors outline-none"
                      >
                        {contract.name}
                      </button>
                      <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{contract.type}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-500 shrink-0">
                       R$ {contract.monthly_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-navy-950/40 rounded-xl p-4 border border-slate-800/50 flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cliente</span>
                       <span className="text-sm font-bold text-slate-200">{contract.client_name}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                       <span className="text-[11px] text-slate-500 font-medium">{contract.equipment_count} equipamentos</span>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => { setContractToEdit(contract); setIsEditing(true); setIsModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => { setContractToDelete(contract); setIsDeleteModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição de Contrato */}
      <ContractFormModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setContractToEdit(null); }}
        onSubmit={handleSaveContract}
        initialData={contractToEdit}
        loading={saving}
      />

      <ContractDetailsModal 
        isOpen={isDetailsModalOpen}
        contractId={selectedContractId}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedContractId(null); }}
      />

      {/* Modal Excluir Contrato */}
      {isDeleteModalOpen && contractToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Contrato?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir o contrato <span className="text-white font-bold">{contractToDelete.name}</span>. 
              Esta ação removerá o vínculo com todos os equipamentos associados e interromperá as cobranças futuras. Registros pagos serão preservados.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteContract}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in transition-all max-w-lg ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' :
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-400' :
          'bg-primary-950/90 border-primary-500/30 text-primary-400'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
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
