'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ClientForm from './ClientForm';
import { adminCreateClient, adminUpdateClient, adminDeleteClient, getCurrentOrgId } from '@/app/actions/clients';
import EquipmentForm from './EquipmentForm';
import EquipmentDetails from './EquipmentDetails';
import { 
  getEquipmentsByClient, 
  adminCreateEquipment, 
  adminUpdateEquipment, 
  adminDeleteEquipment 
} from '@/app/actions/equipments';

interface ClientsViewProps {
  onBack?: () => void;
  externalSearch?: string;
  externalSearchResults?: any[];
}

const OfficialWhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.001 12.045a11.811 11.811 0 001.592 5.96L0 24l6.117-1.605a11.803 11.803 0 005.925 1.583h.005c6.637 0 12.046-5.411 12.05-12.048a11.82 11.82 0 00-3.476-8.532z" />
  </svg>
);

export default function ClientsView({ onBack, externalSearch = '', externalSearchResults }: ClientsViewProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      const orgId = await getCurrentOrgId();
      if (!orgId) throw new Error('Organização não encontrada');
      const inviteUrl = `${window.location.origin}/invite/${orgId}`;
      
      const shareData = {
        title: 'Convite Especial',
        text: 'Você foi convidado! Clique no link abaixo para finalizar seu cadastro na plataforma:',
        url: inviteUrl
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          showToast('Link de convite compartilhado!', 'info');
        } else {
          await navigator.clipboard.writeText(inviteUrl);
          showToast('Link de convite copiado para a área de transferência!', 'info');
        }
      } catch (shareErr: any) {
        // If user cancelled the native share UI, we don't treat it as a hard error.
        if (shareErr.name !== 'AbortError') {
          await navigator.clipboard.writeText(inviteUrl);
          showToast('Link de convite copiado para o seu teclado!', 'info');
        }
      }
      
    } catch (err: any) {
      showToast('Erro ao gerar link de convite: ' + err.message, 'error');
    }
  };

  const handleSaveClient = async (formData: any) => {
    setSaving(true);
    try {
      if (isEditing && clientToEdit) {
        await adminUpdateClient(clientToEdit.id, formData);
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        const result = await adminCreateClient(formData);
        if (result.success) {
          showToast(`Cliente cadastrado! Senha temporária: ${result.tempPassword}`, 'info');
        }
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setClientToEdit(null);
      fetchClients();
    } catch (err: any) {
      showToast('Erro ao salvar cliente: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setSaving(true);
    try {
      await adminDeleteClient(clientToDelete.id);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      fetchClients();
      showToast('Cliente excluído com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao excluir cliente: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(externalSearch.toLowerCase()) ||
    c.whatsapp?.includes(externalSearch)
  );

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  const getMapsLink = (client: any) => {
    const address = `${client.street}, ${client.number}, ${client.neighborhood}, ${client.city} - ${client.state}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  if (isDetailsOpen && selectedClient) {
    return (
      <ClientDetails 
        client={selectedClient} 
        onBack={() => setIsDetailsOpen(false)} 
        onUpdate={() => {
          fetchClients();
          // We also need to update the locally selected client to show new data
          const updated = clients.find(c => c.id === selectedClient.id);
          if (updated) setSelectedClient(updated);
        }}
        onEdit={(addContact) => {
          let data = { ...selectedClient };
          if (addContact) {
            const newContact = { name: '', role: '', department: '', number: '' };
            data.contacts = [...(data.contacts || []), newContact];
          }
          setClientToEdit(data);
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
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">Clientes</h1>
            <p className="text-slate-500 text-sm">Gerencie sua base de clientes e leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleInvite}
              className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined !text-[20px]">link</span>
              <span className="font-bold text-sm">Convidar Cliente</span>
            </button>
            <button 
              onClick={() => { setIsEditing(false); setClientToEdit(null); setIsModalOpen(true); }}
              className="group/btn px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined !text-[20px] group-hover/btn:rotate-90 transition-transform">add</span>
              <span className="font-bold text-sm">Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
        <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950/50 border-b border-slate-800">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contato</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Endereço</th>
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
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-slate-800">group_off</span>
                        <p className="text-slate-500 text-sm font-medium">Nenhum cliente {externalSearch ? 'correspondente' : 'cadastrado'}.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-white/[0.015] transition-colors group/row">
                      <td className="px-6 py-5">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/name" 
                          onClick={() => { setSelectedClient(client); setIsDetailsOpen(true); }}
                        >
                          <div className="h-11 w-11 rounded-full bg-navy-950 border border-slate-800 flex items-center justify-center text-primary-600 shrink-0 overflow-hidden shadow-inner">
                            {client.avatar_url ? (
                              <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined">person</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white group-hover/name:text-primary-600 transition-colors truncate">{client.full_name || 'Sem nome'}</span>
                            <span className="text-[11px] text-slate-500 truncate lowercase">{client.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-300 font-mono">{client.whatsapp || '---'}</span>
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">{client.source || 'Lead'}</span>
                          </div>
                          {client.whatsapp && (
                            <a 
                              href={getWhatsAppLink(client.whatsapp)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                            >
                              <OfficialWhatsAppIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col max-w-[180px]">
                            <span className="text-xs text-slate-300 truncate">{client.street ? `${client.street}, ${client.number}` : '---'}</span>
                            <span className="text-[10px] text-slate-600 uppercase font-bold truncate">{client.city || '---'}</span>
                          </div>
                          {client.street && (
                            <a 
                              href={getMapsLink(client)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-7 w-7 rounded-lg bg-red-500/5 text-red-500/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">location_on</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setClientToEdit(client); setIsEditing(true); setIsModalOpen(true); }}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-600/30 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => { setClientToDelete(client); setIsDeleteModalOpen(true); }}
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
            ) : filteredClients.length === 0 ? (
              <div className="px-6 py-24 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-slate-800">group_off</span>
                  <p className="text-slate-500 text-sm font-medium">Nenhum cliente correspondente.</p>
                </div>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id} className="p-5 flex flex-col gap-4 active:bg-white/[0.02]">
                  <div 
                    className="flex items-center gap-4 cursor-pointer" 
                    onClick={() => { setSelectedClient(client); setIsDetailsOpen(true); }}
                  >
                    <div className="h-14 w-14 rounded-full bg-navy-950 border border-slate-800 flex items-center justify-center text-primary-600 shrink-0 overflow-hidden shadow-inner">
                      {client.avatar_url ? (
                        <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl">person</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-base font-bold text-white truncate">{client.full_name || 'Sem nome'}</span>
                      <span className="text-xs text-slate-500 truncate lowercase">{client.email}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-primary-600/5 text-primary-600 rounded text-[9px] font-black uppercase tracking-widest border border-primary-600/10">
                          {client.source || 'Lead'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Contato</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-mono">{client.whatsapp || '---'}</span>
                        {client.whatsapp && (
                          <a href={getWhatsAppLink(client.whatsapp)} target="_blank" className="text-emerald-500">
                            <OfficialWhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="bg-navy-950/40 rounded-xl p-3 border border-slate-800/50 flex flex-col gap-1 text-left">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-left">Localização</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-300 truncate text-left">{client.city || '---'}</span>
                        {client.street && (
                          <a href={getMapsLink(client)} target="_blank" className="text-red-500/50">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSelectedClient(client); setIsDetailsOpen(true); }}
                      className="flex-1 py-2.5 bg-navy-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 active:bg-slate-800 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setClientToEdit(client); setIsEditing(true); setIsModalOpen(true); }}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 active:text-primary-600"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => { setClientToDelete(client); setIsDeleteModalOpen(true); }}
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

      {/* FIXED POSITION ELEMENTS - Moved outside animated div for true viewport centering */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">{isEditing ? 'edit_square' : 'person_add'}</span>
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <ClientForm 
                initialData={clientToEdit}
                onSubmit={handleSaveClient}
                onCancel={() => setIsModalOpen(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Cliente?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir <span className="text-white font-bold">{clientToDelete.full_name}</span>. 
              Esta ação é irreversível e removerá todos os dados do cliente.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteClient}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts - Posicionados no canto inferior direito */}
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

function ClientDetails({ client, onBack, onEdit, onUpdate }: { client: any, onBack: () => void, onEdit: (addContact?: boolean) => void, onUpdate: () => void }) {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', department: '', number: '' });
  const [contactToDeleteIndex, setContactToDeleteIndex] = useState<number | null>(null);
  const [detailToast, setDetailToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showDetailToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setDetailToast({ message, type });
    setTimeout(() => setDetailToast(null), 4000);
  };
  const [editContactData, setEditContactData] = useState({ name: '', role: '', department: '', number: '' });

  // Equipments State
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loadingEquis, setLoadingEquis] = useState(false);
  const [isEquiModalOpen, setIsEquiModalOpen] = useState(false);
  const [isEquiEditing, setIsEquiEditing] = useState(false);
  const [equiToEdit, setEquiToEdit] = useState<any>(null);
  const [isEquiDetailsOpen, setIsEquiDetailsOpen] = useState(false);
  const [selectedEqui, setSelectedEqui] = useState<any>(null);
  const [isEquiDeleteModalOpen, setIsEquiDeleteModalOpen] = useState(false);
  const [equiToDelete, setEquiToDelete] = useState<any>(null);
  const [savingEqui, setSavingEqui] = useState(false);
  const [isEquiExpanded, setIsEquiExpanded] = useState(false);

  useEffect(() => {
    fetchEquipments();
  }, [client.id]);

  const fetchEquipments = async () => {
    setLoadingEquis(true);
    try {
      const data = await getEquipmentsByClient(client.id);
      setEquipments(data || []);
    } catch (err) {
      console.error('Erro ao buscar equipamentos do cliente:', err);
    } finally {
      setLoadingEquis(false);
    }
  };

  const handleSaveEquipment = async (formData: any) => {
    setSavingEqui(true);
    try {
      if (isEquiEditing && equiToEdit) {
        await adminUpdateEquipment(equiToEdit.id, formData);
        showDetailToast('Equipamento atualizado com sucesso!', 'success');
      } else {
        const result = await adminCreateEquipment({ ...formData, client_id: client.id });
        if (result.success) {
          showDetailToast(`Equipamento cadastrado! Tag: ${result.equipment.tag}`, 'success');
        }
      }
      setIsEquiModalOpen(false);
      setIsEquiEditing(false);
      setEquiToEdit(null);
      fetchEquipments();
    } catch (err: any) {
      showDetailToast('Erro ao salvar equipamento: ' + err.message, 'error');
    } finally {
      setSavingEqui(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equiToDelete) return;
    setSavingEqui(true);
    try {
      await adminDeleteEquipment(equiToDelete.id);
      setIsEquiDeleteModalOpen(false);
      setEquiToDelete(null);
      fetchEquipments();
      showDetailToast('Equipamento excluído com sucesso!', 'success');
    } catch (err: any) {
      showDetailToast('Erro ao excluir equipamento: ' + err.message, 'error');
    } finally {
      setSavingEqui(false);
    }
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  const handleSaveNewContact = async () => {
    if (!newContact.name || !newContact.number) {
      showDetailToast('Nome e Telefone são obrigatórios.', 'error');
      return;
    }

    setIsSavingContact(true);
    try {
      const updatedContacts = [...(client.contacts || []), newContact];
      await adminUpdateClient(client.id, { contacts: updatedContacts });
      
      client.contacts = updatedContacts;
      setIsAddingContact(false);
      setNewContact({ name: '', role: '', department: '', number: '' });
      onUpdate();
      showDetailToast('Contato adicionado com sucesso!', 'success');
    } catch (err: any) {
      showDetailToast('Erro ao salvar contato: ' + err.message, 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSaveEditContact = async (index: number) => {
    if (!editContactData.name || !editContactData.number) {
      showDetailToast('Nome e Telefone são obrigatórios.', 'error');
      return;
    }

    setIsSavingContact(true);
    try {
      const updatedContacts = [...(client.contacts || [])];
      updatedContacts[index] = editContactData;
      await adminUpdateClient(client.id, { contacts: updatedContacts });
      
      client.contacts = updatedContacts;
      setEditingIndex(null);
      onUpdate();
      showDetailToast('Contato atualizado!', 'success');
    } catch (err: any) {
      showDetailToast('Erro ao atualizar contato: ' + err.message, 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async () => {
    if (contactToDeleteIndex === null) return;

    setIsSavingContact(true);
    try {
      const updatedContacts = client.contacts.filter((_: any, i: number) => i !== contactToDeleteIndex);
      await adminUpdateClient(client.id, { contacts: updatedContacts });
      
      client.contacts = updatedContacts;
      setContactToDeleteIndex(null);
      onUpdate();
      showDetailToast('Contato removido com sucesso!', 'success');
    } catch (err: any) {
      showDetailToast('Erro ao excluir contato: ' + err.message, 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

  const startEditing = (index: number, contact: any) => {
    setEditingIndex(index);
    setEditContactData(contact);
    setIsAddingContact(false);
  };

  const inputClass = "w-full bg-navy-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-600 transition-all text-xs";
  const labelClass = "text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 block";

  return (
    <>
      <div className="animate-fade-in max-w-6xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Voltar
            </button>
          )}
          <button 
            onClick={() => onEdit()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-navy-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar Cadastro
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Header Section - Clean and Professional */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-navy-950/40 border border-slate-800/50 rounded-3xl p-8 flex flex-col items-center text-center backdrop-blur-sm">
              <div className="h-32 w-32 rounded-full border-4 border-slate-900 overflow-hidden bg-navy-900 flex items-center justify-center mb-6 shadow-2xl relative">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-slate-800">person</span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white leading-tight mb-1">{client.full_name || 'Sem nome'}</h2>
              <p className="text-slate-500 text-sm mb-6 lowercase">{client.email}</p>
              
              <div className="flex gap-2 justify-center w-full">
                <span className="px-3 py-1.5 bg-navy-900 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800">ID: {client.id.slice(0, 5)}...</span>
                <span className="px-3 py-1.5 bg-primary-600/5 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-600/10">Ativo</span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-4 grid grid-cols-2 gap-2">
              <a 
                href={getWhatsAppLink(client.whatsapp || '')} 
                target="_blank" 
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-emerald-600/10 hover:border-emerald-500/20 transition-all group"
              >
                <OfficialWhatsAppIcon className="w-6 h-6 text-slate-600 group-hover:text-emerald-500 mb-2" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Zap</span>
              </a>
              <a 
                href={`mailto:${client.email}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-primary-600/10 hover:border-primary-500/20 transition-all group"
              >
                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary-600 mb-2">mail</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">E-mail</span>
              </a>
            </div>
          </div>

          {/* Content Section - Low Contrast, Clean Labels */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Info */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-8 bg-primary-600 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Informações Cadastrais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <CleanInfo label="WhatsApp" value={client.whatsapp || 'Não informado'} />
                <CleanInfo label="CPF / CNPJ" value={client.document || 'Não informado'} />
                <CleanInfo label="Origem do Lead" value={client.source || 'Lead Direto'} />
                <CleanInfo label="Data de Nascimento" value={client.birthday ? client.birthday.split('-').reverse().join('/') : 'Não informada'} />
              </div>
            </div>

            {/* Additional Contacts Section */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 bg-green-600 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Equipe e Contatos Adicionais</h3>
                </div>
                <button 
                  onClick={() => setIsAddingContact(!isAddingContact)}
                  className={`h-8 w-8 rounded-full border transition-all flex items-center justify-center shadow-lg bg-navy-900 ${isAddingContact ? 'border-red-500/30 text-red-500 rotate-45' : 'border-slate-800 text-slate-500 hover:text-green-500 hover:border-green-500/30'}`}
                  title={isAddingContact ? "Cancelar" : "Adicionar Contato"}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              {isAddingContact && (
                <div className="mb-8 p-6 rounded-2xl bg-navy-950/40 border border-primary-500/20 animate-fade-in space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="Ex: João Silva"
                        value={newContact.name}
                        onChange={e => setNewContact({...newContact, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Cargo</label>
                      <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="Ex: Gerente de Manutenção"
                        value={newContact.role}
                        onChange={e => setNewContact({...newContact, role: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Setor</label>
                      <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="Ex: Facilities"
                        value={newContact.department}
                        onChange={e => setNewContact({...newContact, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone / WhatsApp</label>
                      <input 
                        type="text" 
                        className={inputClass} 
                        placeholder="Ex: 11999999999"
                        value={newContact.number}
                        onChange={e => setNewContact({...newContact, number: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      disabled={isSavingContact}
                      onClick={() => setIsAddingContact(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveNewContact}
                      disabled={isSavingContact}
                      className="px-6 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2"
                    >
                      {isSavingContact ? (
                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                      Salvar Contato
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {client.contacts && client.contacts.length > 0 ? (
                  <>
                    {(isExpanded ? client.contacts : client.contacts.slice(0, 3)).map((contact: any, idx: number) => (
                      <div key={idx} className="animate-fade-in">
                        {editingIndex === idx ? (
                          <div className="p-4 rounded-2xl bg-navy-900 border border-primary-500/30 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                className={inputClass} 
                                value={editContactData.name}
                                onChange={e => setEditContactData({...editContactData, name: e.target.value})}
                                placeholder="Nome"
                              />
                              <input 
                                type="text" 
                                className={inputClass} 
                                value={editContactData.role}
                                onChange={e => setEditContactData({...editContactData, role: e.target.value})}
                                placeholder="Cargo"
                              />
                              <input 
                                type="text" 
                                className={inputClass} 
                                value={editContactData.department}
                                onChange={e => setEditContactData({...editContactData, department: e.target.value})}
                                placeholder="Setor"
                              />
                              <input 
                                type="text" 
                                className={inputClass} 
                                value={editContactData.number}
                                onChange={e => setEditContactData({...editContactData, number: e.target.value})}
                                placeholder="Telefone"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingIndex(null)}
                                className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleSaveEditContact(idx)}
                                disabled={isSavingContact}
                                className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-900 border border-slate-800/50 group/contact">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1 flex-1">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">Nome / Cargo</span>
                                <span className="text-xs font-bold text-white uppercase tracking-tight">{contact.name || 'Sem nome'}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-black">{contact.role || 'Cargo não informado'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">Setor</span>
                                <span className="text-xs text-slate-300">{contact.department || '---'}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">Telefone</span>
                                <span className="text-xs text-slate-300 font-mono">{contact.number || '---'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 opacity-0 group-hover/contact:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditing(idx, contact)}
                                  className="h-8 w-8 rounded-lg bg-navy-950 border border-slate-800 text-slate-500 hover:text-primary-600 transition-all flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button 
                                  onClick={() => setContactToDeleteIndex(idx)}
                                  className="h-8 w-8 rounded-lg bg-navy-950 border border-slate-800 text-slate-500 hover:text-red-500 transition-all flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                              {contact.number && (
                                <a 
                                  href={getWhatsAppLink(contact.number)} 
                                  target="_blank"
                                  className="h-10 w-10 rounded-xl bg-emerald-500/5 text-emerald-500/40 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                                >
                                  <OfficialWhatsAppIcon className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {client.contacts.length > 3 && (
                      <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full py-3 rounded-2xl border border-slate-800/50 text-slate-500 hover:text-white hover:bg-white/[0.02] transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                      >
                        {isExpanded ? (
                          <>Ver Menos <span className="material-symbols-outlined text-[16px]">expand_less</span></>
                        ) : (
                          <>Ver Todos ({client.contacts.length}) <span className="material-symbols-outlined text-[16px]">expand_more</span></>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-center py-4 text-slate-600 text-xs italic">Nenhum contato adicional registrado.</p>
                )}
              </div>
            </div>

            {/* Equipments Section */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 bg-primary-600 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Equipamentos do Cliente</h3>
                </div>
                <button 
                  onClick={() => { setIsEquiEditing(false); setEquiToEdit(null); setIsEquiModalOpen(true); }}
                  className="h-8 w-8 rounded-full border border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-600/30 transition-all flex items-center justify-center shadow-lg bg-navy-900"
                  title="Adicionar Equipamento"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              <div className="space-y-4">
                {loadingEquis ? (
                  <div className="py-8 flex justify-center">
                    <div className="h-6 w-6 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : equipments.length > 0 ? (
                  <>
                    {(isEquiExpanded ? equipments : equipments.slice(0, 3)).map((equip: any) => (
                      <div 
                        key={equip.id} 
                        className="flex items-center justify-between p-4 rounded-2xl bg-navy-900 border border-slate-800/50 group/equip hover:border-primary-600/30 transition-all cursor-pointer"
                        onClick={() => { setSelectedEqui(equip); setIsEquiDetailsOpen(true); }}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-center text-primary-600 shrink-0 overflow-hidden font-bold text-[8px]">
                            {equip.photo_url ? (
                              <img src={equip.photo_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-xl">ac_unit</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white group-hover/equip:text-primary-600 transition-colors truncate">{equip.name}</span>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{equip.tag}</span>
                          </div>
                          <div className="hidden md:flex flex-col ml-4">
                            <span className="text-[9px] text-slate-600 font-bold uppercase">Marca / Modelo / Capacidade</span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {equip.brand || '---'} {equip.model ? `/ ${equip.model}` : ''} {equip.capacity ? `(${equip.capacity})` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover/equip:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEquiToEdit(equip); setIsEquiEditing(true); setIsEquiModalOpen(true); }}
                              className="h-8 w-8 rounded-lg bg-navy-950 border border-slate-800 text-slate-500 hover:text-primary-600 transition-all flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button 
                              onClick={() => { setEquiToDelete(equip); setIsEquiDeleteModalOpen(true); }}
                              className="h-8 w-8 rounded-lg bg-navy-950 border border-slate-800 text-slate-500 hover:text-red-500 transition-all flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${equip.has_contract ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                            {equip.has_contract ? 'Contrato' : 'Avulso'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {equipments.length > 3 && (
                      <button 
                        onClick={() => setIsEquiExpanded(!isEquiExpanded)}
                        className="w-full py-3 rounded-2xl border border-slate-800/50 text-slate-500 hover:text-white hover:bg-white/[0.02] transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                      >
                        {isEquiExpanded ? (
                          <>Ver Menos <span className="material-symbols-outlined text-[16px]">expand_less</span></>
                        ) : (
                          <>Ver Todos ({equipments.length})<span className="material-symbols-outlined text-[16px]">expand_more</span></>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-center py-4 text-slate-600 text-xs italic">Nenhum equipamento vinculado a este cliente.</p>
                )}
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Endereço e Localização</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8">
                <div className="md:col-span-2">
                  <CleanInfo label="Logradouro" value={client.street ? `${client.street}, ${client.number}` : 'Não informado'} />
                </div>
                <CleanInfo label="Bairro" value={client.neighborhood || '---'} />
                <CleanInfo label="CEP" value={client.cep || '---'} />
                <CleanInfo label="Cidade / UF" value={client.city ? `${client.city} - ${client.state}` : '---'} />
                <CleanInfo label="Complemento" value={client.complement || '---'} />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-navy-950/20 border border-slate-800/30 rounded-3xl p-8">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Anotações Internas</h3>
              <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic">
                {client.notes || 'Nenhuma observação registrada para este cliente.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED POSITION ELEMENTS - Moved outside animated div */}
      {contactToDeleteIndex !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">person_remove</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Remover Contato?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Tem certeza que deseja remover <span className="text-white font-bold">{client.contacts?.[contactToDeleteIndex]?.name || 'este contato'}</span> da equipe?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setContactToDeleteIndex(null)} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteContact}
                disabled={isSavingContact}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSavingContact ? 'Removendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Modals */}
      {isEquiModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsEquiModalOpen(false); }}
        >
          <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">{isEquiEditing ? 'edit_square' : 'ac_unit'}</span>
                {isEquiEditing ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>
              <button 
                onClick={() => setIsEquiModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <EquipmentForm 
                initialData={isEquiEditing ? equiToEdit : { client_id: client.id }}
                onSubmit={handleSaveEquipment}
                onCancel={() => setIsEquiModalOpen(false)}
                loading={savingEqui}
                fixedClientId={client.id}
              />
            </div>
          </div>
        </div>
      )}

      {isEquiDetailsOpen && selectedEqui && (
        <div className="fixed inset-0 z-[130] bg-navy-950 overflow-y-auto pt-20 px-4 md:px-8 animate-fade-in">
          <EquipmentDetails 
            equipment={selectedEqui}
            onBack={() => setIsEquiDetailsOpen(false)}
            onEdit={() => {
              setEquiToEdit(selectedEqui);
              setIsEquiEditing(true);
              setIsEquiModalOpen(true);
              setIsEquiDetailsOpen(false);
            }}
          />
        </div>
      )}

      {isEquiDeleteModalOpen && equiToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="bg-navy-900 border border-red-500/20 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Excluir Equipamento?</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Você está prestes a excluir o equipamento <span className="text-white font-bold">{equiToDelete.name} ({equiToDelete.tag})</span>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEquiDeleteModalOpen(false)} 
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteEquipment}
                disabled={savingEqui}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
              >
                {savingEqui ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailToast && (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in transition-all max-w-lg ${
          detailToast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' :
          detailToast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-400' :
          'bg-primary-950/90 border-primary-500/30 text-primary-400'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {detailToast.type === 'success' ? 'check_circle' : detailToast.type === 'error' ? 'error' : 'info'}
          </span>
          <p className="text-sm font-medium text-white/90">{detailToast.message}</p>
          <button onClick={() => setDetailToast(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </>
  );
}

function CleanInfo({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <p className="text-slate-200 text-sm font-medium">{value}</p>
    </div>
  );
}
