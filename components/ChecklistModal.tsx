'use client';

import React, { useState, useEffect } from 'react';
import PhotoField from './shared/PhotoField';
import { getTechnicians, upsertTechnician } from '@/app/actions/equipments';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (checklistData: any, notes: string, structure: any, technicianName?: string, technicianId?: string, technicianDocument?: string) => Promise<void>;
  loading?: boolean;
  initialItems?: { id: string; label: string }[];
  initialData?: { checklist_data: any; notes: string; technician_name?: string; technician_id?: string; technician_document?: string };
  equipmentId?: string;
  equipmentName?: string;
  equipmentTag?: string;
  onSuccess?: () => void;
}

const CHECKLIST_ITEMS = [
  { id: 'limpeza_filtros', label: 'Limpeza dos Filtros de Ar' },
  { id: 'higienizacao_evaporadora', label: 'Higienização da Evaporadora' },
  { id: 'limpeza_condensadora', label: 'Limpeza da Condensadora' },
  { id: 'verificacao_drenagem', label: 'Verificação de Drenagem' },
  { id: 'limpeza_bandeja', label: 'Limpeza da Bandeja de Dreno' },
  { id: 'teste_estanqueidade', label: 'Teste de Estanqueidade (Vazamentos)' },
  { id: 'pressao_gas', label: 'Verificação de Pressão do Gás' },
  { id: 'amperagem_compressor', label: 'Medição de Amperagem do Compressor' },
  { id: 'reaperto_eletrico', label: 'Reaperto de Bornes Elétricos' },
  { id: 'teste_controles', label: 'Teste de Funcionamento dos Controles' },
  { id: 'estado_isolamento', label: 'Verificação do Estado do Isolamento Térmico' },
  { id: 'ruidos_vibracoes', label: 'Verificação de Ruídos e Vibrações' },
  { id: 'limpeza_gabinete', label: 'Limpeza do Gabinete Externo' },
  { id: 'verificacao_helice_turbina', label: 'Verificação de Hélice e Turbina' }
];

