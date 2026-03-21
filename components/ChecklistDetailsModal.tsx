'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ChecklistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  equipment?: any;
}

const CHECKLIST_LABELS: Record<string, string> = {
  limpeza_filtros: 'Limpeza dos Filtros de Ar',
  higienizacao_evaporadora: 'Higienização da Evaporadora',
  limpeza_condensadora: 'Limpeza da Condensadora',
  verificacao_drenagem: 'Verificação de Drenagem',
  limpeza_bandeja: 'Limpeza da Bandeja de Dreno',
  teste_estanqueidade: 'Teste de Estanqueidade (Vazamentos)',
  pressao_gas: 'Verificação de Pressão do Gás',
  amperagem_compressor: 'Medição de Amperagem do Compressor',
  reaperto_eletrico: 'Reaperto de Bornes Elétricos',
  teste_controles: 'Teste de Funcionamento dos Controles',
  estado_isolamento: 'Verificação do Estado do Isolamento Térmico',
  ruidos_vibracoes: 'Verificação de Ruídos e Vibrações',
  limpeza_gabinete: 'Limpeza do Gabinete Externo',
  verificacao_helice_turbina: 'Verificação de Hélice e Turbina',
  // Fallbacks for old logs
  filters: 'Limpeza dos Filtros de Ar',
  evaporator: 'Higienização da Evaporadora',
  condenser: 'Limpeza da Condensadora',
  drainage: 'Verificação de Drenagem',
  leakage: 'Teste de Estanqueidade (Vazamentos)',
  gas_pressure: 'Verificação de Pressão do Gás',
  amperage: 'Medição de Amperagem do Compressor',
  electrical: 'Reaperto de Bornes Elétricos',
  controls: 'Teste de Funcionamento dos Controles'
};

