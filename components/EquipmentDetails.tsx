import React, { useState, useEffect } from 'react';
import ChecklistModal from './ChecklistModal';
import ChecklistDetailsModal from './ChecklistDetailsModal';
import ContractFormModal from './ContractFormModal';
import OrderFormModal from './OrderFormModal';
import { getMaintenanceHistory, saveMaintenanceChecklist, getEquipmentContracts, saveContract, getEquipmentById, updateMaintenanceLog, deleteMaintenanceLog, adminDeleteContract } from '@/app/actions/equipments';
import { getOrdersByEquipmentId, adminCreateOrder, adminUpdateOrderStatus } from '@/app/actions/orders';

interface EquipmentDetailsProps {
  equipment: any;
  onBack: () => void;
  onEdit: () => void;
}

export default function EquipmentDetails({ equipment: initialEquipment, onBack, onEdit }: EquipmentDetailsProps) {
  const [localEquipment, setLocalEquipment] = useState(initialEquipment);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedContractForChecklist, setSelectedContractForChecklist] = useState<any>(null);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [isDeleteLogModalOpen, setIsDeleteLogModalOpen] = useState(false);
  const [expandedContracts, setExpandedContracts] = useState<Record<string, boolean>>({});
  const [isDeleteContractModalOpen, setIsDeleteContractModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);

  const labelClass = "text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 block";
  const valueClass = "text-sm text-white font-medium";

  const loadData = async () => {
    try {
      setLoadingHistory(true);
      setLoadingContracts(true);
      setLoadingOrders(true);
      
      const [history, contractsData, updatedEquipment, ordersData] = await Promise.all([
        getMaintenanceHistory(localEquipment.id),
        getEquipmentContracts(localEquipment.id),
        getEquipmentById(localEquipment.id),
        getOrdersByEquipmentId(localEquipment.id)
      ]);
      
      setMaintenanceHistory(history);
      setContracts(contractsData);
      setLocalEquipment(updatedEquipment);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading equipment data:', err);
    } finally {
      setLoadingHistory(false);
      setLoadingContracts(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [localEquipment.id]);

  const handleSaveChecklist = async (checklistData: any, notes: string, structure: any, technicianName?: string, technicianId?: string, technicianDocument?: string) => {
    try {
      setSavingChecklist(true);
      if (editingLog) {
        await updateMaintenanceLog(editingLog.id, checklistData, notes, technicianName, technicianDocument, technicianId);
      } else {
        await saveMaintenanceChecklist(
          localEquipment.id, 
          checklistData, 
          notes, 
          selectedContractForChecklist?.id,
          structure,
          technicianName,
          technicianId,
          technicianDocument
        );
      }
      
      setIsChecklistOpen(false);
      setEditingLog(null);
      loadData(); // Refresh everything
    } catch (err) {
      console.error('Error saving checklist:', err);
      alert('Erro ao salvar checklist. Tente novamente.');
    } finally {
      setSavingChecklist(false);
      setSelectedContractForChecklist(null);
    }
  };

  const handleSaveContract = async (contractData: any, equipmentIds: string[], equipmentIdsToRemoveLogs: string[] = []) => {
    try {
      setSavingContract(true);
      
      // Garantir que o client_id está presente (fallback para o cliente do equipamento atual)
      const dataToSave = {
        ...contractData,
        client_id: contractData.client_id || localEquipment.client_id
      };

      await saveContract(dataToSave, equipmentIds, equipmentIdsToRemoveLogs);
      setIsContractModalOpen(false);
      setSelectedContractForChecklist(null); // Reset any selection
      loadData(); // Refresh list
    } catch (err) {
      console.error('Error saving contract:', err);
      alert('Erro ao salvar contrato.');
    } finally {
      setSavingContract(false);
    }
  };

  const handleCreateOrder = async (formData: any, services: any[], parts: any[]) => {
    try {
      setSavingOrder(true);
      await adminCreateOrder(formData, services, parts);
      setIsOrderModalOpen(false);
      loadData(); // Refresh orders
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Erro ao criar pedido.');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      loadData(); // Refresh list to show new status
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    
    try {
      setSavingChecklist(true);
      await deleteMaintenanceLog(logToDelete.id);
      setIsDeleteLogModalOpen(false);
      setLogToDelete(null);
      loadData(); // Refresh list
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Erro ao excluir manutenção.');
    } finally {
      setSavingChecklist(false);
    }
  };
  
  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    
    try {
      setSavingContract(true);
      await adminDeleteContract(contractToDelete.id);
      setIsDeleteContractModalOpen(false);
      setContractToDelete(null);
      loadData(); // Refresh list
    } catch (err) {
      console.error('Error deleting contract:', err);
      alert('Erro ao excluir contrato.');
    } finally {
      setSavingContract(false);
    }
  };

  const getNextVisitLabel = (date: string) => {
    if (!date) return 'Não agendada';
    return new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getContractHistory = (contractId: string) => {
    return maintenanceHistory.filter(log => log.contract_id === contractId);
  };

  const toggleHistory = (contractId: string) => {
    setExpandedContracts(prev => ({ ...prev, [contractId]: !prev[contractId] }));
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Voltar
        </button>
        <div className="flex gap-3">
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Photo Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-navy-950/40 border border-slate-800/50 rounded-3xl p-8 flex flex-col items-center text-center backdrop-blur-sm">
            <div className="w-full aspect-[4/3] rounded-2xl border-4 border-slate-900 overflow-hidden bg-navy-900 flex items-center justify-center mb-6 shadow-2xl relative">
              {localEquipment.photo_url ? (
                <img src={localEquipment.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-6xl text-slate-800">ac_unit</span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white leading-tight mb-1">{localEquipment.name}</h2>
            <p className="text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-6">{localEquipment.tag}</p>
            
            <div className="flex gap-2 justify-center w-full">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${localEquipment.has_contract ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                {localEquipment.has_contract ? 'Com Contrato' : 'Sem Contrato'}
              </span>
            </div>
          </div>

          <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-6">
            <h4 className={labelClass}>Proprietário / Cliente</h4>
            <div className="flex items-center gap-3 p-3 bg-navy-900/50 rounded-xl border border-slate-800">
                <div className="h-10 w-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600">
                    <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-sm font-bold text-white whitespace-normal">{localEquipment.client_name}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Details Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-8 bg-primary-600 rounded-full"></div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Especificações Técnicas</h3>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${localEquipment.has_contract ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                {localEquipment.has_contract ? 'Com Contrato' : 'Sem Contrato'}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-600/10 text-primary-600 border border-primary-600/20 text-[10px] font-black uppercase tracking-widest">
                Ativo
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
              <div>
                <span className={labelClass}>Cliente</span>
                <span className={valueClass}>{localEquipment.client_name}</span>
              </div>
              <div>
                <span className={labelClass}>Local / Setor</span>
                <span className={`${valueClass} whitespace-normal`}>{localEquipment.environment || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Marca / Fabricante</span>
                <span className={valueClass}>{localEquipment.brand || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Modelo</span>
                <span className={valueClass}>{localEquipment.model || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Capacidade</span>
                <span className={valueClass}>{localEquipment.capacity || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Tensão</span>
                <span className={valueClass}>{localEquipment.voltage || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Fluído Refrigerante</span>
                <span className={valueClass}>{localEquipment.refrigerant_fluid || 'Não informado'}</span>
              </div>
              <div>
                <span className={labelClass}>Data de Cadastro</span>
                <span className={valueClass}>{localEquipment.created_at ? new Date(localEquipment.created_at).toLocaleDateString('pt-BR') : '---'}</span>
              </div>
            </div>
          </div>

          {contracts.length > 0 && (
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8 animate-fade-in relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Contratos Ativos</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedContractForChecklist({
                      client_id: localEquipment.client_id,
                      equipment_list: [localEquipment]
                    });
                    setIsContractModalOpen(true);
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
                  title="Novo Contrato"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>

              <div className="space-y-6">
                {contracts.map((contract) => {
                  const history = getContractHistory(contract.id);
                  const isExpanded = expandedContracts[contract.id];

                  return (
                    <div key={contract.id} className="bg-navy-950/40 border border-slate-800/50 rounded-3xl overflow-hidden transition-all duration-300">
                      <div className="p-6 relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div 
                              className="cursor-pointer group/name"
                              onClick={() => {
                                setSelectedContractForChecklist(contract);
                                setIsContractModalOpen(true);
                              }}
                            >
                              <span className={labelClass}>Nome do Contrato</span>
                              <div className="flex items-center gap-2">
                                <span className={`${valueClass} group-hover/name:text-primary-500 transition-colors`}>{contract.name}</span>
                                <span className="material-symbols-outlined text-[14px] text-slate-600 opacity-0 group-hover/name:opacity-100 transition-all">edit</span>
                              </div>
                            </div>
                            <div>
                              <span className={labelClass}>Periodicidade</span>
                              <span className={valueClass}>
                                {contract.periodicity === 'monthly' ? 'Mensal' :
                                 contract.periodicity === 'bimonthly' ? 'Bimestral' :
                                 contract.periodicity === 'quarterly' ? 'Trimestral' :
                                 contract.periodicity === 'semiannual' ? 'Semestral' :
                                 contract.periodicity === 'annual' ? 'Anual' : 
                                 contract.periodicity}
                              </span>
                            </div>
                            <div>
                              <span className={labelClass}>Próxima Visita</span>
                              <span className={`${valueClass} capitalize`}>{getNextVisitLabel(contract.next_maintenance_date)}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSelectedContractForChecklist(contract);
                                setIsChecklistOpen(true);
                              }}
                              className="px-6 py-2.5 rounded-xl bg-emerald-600/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">fact_check</span>
                              Checklist
                            </button>
                            <button 
                              onClick={() => {
                                setContractToDelete(contract);
                                setIsDeleteContractModalOpen(true);
                              }}
                              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-800 bg-navy-900 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                              title="Excluir Contrato"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                            <button 
                              onClick={() => toggleHistory(contract.id)}
                              className={`h-10 w-10 flex items-center justify-center rounded-xl border border-slate-800 transition-all ${isExpanded ? 'bg-primary-600 border-primary-600 text-white' : 'bg-navy-900 text-slate-500 hover:text-white hover:border-slate-700'}`}
                              title="Histórico do Contrato"
                            >
                              <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>history</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Contract History Mini-Timeline */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 bg-navy-950/30 animate-scale-in">
                          <div className="space-y-3">
                            {history.length > 0 ? (
                              history.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-900/50 border border-slate-800/50 group/log hover:border-primary-600/30 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <div>
                                      <p className="text-xs font-bold text-white">Manutenção Preventiva</p>
                                      <p className="text-[10px] text-slate-500 italic">Realizada em {new Date(log.performed_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setSelectedLog(log);
                                        setIsDetailsOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-primary-600 transition-all"
                                    >
                                      Relatório
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setEditingLog(log);
                                        setIsChecklistOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-navy-800 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-emerald-600 transition-all"
                                    >
                                      Editar
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setLogToDelete(log);
                                        setIsDeleteLogModalOpen(true);
                                      }}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-navy-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                      title="Excluir Manutenção"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 opacity-40">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Nenhum histórico para este contrato</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manutenções Avulsas / Pedidos */}
          <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8 animate-fade-in relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-1 w-8 bg-primary-600 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Manutenções Avulsas / Pedidos</h3>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-lg active:scale-95"
                title="Novo Pedido Avulso"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-12 flex justify-center">
                <div className="h-8 w-8 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-5 rounded-2xl bg-navy-900/50 border border-slate-800 flex items-center justify-between group hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        order.status === 'approved' ? 'bg-primary-500/10 text-primary-500' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        <span className="material-symbols-outlined">{
                          order.status === 'completed' ? 'verified' :
                          order.status === 'approved' ? 'check_circle' :
                          order.status === 'cancelled' ? 'cancel' :
                          'schedule'
                        }</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{order.name}</h4>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-navy-950/50 border border-slate-800 outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer transition-all ${
                              order.status === 'completed' ? 'text-emerald-500' :
                              order.status === 'approved' ? 'text-primary-500' :
                              order.status === 'cancelled' ? 'text-red-500' :
                              'text-amber-500'
                            }`}
                          >
                            <option value="pending" className="bg-navy-900 text-amber-500 italic font-bold">⏳ Pendente</option>
                            <option value="approved" className="bg-navy-900 text-primary-500 italic font-bold">✅ Aprovado</option>
                            <option value="completed" className="bg-navy-900 text-emerald-500 italic font-bold">🏁 Concluído</option>
                            <option value="cancelled" className="bg-navy-900 text-red-500 italic font-bold">❌ Cancelado</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Gerado em {new Date(order.created_at).toLocaleDateString('pt-BR')} 
                        </p>
                      </div>
                    </div>
                    <div>
                        <button 
                            onClick={() => window.location.href = `/admin/orders/${order.id}`}
                            className="px-4 py-2 rounded-lg bg-navy-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all"
                        >
                            Ver Pedido
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-navy-950/20">
                <span className="material-symbols-outlined text-4xl text-slate-800 mb-2">receipt_long</span>
                <p className="text-slate-600 text-sm">Nenhum pedido avulso registrado para este equipamento.</p>
              </div>
            )}
          </div>


        </div>
      </div>

      <ChecklistModal 
        isOpen={isChecklistOpen}
        onClose={() => {
          setIsChecklistOpen(false);
          setEditingLog(null);
        }}
        onSubmit={handleSaveChecklist}
        loading={savingChecklist}
        initialItems={selectedContractForChecklist?.checklist_template}
        initialData={editingLog}
      />

      <ChecklistDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
        equipment={localEquipment}
      />

      <ContractFormModal 
        isOpen={isContractModalOpen}
        onClose={() => {
          setIsContractModalOpen(false);
          setSelectedContractForChecklist(null);
        }}
        onSubmit={handleSaveContract}
        loading={savingContract}
        initialData={selectedContractForChecklist}
      />

      {/* Delete Log Confirmation Modal */}
      {isDeleteLogModalOpen && logToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-600">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Manutenção?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir o registro de manutenção de <span className="text-white font-bold">{new Date(logToDelete.performed_at).toLocaleDateString('pt-BR')}</span>. 
              Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsDeleteLogModalOpen(false);
                  setLogToDelete(null);
                }} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteLog}
                disabled={savingChecklist}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {savingChecklist ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contract Confirmation Modal */}
      {isDeleteContractModalOpen && contractToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-600">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Contrato?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir o contrato <span className="text-white font-bold">{contractToDelete.name}</span>. 
              Isso removerá também todas as faturas <span className="text-red-500 font-bold uppercase">pendentes</span> associadas a ele.
              Lançamentos já pagos serão preservados.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsDeleteContractModalOpen(false);
                  setContractToDelete(null);
                }} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteContract}
                disabled={savingContract}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {savingContract ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderFormModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
        loading={savingOrder}
        initialData={{
            client_id: localEquipment.client_id,
            equipment_id: localEquipment.id
        }}
      />
    </div>
  );
}
