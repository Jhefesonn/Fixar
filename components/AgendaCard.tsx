'use client';

import React from 'react';
import { AgendaItem } from '@/app/actions/agenda';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaCardProps {
  item: AgendaItem;
  onAction?: (item: AgendaItem) => void;
}

export default function AgendaCard({ item, onAction }: AgendaCardProps) {
  const dateObj = new Date(item.date);
  
  const getRelativeDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const getPriorityColor = (priority?: string) => {
    if (item.status === 'completed') return 'bg-slate-500/10 text-slate-500 border-slate-500/10';
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const typeStyles = item.type === 'preventive' 
    ? { icon: 'event_repeat', color: item.status === 'completed' ? 'text-slate-400' : 'text-emerald-500', bg: item.status === 'completed' ? 'bg-slate-500/10' : 'bg-emerald-500/10', label: item.status === 'completed' ? 'Preventiva Realizada' : 'Preventiva' }
    : { icon: 'build', color: item.status === 'completed' ? 'text-slate-400' : 'text-amber-500', bg: item.status === 'completed' ? 'bg-slate-500/10' : 'bg-amber-500/10', label: item.status === 'completed' ? 'OS Concluída' : 'Corretiva' };

  const isCompleted = item.status === 'completed';
  const isAtrasado = !isCompleted && isPast(dateObj) && !isToday(dateObj);
  const isHoje = !isCompleted && isToday(dateObj);

  const getStatusBadge = () => {
    if (isCompleted) return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">Concluído</span>;
    if (isAtrasado) return <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-black uppercase tracking-widest animate-pulse">Atrasado</span>;
    if (isHoje) return <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20 text-[8px] font-black uppercase tracking-widest">Hoje</span>;
    return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest">Agendado</span>;
  };

  return (
    <div className={`group relative bg-navy-950/40 border border-slate-800/60 rounded-3xl p-5 hover:border-primary-600/30 transition-all hover:bg-navy-950/60 shadow-lg ${isAtrasado ? 'border-red-500/30' : ''} ${isCompleted ? 'border-dashed border-slate-700/50 grayscale-[0.5]' : ''}`}>
      {/* Background Glow */}
      {!isCompleted && (
        <div className={`absolute -inset-px bg-gradient-to-r ${isAtrasado ? 'from-red-600/0 via-red-600/5 to-red-600/0' : 'from-primary-600/0 via-primary-600/5 to-primary-600/0'} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
      )}
      
      <div className="relative flex items-start gap-4">
        {/* Date Indicator Side */}
        <div className="flex flex-col items-center min-w-[50px] pt-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            {format(dateObj, 'EEE', { locale: ptBR })}
          </span>
          <span className={`text-xl font-black ${isToday(dateObj) && !isCompleted ? 'text-primary-500' : isCompleted ? 'text-slate-500' : 'text-white'}`}>
            {format(dateObj, 'dd')}
          </span>
          <div className={`h-1.5 w-1.5 rounded-full mt-3 ${isCompleted ? 'bg-slate-600' : item.type === 'preventive' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 ${typeStyles.bg} ${typeStyles.color} border-current/10`}>
                <span className="material-symbols-outlined text-[10px]">{typeStyles.icon}</span>
                {typeStyles.label}
              </div>
              {getStatusBadge()}
            </div>
            {item.priority && (
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(item.priority)}`}>
                Prioridade {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
              </div>
            )}
          </div>

          <h4 className="text-sm font-bold text-white mb-1 truncate group-hover:text-primary-400 transition-colors">
            {item.client_name}
          </h4>
          
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-3">
            <span className="text-primary-600 font-black tracking-widest uppercase text-[9px]">{item.equipment_tag}</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="truncate">{item.equipment_name}</span>
          </div>

          {item.technician_name && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-sm">person</span>
              {item.technician_name}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="material-symbols-outlined text-sm">{isCompleted ? 'check_circle' : 'schedule'}</span>
              <span className="text-[11px] font-black tracking-tight">
                {isCompleted ? `Realizado em ${format(dateObj, 'dd/MM/yy HH:mm')}` : `${getRelativeDateLabel(dateObj)} • ${format(dateObj, 'HH:mm')}`}
              </span>
            </div>
            
            <button 
              onClick={() => onAction?.(item)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn ${isCompleted ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-navy-900 border-slate-800 text-white hover:bg-primary-600 hover:border-primary-500'}`}
            >
              {isCompleted ? 'Ver Detalhes' : 'Visualizar'}
              <span className="material-symbols-outlined text-xs group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
