'use client';

import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardView({ userName, onNavigate }: { userName?: string, onNavigate?: (view: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth(); // Espera pelo perfil (e pelo cookie)

  useEffect(() => {
    // Só tenta buscar do servidor quando o perfil e cookie estiverem prontos no cliente
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    setLoading(true);
    // Lê o token nativo direto do cliente (que não sofre bloqueios de cookie)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const result = await getDashboardStats(token);
    if (result.success) {
      setData(result.stats);
    } else if (result.error !== 'SESSION_EXPIRED') {
      console.error('Dashboard Error:', result.error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-12 w-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Carregando Dashboard...</p>
      </div>
    );
  }

  const stats = data || {
    totalClients: 0,
    totalContracts: 0,
    futureOrders: 0,
    expectedRevenue: 0,
    paidRevenue: 0,
    overdueCount: 0,
    overdueValue: 0,
    delayedOrders: 0,
    lowStockItemsCount: 0,
    lowStockItems: []
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-end">
        <button 
          onClick={fetchStats}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-950 border border-slate-800 text-slate-400 hover:text-primary-600 transition-all shadow-lg"
          title="Atualizar Dados"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Contratos', value: stats.totalContracts, icon: 'description', color: 'blue', desc: 'Contratos ativos', view: 'contratos' },
          { label: 'Total de Clientes', value: stats.totalClients, icon: 'group', color: 'accent', desc: 'Clientes cadastrados', view: 'clientes' },
          { label: 'Pedidos Futuros', value: stats.futureOrders, icon: 'calendar_today', color: 'purple', desc: 'Próximos agendamentos', view: 'agenda' },
          { 
            label: 'Resumo Financeiro', 
            isFinancial: true, 
            icon: 'payments', 
            color: 'green', 
            desc: 'Mês atual', 
            view: 'financeiro' 
          }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => onNavigate && onNavigate(stat.view)}
            className="card-premium group hover:border-primary-600/30 transition-all duration-500 cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-navy-950 border border-slate-800 text-primary-600 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
            </div>
            
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            
            {stat.isFinancial ? (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Previsto: <span className="text-white">{stats.expectedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <h3 className="text-xl font-black text-emerald-500">{stats.paidRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                <p className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest">Total Recebido</p>
              </div>
            ) : (
              <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            )}
            
            <p className="text-[10px] text-slate-600 mt-2 font-medium">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Alerts and Activities */}
        <div className="lg:col-span-2 space-y-8">
            <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
                <div className="p-6 border-b border-slate-800/50 bg-navy-950/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">warning</span>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Pendências Críticas</h3>
                    </div>
                </div>
                <div className="divide-y divide-slate-800/30">
                    {stats.delayedOrders > 0 && (
                        <div 
                          onClick={() => onNavigate && onNavigate('pedidos')}
                          className="p-6 flex items-center justify-between bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined">event_busy</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{stats.delayedOrders} Ordens de Serviço Atrasadas</p>
                                    <p className="text-xs text-slate-500">Pedidos pendentes com data de execução passada.</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                        </div>
                    )}
                    
                    {stats.overdueCount > 0 && (
                        <div 
                          onClick={() => onNavigate && onNavigate('financeiro')}
                          className="p-6 flex items-center justify-between bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined">money_off</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{stats.overdueCount} Pagamentos Atrasados</p>
                                    <p className="text-xs text-slate-500">Valor total pendente: {stats.overdueValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                        </div>
                    )}
                    
                    {stats.lowStockItemsCount > 0 && (
                        <div 
                          onClick={() => onNavigate && onNavigate('estoque')}
                          className="p-6 flex items-center justify-between bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-tighter">{stats.lowStockItemsCount} Itens com Estoque Crítico</p>
                                    <p className="text-xs text-slate-500">Produtos abaixo do limite mínimo de segurança.</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                        </div>
                    )}

                    {stats.delayedOrders === 0 && stats.overdueCount === 0 && stats.lowStockItemsCount === 0 && (
                         <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">Tudo em dia!</h4>
                            <p className="text-xs text-slate-500 max-w-[200px]">Nenhuma pendência crítica detectada no momento.</p>
                         </div>
                    )}
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Próximos Passos</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-950 border border-slate-800">
                           <span className="material-symbols-outlined text-primary-600">add_task</span>
                           <p className="text-xs font-medium text-slate-300">Sincronizar faturamento de contratos</p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-950 border border-slate-800">
                           <span className="material-symbols-outlined text-primary-600">person_add</span>
                           <p className="text-xs font-medium text-slate-300">Cadastrar novos técnicos</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Atalhos Rápidos</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-primary-600/30 transition-all flex flex-col items-center gap-2">
                           <span className="material-symbols-outlined">receipt_long</span>
                           Nova OS
                        </button>
                        <button className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-primary-600/30 transition-all flex flex-col items-center gap-2">
                           <span className="material-symbols-outlined">description</span>
                           Novo Contrato
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Alerts and Inventory Detail */}
        <div className="space-y-8">
            <div className="card-premium !p-0 overflow-hidden border-slate-800/50 shadow-2xl">
                <div className="p-6 border-b border-slate-800/50 bg-navy-950/30">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Alertas de Estoque</h3>
                </div>
                <div className="p-6 space-y-4">
                    {stats.lowStockItems.length > 0 ? (
                        stats.lowStockItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-navy-950 border border-slate-800">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                                    <span className="text-[10px] text-slate-500">Mínimo: {item.min_quantity || 5} unidades</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-red-500">{item.current_quantity}</span>
                                    <p className="text-[9px] font-black text-red-500/50 uppercase tracking-tighter">Crítico</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <span className="material-symbols-outlined text-slate-800 text-4xl mb-2">inventory</span>
                            <p className="text-xs text-slate-600 font-medium">Todos os itens em dia.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-premium !p-8 bg-gradient-to-br from-primary-600/20 to-transparent border-primary-600/20">
                <h4 className="text-lg font-black text-white mb-2">Expansão de Negócio</h4>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">Seu faturamento aumentou em 18% este mês. Considere revender peças em falta para maior lucro.</p>
                <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary-600 w-3/4 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                </div>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Meta Mensal: 75% atingida</p>
            </div>
        </div>
      </div>
    </div>
  );
}
