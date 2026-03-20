'use client';

import React, { useState, useEffect } from 'react';
import { getFinancialSummary, getFinancialRecords, FinancialRecord, syncContractBillings, deleteFinancialRecord, updateFinancialStatus } from '@/app/actions/financial';
import FinancialStats from './FinancialStats';
import InvoiceModal from './InvoiceModal';
import ConfirmModal from './ConfirmModal';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FinancialView() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    totalExpenses: 0
  });
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  
  // States for custom delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecord | null>(null);
  
  // Period filter states
  const [period, setPeriod] = useState<'current_month' | 'last_month' | 'last_3_months' | 'current_year' | 'all'>('current_month');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Sync contracts first (only once, or on every fetch if needed)
      // For performance, we can sync less frequently, but here we keep it for now
      await syncContractBillings();
      
      // Calculate date range based on period
      let startDate: string | undefined;
      let endDate: string | undefined;
      const now = new Date();

      if (period === 'current_month') {
        startDate = format(startOfMonth(now), 'yyyy-MM-01');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      } else if (period === 'last_month') {
        const lastMonth = subMonths(now, 1);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-01');
        endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
      } else if (period === 'last_3_months') {
        startDate = format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-01');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      } else if (period === 'current_year') {
        startDate = format(startOfYear(now), 'yyyy-01-01');
        endDate = format(endOfYear(now), 'yyyy-12-31');
      }

      // 2. Fetch data with date filters
      const dateFilters = { startDate, endDate };
      const [s, r] = await Promise.all([
        getFinancialSummary(dateFilters),
        getFinancialRecords(dateFilters)
      ]);
      setSummary(s);
      setRecords(r);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records
    .filter(r => {
      if (filter === 'all') return true;
      return r.status === filter;
    })
    .sort((a, b) => {
      // Prioridade de Status: overdue (0), pending (1), paid (2), cancelled (3)
      const statusWeight: Record<string, number> = {
        overdue: 0,
        pending: 1,
        paid: 2,
        cancelled: 3
      };
      
      const weightA = statusWeight[a.status] ?? 4;
      const weightB = statusWeight[b.status] ?? 4;
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      
      // Dentro do mesmo status, ordenar por data 
      const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
      
      if (weightA <= 1) { // overdue ou pending: mais antigos primeiro (urgência)
        return dateA - dateB;
      }
      
      // Outros: mais recentes primeiro (histórico)
      return dateB - dateA;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestão Financeira</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Controle de faturamento e notas fiscais</p>
        </div>
        <button 
          onClick={() => {
            setSelectedRecord(null);
            setIsInvoiceModalOpen(true);
          }}
          className="px-8 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_card</span>
          Novo Lançamento
        </button>
      </div>

      <FinancialStats summary={summary} />

      {/* Main Content Area */}
      <div className="bg-navy-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-4 md:p-8 border-b border-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-navy-950/30">
          <div className="flex bg-navy-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar no-wrap">
            <div className="flex min-w-max gap-1">
              {(['current_month', 'last_month', 'last_3_months', 'current_year', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    period === p 
                      ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {p === 'current_month' ? 'Mês Atual' : 
                   p === 'last_month' ? 'Mês Anterior' : 
                   p === 'last_3_months' ? '3 Meses' : 
                   p === 'current_year' ? 'Ano' : 'Tudo'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex bg-navy-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar no-wrap">
            <div className="flex min-w-max gap-1">
              {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filter === f 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pendente' : f === 'paid' ? 'Pago' : 'Atrasado'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table/List Body */}
        <div className="p-0 flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="h-12 w-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Carregando Financeiro...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-800/20 flex items-center justify-center text-slate-700">
                <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
              </div>
              <h3 className="text-lg font-bold text-slate-400">Nenhum registro encontrado</h3>
            </div>
          ) : (
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-navy-950/50 text-left border-b border-slate-800/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight">
                          {record.category === 'contract' && record.contract ? (
                            `Manutenção Mensal: ${record.contract.name}${record.description.includes('(') ? ' (' + record.description.split('(')[1] : ''}`
                          ) : (
                            record.description
                          )}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-navy-950 px-1.5 py-0.5 rounded border border-slate-800">{record.category}</span>
                           {record.order && (
                             <span className="text-[9px] text-primary-400 font-bold flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">receipt_long</span>
                               {record.order.name}
                             </span>
                           )}
                           {record.contract && (
                             <span className="text-[9px] text-accent font-bold flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">description</span>
                               {record.contract.name}
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-300 text-sm">
                      {record.client?.full_name || '---'}
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-400 font-medium">
                      {record.due_date ? format(new Date(record.due_date), 'dd/MM/yyyy') : '---'}
                    </td>
                    <td className="px-6 py-6 text-sm font-black text-white">
                      R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-6">
                      <select
                        value={record.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as any;
                          try {
                            await updateFinancialStatus(record.id, newStatus);
                            fetchData();
                          } catch (err) {
                            alert('Erro ao atualizar status.');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-transparent cursor-pointer focus:outline-none transition-all ${
                          record.status === 'paid' ? 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' :
                          record.status === 'overdue' ? 'text-red-500 border-red-500/20 hover:bg-red-500/10' :
                          'text-amber-500 border-amber-500/20 hover:bg-amber-500/10'
                        }`}
                      >
                        <option value="pending" className="bg-navy-900 text-amber-500">Pendente</option>
                        <option value="paid" className="bg-navy-900 text-emerald-500">Pago</option>
                        <option value="overdue" className="bg-navy-900 text-red-500">Atrasado</option>
                        <option value="cancelled" className="bg-navy-900 text-slate-500">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-right justify-end">
                        {record.documents && record.documents.length > 0 ? (
                          <a 
                            href={record.documents[0].file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                            title="Ver Nota Fiscal"
                          >
                            <span className="material-symbols-outlined text-lg">description</span>
                          </a>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(record);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all"
                            title="Anexar Nota Fiscal"
                          >
                            <span className="material-symbols-outlined text-lg">file_upload</span>
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            setRecordToDelete(record);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-9 w-9 rounded-xl border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={fetchData}
        initialData={selectedRecord}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={async () => {
          if (recordToDelete) {
            try {
              await deleteFinancialRecord(recordToDelete.id);
              fetchData();
            } catch (err) {
              alert('Erro ao excluir lançamento financeiro.');
            }
          }
        }}
        type="danger"
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita e afetará seu saldo total."
        confirmLabel="Sim, Excluir"
        cancelLabel="Voltar"
      />
    </div>
  );
}
