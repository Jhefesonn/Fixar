'use client';

import React, { useState, useEffect } from 'react';
import { getAgendaItems, AgendaItem } from '@/app/actions/agenda';
import { saveMaintenanceChecklist } from '@/app/actions/equipments';
import AgendaCard from './AgendaCard';
import ChecklistModal from './ChecklistModal';
import ChecklistDetailsModal from './ChecklistDetailsModal';
import { format, startOfToday, endOfToday, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export default function AgendaView() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past' | 'completed'>('all');
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<AgendaItem | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getAgendaItems();
      setItems(data);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items
    .filter(item => {
      const d = new Date(item.date);
      if (filter === 'completed') return item.status === 'completed';
      if (item.status === 'completed' && filter !== 'all') return false; 
      
      if (filter === 'today') return isToday(d);
      if (filter === 'upcoming') return isFuture(d) && !isToday(d);
      if (filter === 'past') return isPast(d) && !isToday(d);
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const now = new Date().getTime();

      const isAtrasadoA = dateA < now && a.status !== 'completed' && !isToday(new Date(a.date));
      const isAtrasadoB = dateB < now && b.status !== 'completed' && !isToday(new Date(b.date));

      // 1. Atrasados primeiro
      if (isAtrasadoA && !isAtrasadoB) return -1;
      if (!isAtrasadoA && isAtrasadoB) return 1;

      // 2. Se ambos forem atrasados, o mais antigo primeiro (mais urgente)
      if (isAtrasadoA && isAtrasadoB) return dateA - dateB;

      // 3. Concluídos por último (em ordem decrescente de realização)
      const isCompA = a.status === 'completed';
      const isCompB = b.status === 'completed';
      if (isCompA && !isCompB) return 1;
      if (!isCompA && isCompB) return -1;
      if (isCompA && isCompB) return dateB - dateA;

      // 4. Restantes (Hoje e Futuro) em ordem ascendente
      return dateA - dateB;
    });

  const handleAction = async (item: AgendaItem) => {
    if (item.status === 'completed') {
      if (item.type === 'preventive' && item.checklist_id) {
        // Fetch full log for the details modal
        const { data, error } = await supabase
          .from('maintenance_logs')
          .select('*')
          .eq('id', item.checklist_id)
          .single();
        
        if (data) {
          setSelectedLog(data);
          setIsLogModalOpen(true);
        }
      } else if (item.order_id) {
        window.location.href = `/admin/orders/${item.order_id}`;
      }
      return;
    }

    if (item.type === 'preventive') {
      setSelectedChecklistItem(item);
    } else {
      // Redirect to order details or open order modal
      window.location.href = `/admin/orders/${item.order_id}`;
    }
  };

  const handleChecklistSubmit = async (
    checklistData: any, 
    notes: string, 
    structure: any, 
    technicianName?: string, 
    technicianId?: string, 
    technicianDocument?: string
  ) => {
    if (!selectedChecklistItem) return;
    
    try {
      await saveMaintenanceChecklist(
        selectedChecklistItem.equipment_id,
        checklistData,
        notes,
        technicianName || '',
        technicianId,
        technicianDocument,
        structure
      );
      setSelectedChecklistItem(null);
      fetchItems();
    } catch (err) {
      console.error('Erro ao salvar checklist da agenda:', err);
      alert('Falha ao salvar checklist de manutenção.');
    }
  };

  const stats = {
    today: items.filter(i => isToday(new Date(i.date))).length,
    overdue: items.filter(i => isPast(new Date(i.date)) && !isToday(new Date(i.date))).length,
    upcoming: items.filter(i => isFuture(new Date(i.date)) && !isToday(new Date(i.date))).length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col gap-1 shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Para Hoje</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white">{stats.today}</span>
            <div className="h-10 w-10 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
              <span className="material-symbols-outlined">today</span>
            </div>
          </div>
        </div>
        <div className="bg-navy-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col gap-1 shadow-xl">
          <span className="text-[10px] font-black text-red-500/80 uppercase tracking-widest">Atrasados</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white">{stats.overdue}</span>
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
          </div>
        </div>
        <div className="bg-navy-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col gap-1 shadow-xl">
          <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Próximos</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white">{stats.upcoming}</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined">update</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-navy-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-800/50 flex flex-wrap items-center justify-between gap-6 bg-navy-950/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Agenda de Manutenção</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Visão consolidada de tarefas</p>
            </div>
          </div>

          <div className="flex bg-navy-950 p-1.5 rounded-2xl border border-slate-800">
            {(['all', 'today', 'upcoming', 'past', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Tudo' : f === 'today' ? 'Hoje' : f === 'upcoming' ? 'Próximos' : f === 'past' ? 'Atrasados' : 'Realizados'}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Body */}
        <div className="p-8 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-12 w-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Carregando Agenda...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-800/20 flex items-center justify-center text-slate-700">
                <span className="material-symbols-outlined text-4xl">event_busy</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-400">Nenhum compromisso encontrado</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">Você não possui manutenções agendadas para este filtro no momento.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 relative">
              {/* Vertical Line Connector */}
              <div className="absolute left-[24px] top-6 bottom-6 w-0.5 bg-slate-800/30 -z-0" />
              
              {filteredItems.map((item) => (
                <AgendaCard 
                  key={item.id} 
                  item={item} 
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-navy-950/40 border-t border-slate-800/50 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preventiva</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Corretiva</span>
          </div>
        </div>
      </div>

      {/* Modais */}
      {selectedChecklistItem && (
        <ChecklistModal
          isOpen={!!selectedChecklistItem}
          onClose={() => setSelectedChecklistItem(null)}
          onSubmit={handleChecklistSubmit}
          equipmentId={selectedChecklistItem.equipment_id}
          equipmentName={selectedChecklistItem.equipment_name}
          equipmentTag={selectedChecklistItem.equipment_tag}
          onSuccess={() => {
            setSelectedChecklistItem(null);
            fetchItems();
          }}
        />
      )}

      {selectedLog && (
        <ChecklistDetailsModal
          isOpen={isLogModalOpen}
          onClose={() => {
            setIsLogModalOpen(false);
            setSelectedLog(null);
          }}
          log={selectedLog}
        />
      )}
    </div>
  );
}
