'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EquipmentForm from './EquipmentForm';
import EquipmentDetails from './EquipmentDetails';
import { adminCreateEquipment, adminUpdateEquipment, adminDeleteEquipment, getEquipments, saveEquipmentContracts } from '@/app/actions/equipments';

interface EquipmentsViewProps {
  externalSearch?: string;
}

export default function EquipmentsView({ externalSearch = '' }: EquipmentsViewProps) {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const data = await getEquipments();
      setEquipments(data || []);
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = async (formData: any) => {
    setSaving(true);
    try {
      if (isEditing && equipmentToEdit) {
        await adminUpdateEquipment(equipmentToEdit.id, formData);
        if (formData.contracts) {
          await saveEquipmentContracts(equipmentToEdit.id, formData.contracts);
        }
        showToast('Equipamento atualizado com sucesso!', 'success');
      } else {
        const result = await adminCreateEquipment(formData);
        if (result.success) {
          if (formData.contracts) {
            await saveEquipmentContracts(result.equipment.id, formData.contracts);
          }
          showToast(`Equipamento cadastrado com sucesso! Tag: ${result.equipment.tag}`, 'success');
        }
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setEquipmentToEdit(null);
      fetchEquipments();
    } catch (err: any) {
      showToast('Erro ao salvar equipamento: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    setSaving(true);
    try {
      await adminDeleteEquipment(equipmentToDelete.id);
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
      fetchEquipments();
      showToast('Equipamento excluído com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao excluir equipamento: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredEquipments = equipments.filter(e => 
    e.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    e.tag?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    e.brand?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    e.model?.toLowerCase().includes(externalSearch.toLowerCase())
  );

  if (isDetailsOpen && selectedEquipment) {
    return (
      <EquipmentDetails 
        equipment={selectedEquipment}
        onBack={() => setIsDetailsOpen(false)}
        onEdit={() => {
          setEquipmentToEdit(selectedEquipment);
          setIsEditing(true);
          setIsModalOpen(true);
          setIsDetailsOpen(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="animate-fade-in group/view">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">Equipamentos</h1>
            <p className="text-slate-500 text-sm">Gerencie o parque de máquinas de seus clientes.</p>
          </div>
          <button 
            onClick={() => { setIsEditing(false); setEquipmentToEdit(null); setIsModalOpen(true); }}
            className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
            <span className="font-bold text-sm">Novo Equipamento</span>
          </button>
        </div>

        {/* Table/Grid */}
        <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
        <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950/50 border-b border-slate-800">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Equipamento</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cliente / Local</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Especificações</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-slate-800">ac_unit</span>
                        <p className="text-slate-500 text-sm font-medium">Nenhum equipamento {externalSearch ? 'correspondente' : 'cadastrado'}.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((equip) => (
                    <tr key={equip.id} className="hover:bg-white/[0.015] transition-colors group/row text-white">
                      <td className="px-6 py-5">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/name"
                          onClick={() => { setSelectedEquipment(equip); setIsDetailsOpen(true); }}
                        >
                          <div className="h-12 w-12 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-center text-primary-600 shrink-0 overflow-hidden shadow-inner font-bold text-[10px]">
                            {equip.photo_url ? (
                              <img src={equip.photo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined">ac_unit</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white group-hover/name:text-primary-600 transition-colors truncate">{equip.name}</span>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{equip.tag}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-300 truncate">{equip.client_name}</span>
                          <span className="text-[11px] text-slate-500 truncate italic">{equip.environment || 'Local não informado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col min-w-[70px]">
                                <span className="text-[9px] text-slate-600 font-bold uppercase truncate">Marca / Modelo</span>
                                <span className="text-[11px] text-slate-400 truncate">{equip.brand || '---'} {equip.model ? `/ ${equip.model}` : ''}</span>
                            </div>
                            <div className="flex flex-col min-w-[70px]">
                                <span className="text-[9px] text-slate-600 font-bold uppercase truncate">Capacidade</span>
                                <span className="text-[11px] text-slate-400 truncate">{equip.capacity || '---'}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${equip.has_contract ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                                {equip.has_contract ? 'Contrato' : 'Avulso'}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEquipmentToEdit(equip); setIsEditing(true); setIsModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-600/30 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => { setEquipmentToDelete(equip); setIsDeleteModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden flex flex-col divide-y divide-slate-800/50">
            {loading ? (
              <div className="px-6 py-24 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                </div>
              </div>
            ) : filteredEquipments.length === 0 ? (
              <div className="px-6 py-24 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-slate-800">ac_unit</span>
                  <p className="text-slate-500 text-sm font-medium">Nenhum equipamento correspondente.</p>
                </div>
              </div>
            ) : (
              filteredEquipments.map((equip) => (
                <div key={equip.id} className="p-5 flex flex-col gap-4 active:bg-white/[0.02]">
                  <div 
                    className="flex items-center gap-4 cursor-pointer" 
                    onClick={() => { setSelectedEquipment(equip); setIsDetailsOpen(true); }}
                  >
                    <div className="h-16 w-16 rounded-2xl bg-navy-950 border border-slate-800 flex items-center justify-center text-primary-600 shrink-0 overflow-hidden shadow-inner font-bold text-[10px]">
                      {equip.photo_url ? (
                        <img src={equip.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl">ac_unit</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-base font-bold text-white truncate">{equip.name}</span>
                      <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">{equip.tag}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${equip.has_contract ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-slate-500/5 text-slate-500 border-slate-500/10'}`}>
                          {equip.has_contract ? 'Contrato' : 'Avulso'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-navy-950/40 rounded-xl p-4 border border-slate-800/50 space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cliente / Local</span>
                      <span className="text-sm font-bold text-slate-200">{equip.client_name}</span>
                      <span className="text-xs text-slate-500 italic">{equip.environment || 'Local não informado'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Modelo</span>
                        <span className="text-xs text-slate-300 truncate">{equip.brand || '---'} {equip.model ? `/ ${equip.model}` : ''}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">Capacidade</span>
                        <span className="text-xs text-slate-300 text-right">{equip.capacity || '---'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSelectedEquipment(equip); setIsDetailsOpen(true); }}
                      className="flex-1 py-2.5 bg-navy-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 active:bg-slate-800 transition-colors"
                    >
                      Detalhes Técnicos
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEquipmentToEdit(equip); setIsEditing(true); setIsModalOpen(true); }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-primary-600"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => { setEquipmentToDelete(equip); setIsDeleteModalOpen(true); }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-red-500"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">{isEditing ? 'edit_square' : 'ac_unit'}</span>
                {isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <EquipmentForm 
                initialData={equipmentToEdit}
                onSubmit={handleSaveEquipment}
                onCancel={() => setIsModalOpen(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {isDeleteModalOpen && equipmentToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Equipamento?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir o equipamento <span className="text-white font-bold">{equipmentToDelete.name} ({equipmentToDelete.tag})</span>. 
              Esta ação removerá permanentemente os dados do equipamento.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteEquipment}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast - Posicionado no canto inferior direito */}
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