export default function ChecklistDetailsModal({ isOpen, onClose, log, equipment }: ChecklistDetailsModalProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(1);
  const [technicianName, setTechnicianName] = useState('Equipe Técnica Fixar');
  const [technicianDocument, setTechnicianDocument] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogo();
      setTechnicianName(log?.technician_name || 'Equipe Técnica Fixar');
      setTechnicianDocument(log?.technician_document || '');
      setTechnicianId(log?.technician_id || '');
    }
  }, [isOpen, log]);

  const fetchLogo = async () => {
    if (!log?.organization_id) return;
    // @ts-ignore
    const { data } = await supabase.from('organizations').select('logo_url, report_logo_url, report_logo_size').eq('id', log.organization_id).single();
    if (data) {
      setLogoUrl(data.report_logo_url || data.logo_url);
      // @ts-ignore
      setLogoScale(data.report_logo_size ? data.report_logo_size / 100 : 1);
    }
  };

  if (!isOpen || !log) return null;

  const checklist = log.checklist_data || {};

  const handlePrint = () => {
    window.print();
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const { updateMaintenanceLog } = await import('@/app/actions/equipments');
      await updateMaintenanceLog(log.id, log.checklist_data, log.notes, technicianName, technicianDocument, technicianId);
      // Changes are saved to DB. Next open will reflect them.
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="bg-navy-900 border border-slate-800 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:w-full print:static">
        {/* Header */}
        <div className="p-8 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-navy-950/50 print:bg-white print:border-b-2 print:border-slate-200">
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center print:bg-emerald-50 print:border print:border-emerald-200">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight print:text-xl print:text-navy-950">Relatório de Manutenção</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 print:text-[10px]">
                {equipment ? `${equipment.name} • TAG: ${equipment.tag || 'S/N'}` : 'Detalhes da Manutenção'}
              </p>
              {log.contract_name && (
                <p className="text-[10px] text-primary-500 font-black uppercase tracking-[0.2em] mt-1">
                  Contrato: {log.contract_name}
                </p>
              )}
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5 print:block">
                Realizado em {new Date(log.performed_at).toLocaleDateString('pt-BR')} às {new Date(log.performed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end leading-none font-bold">
            <div className="flex items-center gap-3 mb-1">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-auto object-contain transition-all origin-right" 
                  style={{ height: `${48 * logoScale}px` }}
                />
              ) : (
                <span className="text-[#001a40] text-3xl font-black italic uppercase tracking-tight">FiXAr</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button 
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">{saving ? 'track_changes' : 'save'}</span>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button 
              onClick={handlePrint}
              className="px-6 py-3 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Imprimir
            </button>
            <button 
              onClick={onClose}
              className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all bg-navy-900 border border-slate-800"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar text-left print:overflow-visible print:p-8 print:flex print:flex-col print:min-h-[260mm]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:grid-cols-1 print:gap-4 flex-1">
            {/* Checklist Results */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-900">ITENS VERIFICADOS</h4>
              </div>
              
              <div className="space-y-3">
                {/* Standard Items */}
                {Object.entries(CHECKLIST_LABELS)
                  .filter(([id]) => {
                    const item = checklist[id];
                    if (!item) return false;
                    return typeof item === 'boolean' ? item : item?.checked;
                  })
                  .map(([id, label]) => {
                    const item = checklist[id] as any;
                    const isChecked = typeof item === 'boolean' ? item : item?.checked;
                    const photoUrl = typeof item === 'object' ? item?.photo_url : null;
                    const caption = typeof item === 'object' ? item?.caption : null;
                    
                    return (
                      <div key={id} className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all print:border-slate-100 print:p-2 print:break-inside-avoid ${isChecked ? 'bg-emerald-500/5 border-emerald-500/10 print:bg-emerald-50' : 'bg-navy-950 border-slate-800/50 opacity-40 print:opacity-30'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-lg print:text-sm ${isChecked ? 'text-emerald-500' : 'text-slate-700'}`}>
                            {isChecked ? 'check_circle' : 'circle'}
                          </span>
                          <span className={`text-sm font-bold leading-tight print:text-[10px] ${isChecked ? 'text-white print:text-navy-950' : 'text-slate-600'}`}>{label}</span>
                        </div>
                        
                        {photoUrl && (
                          <div className="mt-2 space-y-2">
                            <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-navy-950 print:border-slate-200">
                              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                            {caption && (
                              <p className="text-[11px] text-slate-400 font-medium italic print:text-slate-700 print:text-[9px]">
                                {caption}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Custom Items */}
                {Object.entries(checklist)
                  .filter(([id]) => !CHECKLIST_LABELS[id])
                  .filter(([_, item]: [string, any]) => item?.checked)
                  .map(([id, item]: [string, any]) => {
                    const isChecked = item?.checked;
                    const label = item?.label || id;
                    const photoUrl = item?.photo_url;
                    const caption = item?.caption;
                    
                    return (
                      <div key={id} className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all print:border-slate-100 print:p-2 print:break-inside-avoid ${isChecked ? 'bg-emerald-500/5 border-emerald-500/10 print:bg-emerald-50' : 'bg-navy-950 border-slate-800/50 opacity-40 print:opacity-30'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-lg print:text-sm ${isChecked ? 'text-emerald-500' : 'text-slate-700'}`}>
                            {isChecked ? 'check_circle' : 'circle'}
                          </span>
                          <span className={`text-sm font-bold leading-tight print:text-[10px] ${isChecked ? 'text-white print:text-navy-950' : 'text-slate-600'}`}>
                            {label}
                          </span>
                        </div>

                        {photoUrl && (
                          <div className="mt-2 space-y-2">
                            <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-navy-950 print:border-slate-200">
                              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                            {caption && (
                              <p className="text-[11px] text-slate-400 font-medium italic print:text-slate-700 print:text-[9px]">
                                {caption}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-6">
              <div className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-900">OBSERVAÇÕES DO TÉCNICO</h4>
                </div>
                <div className="p-6 rounded-3xl bg-navy-950 border border-slate-800 text-slate-400 text-sm leading-relaxed italic print:bg-slate-50 print:border-slate-100 print:text-slate-800 print:p-4 print:text-[10px]">
                  {log.notes || 'Nenhuma observação adicional registrada para esta manutenção.'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-16 flex justify-end print:pt-24 print:break-inside-avoid">
            <div className="w-64 text-center border-t border-slate-800 pt-3 print:border-slate-300">
              <div className="print:hidden space-y-1">
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full text-center bg-transparent border-none outline-none text-sm font-bold text-white"
                  placeholder="Nome do Técnico"
                />
                <input
                  type="text"
                  value={technicianDocument}
                  onChange={(e) => setTechnicianDocument(e.target.value)}
                  className="w-full text-center bg-transparent border-none outline-none text-[10px] text-slate-500 font-medium"
                  placeholder="CPF ou Conselho"
                />
              </div>
              
              <div className="hidden print:block">
                <p className="text-sm font-bold text-navy-950">{technicianName}</p>
                {technicianDocument && (
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">{technicianDocument}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-800/50 bg-navy-950/50 flex items-center justify-end print:hidden">
          <button 
            onClick={onClose}
            className="px-10 py-4 rounded-2xl bg-white text-navy-950 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl active:scale-95"
          >
            Fechar Relatório
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .fixed.inset-0 {
            position: absolute !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            z-index: 9999 !important;
          }
          .fixed.inset-0 * {
            visibility: visible;
          }
          .bg-navy-900, .bg-navy-950, .bg-black {
            background: white !important;
          }
          .text-white, .text-slate-400, .text-slate-500 {
            color: #0f172a !important;
          }
          .border-slate-800, .border-slate-700 {
            border-color: #e2e8f0 !important;
          }
          .material-symbols-outlined {
            display: inline-block !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
