import React from 'react';

interface FinancialStatsProps {
  summary: {
    totalRevenue: number;
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    totalExpenses: number;
  };
}

export default function FinancialStats({ summary }: FinancialStatsProps) {
  const stats = [
    {
      label: 'Receita Prevista',
      value: summary.totalRevenue,
      icon: 'payments',
      color: 'text-primary-500',
      bg: 'bg-primary-500/10'
    },
    {
      label: 'Recebido',
      value: summary.totalPaid,
      icon: 'check_circle',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'A Receber',
      value: summary.totalPending,
      icon: 'pending_actions',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Atrasado',
      value: summary.totalOverdue,
      icon: 'warning',
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-navy-950/50 border border-slate-800 rounded-3xl p-6 flex flex-col gap-1 shadow-xl hover:border-slate-700 transition-all">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white tracking-tighter">
              R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