export default function ChecklistModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  initialItems, 
  initialData,
  equipmentId,
  equipmentName,
  equipmentTag,
  onSuccess
}: ChecklistModalProps) {
  const [items, setItems] = useState<{ id: string; label: string }[]>(CHECKLIST_ITEMS);
  const [checklist, setChecklist] = useState<Record<string, { checked: boolean; photo_url?: string; caption?: string; label?: string }>>({});
  const [notes, setNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicianDocument, setTechnicianDocument] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechDoc, setNewTechDoc] = useState('');
  const [loadingTechs, setLoadingTechs] = useState(true);
  const lastAddedId = React.useRef<string | null>(null);

  // Load technicians
  useEffect(() => {
    const loadTechs = async () => {
      try {
        setLoadingTechs(true);
        const techs = await getTechnicians();
        setTechnicians(techs);
      } catch (err) {
        console.error('Error loading technicians:', err);
      } finally {
        setLoadingTechs(false);
      }
    };
    loadTechs();
  }, [initialData]);

  // Reset/Pre-fill state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode: Editing an existing log
        const logData = initialData.checklist_data || {};
        const logItems = Object.entries(logData).map(([id, data]: [string, any]) => ({
          id,
          label: data.label || id
        }));
        setItems(logItems.length > 0 ? logItems : CHECKLIST_ITEMS);
        setChecklist(logData);
        setNotes(initialData.notes || '');
        setTechnicianName(initialData.technician_name || '');
        setTechnicianId(initialData.technician_id || '');
        setTechnicianDocument(initialData.technician_document || '');
      } else {
        // Mode: Creating a new log (using template or defaults)
        const baseItems = initialItems && initialItems.length > 0 ? initialItems : CHECKLIST_ITEMS;
        setItems(baseItems);
        setChecklist(Object.fromEntries(baseItems.map(item => [item.id, { checked: false, label: item.label }])));
        setNotes('');
        
        // Auto-select if only one technician exists
        if (technicians.length === 1) {
          setTechnicianId(technicians[0].id);
          setTechnicianName(technicians[0].name);
          setTechnicianDocument(technicians[0].document);
        } else {
          setTechnicianName('');
          setTechnicianId('');
          setTechnicianDocument('');
        }
      }
      lastAddedId.current = null;
    }
  }, [isOpen, initialItems, initialData, technicians]);

  // Focus effect for new items
  React.useEffect(() => {
    if (lastAddedId.current) {
      const input = document.getElementById(`input-${lastAddedId.current}`);
      if (input) {
        input.focus();
        lastAddedId.current = null;
      }
    }
  }, [items]);

  const toggleItem = (id: string) => {
    setChecklist(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], checked: !prev[id].checked } 
    }));
  };

  const setItemPhoto = (id: string, url: string) => {
    setChecklist(prev => ({
      ...prev,
      [id]: { ...prev[id], photo_url: url, checked: true } // Auto check if photo is added
    }));
  };

  const setItemCaption = (id: string, caption: string) => {
    setChecklist(prev => ({
      ...prev,
      [id]: { ...prev[id], caption }
    }));
  };

  const handleAddItem = () => {
    const id = `custom-${Date.now()}`;
    lastAddedId.current = id;
    setItems(prev => [...prev, { id, label: '' }]);
    setChecklist(prev => ({
      ...prev,
      [id]: { checked: false, label: '' }
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setChecklist(prev => {
      const newChecklist = { ...prev };
      delete newChecklist[id];
      return newChecklist;
    });
  };

  const handleUpdateItemLabel = (id: string, label: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, label } : item));
    setChecklist(prev => ({
      ...prev,
      [id]: { ...prev[id], label }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!technicianId) {
      alert('Por favor, selecione ou cadastre o técnico responsável.');
      return;
    }

    const finalChecklist: any = {};
    const finalStructure: any = [];
    
    items.forEach(item => {
      if (checklist[item.id]) {
        const itemLabel = item.label || 'Verificação';
        finalChecklist[item.id] = {
          ...checklist[item.id],
          label: itemLabel
        };
        // Also save structure
        finalStructure.push({ id: item.id, label: itemLabel });
      }
    });

    const finalTechId = (technicianId && technicianId.trim() !== '') ? technicianId : undefined;
    onSubmit(finalChecklist, notes, finalStructure, technicianName, finalTechId, technicianDocument);
  };

  const handleCreateTechnician = async () => {
    if (!newTechName) return;
    try {
      const tech = await upsertTechnician({ name: newTechName, document: newTechDoc });
      setTechnicians(prev => [...prev, tech]);
      setTechnicianId(tech.id);
      setTechnicianName(tech.name);
      setTechnicianDocument(tech.document);
      setIsAddingTech(false);
      setNewTechName('');
      setNewTechDoc('');
    } catch (err) {
      console.error('Error creating technician:', err);
      alert('Erro ao cadastrar técnico.');
    }
  };

  if (!isOpen) return null;

  const renderChecklistItem = (item: { id: string; label: string }) => {
    const itemData = checklist[item.id];
    if (!itemData) return null;

    return (
      <div 
        key={item.id}
        className={`p-4 rounded-2xl border transition-all space-y-4 group ${
          itemData.checked 
            ? 'bg-emerald-500/5 border-emerald-500/30' 
            : 'bg-navy-950 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div 
            className="flex flex-1 items-center gap-4 cursor-pointer"
            onClick={() => toggleItem(item.id)}
          >
            <div className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              itemData.checked 
                ? 'bg-emerald-500 border-emerald-500 text-navy-950 scale-110' 
                : 'border-slate-700 hover:border-slate-500'
            }`}>
              {itemData.checked && <span className="material-symbols-outlined text-[18px] font-bold">check</span>}
            </div>
            
            <textarea 
                id={`input-${item.id}`}
                rows={1}
                value={item.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  handleUpdateItemLabel(item.id, e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="bg-transparent border-b border-dashed border-transparent hover:border-slate-700 focus:border-emerald-500 text-sm font-bold text-white outline-none py-1 w-full transition-all resize-none overflow-hidden"
                placeholder="Nome da verificação..."
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {itemData.checked && (
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest animate-fade-in hidden sm:inline">Ok</span>
            )}
            <button 
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                title="Remover Verificação"
            >
                <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>

        {/* Photo Field integration */}
        <div className={`transition-all duration-300 overflow-hidden ${itemData.checked ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
           <div className="pt-2 space-y-4">
              <PhotoField 
                value={itemData.photo_url || ''} 
                onUpload={(url) => setItemPhoto(item.id, url)}
                folder="checklists"
                label="Comprovante Visual (Opcional)"
                aspect={4/3}
                icon="add_a_photo"
              />
              
              {itemData.photo_url && (
                <div className="animate-fade-in space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Serviço / Constatado</label>
                  <input 
                    type="text"
                    value={itemData.caption || ''}
                    onChange={(e) => setItemCaption(item.id, e.target.value)}
                    placeholder="Ex: Detalhes do item verificado..."
                    className="w-full bg-navy-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-700"
                  />
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined">fact_check</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Checklist de Manutenção</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rotina Preventiva Contratual</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => renderChecklistItem(item))}
            
            <div className="flex justify-center p-4">
                <button 
                    type="button"
                    onClick={handleAddItem}
                    className="h-12 w-12 rounded-full bg-navy-950 border-2 border-dashed border-slate-800 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex items-center justify-center shadow-lg active:scale-90"
                    title="Adicionar Novo Item"
                >
                    <span className="material-symbols-outlined text-2xl">add</span>
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                <span>Técnico Responsável *</span>
                <button 
                  type="button" 
                  onClick={() => setIsAddingTech(!isAddingTech)}
                  className="text-emerald-500 hover:text-emerald-400 normal-case"
                >
                  {isAddingTech ? 'Cancelar' : '+ Novo Técnico'}
                </button>
              </label>

              {isAddingTech ? (
                <div className="space-y-3 p-4 bg-navy-950 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder="Nome do Técnico..."
                    className="w-full bg-navy-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={newTechDoc}
                    onChange={(e) => setNewTechDoc(e.target.value)}
                    placeholder="CPF ou Conselho..."
                    className="w-full bg-navy-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTechnician}
                    disabled={!newTechName}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Confirmar Cadastro
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">person</span>
                  <select
                    value={technicianId}
                    onChange={(e) => {
                      const tech = technicians.find(t => t.id === e.target.value);
                      if (tech) {
                        setTechnicianId(tech.id);
                        setTechnicianName(tech.name);
                        setTechnicianDocument(tech.document);
                      } else {
                        setTechnicianId('');
                        setTechnicianName('');
                        setTechnicianDocument('');
                      }
                    }}
                    className="w-full bg-navy-950 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all appearance-none shadow-inner"
                    required
                  >
                    <option value="">Selecione um técnico...</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name} {tech.document ? `(${tech.document})` : ''}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações Técnicas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={isAddingTech ? 5 : 1}
                className="w-full bg-navy-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-700 resize-none shadow-inner"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-navy-950/50 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-white/[0.02] hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading || !Object.values(checklist).some(v => v)}
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">verified</span>
                Finalizar Manutenção
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
