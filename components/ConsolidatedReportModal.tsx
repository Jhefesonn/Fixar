'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';

interface ConsolidatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: any[];
  contract: any;
  organizationId: string;
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
};

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

function PdfReportContent({ logs, contract, logoUrl, logoScale, orgName, containerRef }: {
  logs: any[];
  contract: any;
  logoUrl: string | null;
  logoScale: number;
  orgName: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={containerRef} className="pdf-report-container">
      {/* Cover Page */}
      <div data-page="cover" className="pdf-page">
        <div className="pdf-inner">
          <div className="flex justify-between items-start pb-6 mb-4 border-b-2 border-slate-200">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em]">Relatório Técnico</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">Consolidado de Manutenção</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">{contract?.name}</p>
            </div>
            <div className="flex flex-col items-end">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: `${45 * logoScale}px` }} />
              ) : (
                <span className="text-slate-900 text-2xl font-black italic uppercase tracking-tight">{orgName}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="space-y-3">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cliente</p>
                <p className="text-sm font-bold text-slate-900">{contract?.client?.full_name || 'Cliente'}</p>
                {contract?.client?.document && (
                  <p className="text-[10px] text-slate-500">{contract.client.document}</p>
                )}
                {contract?.client?.whatsapp && (
                  <p className="text-[10px] text-slate-500">WhatsApp: {contract.client.whatsapp}</p>
                )}
              </div>
              {(contract?.client?.street || contract?.client?.city) && (
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Endereço</p>
                  <p className="text-[10px] text-slate-600">
                    {[contract.client.street, contract.client.number, contract.client.neighborhood, contract.client.city, contract.client.state].filter(Boolean).join(', ')}
                    {contract.client.cep && ` - CEP: ${contract.client.cep}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tipo de Contrato</p>
                <p className="text-sm font-bold text-slate-900">{contract?.type}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Periodicidade</p>
                  <p className="text-xs font-bold text-slate-900">{PERIODICITY_LABELS[contract?.periodicity] || contract?.periodicity}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Equipamentos no Relatório</p>
                  <p className="text-xs font-bold text-slate-900">{logs.length}</p>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Data de Geração</p>
                <p className="text-xs font-bold text-slate-900">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {contract?.start_date && contract?.duration_months && (() => {
                const startDate = new Date(contract.start_date);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + (contract.duration_months || 12));
                return (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vigência do Contrato</p>
                    <p className="text-xs font-bold text-slate-900">
                      {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-[10px] text-slate-600 leading-relaxed italic text-center">
              Este documento consolida os registros de manutenção preventiva realizados conforme cronograma contratual.
              As inspeções seguem as normas técnicas de qualidade e segurança estabelecidas pela <span className="font-bold uppercase">{orgName}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Log Pages */}
      {logs.map((log) => {
        const checklist = log.checklist_data || {};
        const equipment = log.equipments;
        const checkedItems = Object.entries(checklist).filter(([_, item]: [string, any]) => {
          return typeof item === 'boolean' ? item : item?.checked;
        });

        return (
          <div key={log.id} data-page="log" className="pdf-page">
            <div className="pdf-inner">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{equipment?.name || 'Equipamento'}</h3>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">TAG: {equipment?.tag || 'S/N'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(log.performed_at).toLocaleDateString('pt-BR')} {new Date(log.performed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-0.5 w-5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Itens Verificados</span>
                </div>
                <div className="space-y-1.5">
                  {checkedItems.map(([id, item]: [string, any]) => {
                    const label = CHECKLIST_LABELS[id] || item?.label || id;
                    const photoUrl = typeof item === 'object' ? item?.photo_url : null;
                    const caption = typeof item === 'object' ? item?.caption : null;

                    return (
                      <div key={id} className="checklist-item p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '13px' }}>check_circle</span>
                          <span className="text-[11px] font-semibold text-slate-800 leading-tight">{label}</span>
                        </div>
                        {photoUrl && (
                          <div className="mt-2 flex flex-col items-center">
                            <div className="w-full max-w-md rounded overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={photoUrl} alt="" className="w-full object-contain" style={{ maxHeight: '280px' }} />
                            </div>
                            {caption && <p className="text-[8px] text-slate-500 italic mt-1 text-center">{caption}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Notes + Signature */}
              <div className="flex items-end justify-between gap-4 pt-4 mt-4 border-t border-slate-200">
                {log.notes && (
                  <div className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 leading-relaxed italic max-w-xs">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Observações</span>
                    {log.notes}
                  </div>
                )}
                <div className="w-44 text-center border-t border-slate-300 pt-2 shrink-0">
                  <p className="text-[11px] font-bold text-slate-900">{log.technician_name || 'Equipe Técnica Fixar'}</p>
                  {log.technician_document && (
                    <p className="text-[8px] text-slate-500">{log.technician_document}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ConsolidatedReportModal({ isOpen, onClose, logs, contract, organizationId }: ConsolidatedReportModalProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(1);
  const [orgName, setOrgName] = useState<string>('FiXAr');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogo();
    }
  }, [isOpen]);

  const fetchLogo = async () => {
    if (!organizationId) return;
    const { data } = await supabase.from('organizations').select('name, logo_url, report_logo_url, report_logo_size').eq('id', organizationId).single();
    if (data) {
      setOrgName(data.name || 'FiXAr');
      setLogoUrl(data.report_logo_url || data.logo_url);
      setLogoScale(data.report_logo_size ? data.report_logo_size / 100 : 1);
    }
  };

  if (!isOpen || !logs || logs.length === 0) return null;

  const handleExportPDF = async () => {
    if (!printContainerRef.current) return;
    setGenerating(true);
    setProgress('Preparando relatório...');

    // === FALLBACK: Se algo quebrar, substitua TODO o try/catch
    // por esta versão simples (sem paginação inteligente de itens):
    //
    // const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    //   import('html2canvas'),
    //   import('jspdf'),
    // ]);
    // const container = printContainerRef.current;
    // const pages = container.querySelectorAll('[data-page]');
    // const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    // const pdfWidth = pdf.internal.pageSize.getWidth();
    // for (let i = 0; i < pages.length; i++) {
    //   if (i > 0) pdf.addPage();
    //   const canvas = await html2canvas(pages[i] as HTMLElement, {
    //     // @ts-ignore
    //     scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
    //   });
    //   const imgData = canvas.toDataURL('image/jpeg', 0.95);
    //   const ratio = pdfWidth / canvas.width;
    //   pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, canvas.height * ratio);
    // }
    // pdf.save('Relatorio.pdf');
    // ==========================================================

    try {
      // Dynamically import html2canvas
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const container = printContainerRef.current;
      const pages = container.querySelectorAll('[data-page]');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        setProgress(`Gerando página ${i + 1} de ${pages.length}...`);

        const page = pages[i] as HTMLElement;

        // Measure all checklist items
        const items = Array.from(page.querySelectorAll('.checklist-item'));
        const itemHeights: number[] = [];
        items.forEach((item) => {
          const h = item.getBoundingClientRect().height;
          itemHeights.push(h);
        });

        // Estimate header height (title, equipment info, section label)
        const headerEstimate = 160;
        // Estimate footer height (notes + signature)
        const footerEstimate = 120;
        // Available height per page
        const availableHeight = (pdfHeight / 25.4) * 96; // px at 96dpi

        // Group items by page
        const pagesGroups: { startIdx: number; endIdx: number }[] = [];
        let currentY = headerEstimate;
        let pageStart = 0;

        for (let idx = 0; idx < itemHeights.length; idx++) {
          const itemH = itemHeights[idx];
          if (currentY + itemH > availableHeight - footerEstimate) {
            if (idx > pageStart) {
              pagesGroups.push({ startIdx: pageStart, endIdx: idx });
              pageStart = idx;
              currentY = headerEstimate;
            }
          }
          currentY += itemH + 6; // 6px gap between items
        }
        if (pageStart < itemHeights.length) {
          pagesGroups.push({ startIdx: pageStart, endIdx: itemHeights.length });
        }

        // If no items or fits in one page
        if (pagesGroups.length === 0) {
          pagesGroups.push({ startIdx: 0, endIdx: 0 });
        }

        const totalGroups = pagesGroups.length;

        // For each logical page, clone the page and render only the items for that page
        for (let pg = 0; pg < totalGroups; pg++) {
          if (i > 0 || pg > 0) pdf.addPage();

          const { startIdx, endIdx } = pagesGroups[pg];
          const isLastGroup = pg === totalGroups - 1;

          // Clone the page container
          const pageClone = page.cloneNode(true) as HTMLElement;
          pageClone.style.cssText = `
            width: 794px;
            min-height: 1123px;
            background: white;
            padding: 30px 50px;
            box-sizing: border-box;
            font-family: inherit;
          `;

          // Hide all items first, then show only the ones for this page
          const allItems = pageClone.querySelectorAll('.checklist-item');
          allItems.forEach((item, idx) => {
            if (idx < startIdx || idx >= endIdx) {
              (item as HTMLElement).style.display = 'none';
            }
          });

          // Only show notes/signature on the LAST group of this equipment
          const footer = pageClone.querySelector('.flex.items-end.justify-between');
          if (footer) {
            (footer as HTMLElement).style.display = isLastGroup ? '' : 'none';
          }

          document.body.appendChild(pageClone);

          const canvas = await html2canvas(pageClone, {
            // @ts-ignore
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          });

          document.body.removeChild(pageClone);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const ratio = pdfWidth / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, canvas.height * ratio);
        }
      }

      const fileName = `Relatorio_Consolidado_${contract?.name?.replace(/\s+/g, '_') || 'Manutencao'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      setProgress('');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setProgress('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* PDF Content — rendered in body, off-screen but fully visible to browser */}
      {typeof document !== 'undefined' && createPortal(
        <div className="pdf-report-container">
          <PdfReportContent
            logs={logs}
            contract={contract}
            logoUrl={logoUrl}
            logoScale={logoScale}
            orgName={orgName}
            containerRef={printContainerRef}
          />
        </div>,
        document.body
      )}

      {/* Dark-themed modal for screen viewing */}
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
        <div className="bg-navy-900 border border-slate-800 rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in">
          {/* UI Header */}
          <div className="p-8 border-b border-slate-800/50 flex items-center justify-between gap-6 bg-navy-950/50">
            <div className="flex items-center gap-4 text-left">
              <div className="h-14 w-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Relatório Consolidado</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {contract?.name} • {logs.length} Equipamento(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                disabled={generating}
                className="px-8 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    {progress || 'Gerando...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">download</span>
                    Baixar PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="h-14 w-14 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all bg-navy-900 border border-slate-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-16">
            {/* Cover Page */}
            <div className="bg-navy-950/30 border border-slate-800/30 rounded-[32px] p-12 space-y-12 flex flex-col">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Relatório Técnico</span>
                  <h1 className="text-5xl font-black text-white tracking-tighter">Consolidado de Manutenção</h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest italic">{contract?.name}</p>
                </div>
                <div className="flex flex-col items-end">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ height: `${60 * logoScale}px` }} />
                  ) : (
                    <span className="text-white text-4xl font-black italic uppercase tracking-tight text-right">{orgName}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cliente</label>
                    <p className="text-xl font-bold text-white">{contract?.client?.full_name || 'Cliente'}</p>
                    {contract?.client?.document && (
                      <p className="text-sm text-slate-500 mt-1">{contract.client.document}</p>
                    )}
                    {contract?.client?.whatsapp && (
                      <p className="text-sm text-slate-500 mt-1">WhatsApp: {contract.client.whatsapp}</p>
                    )}
                  </div>
                  {(contract?.client?.street || contract?.client?.city) && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Endereço</label>
                      <p className="text-sm text-slate-400 mt-1">
                        {[contract.client.street, contract.client.number, contract.client.neighborhood, contract.client.city, contract.client.state].filter(Boolean).join(', ')}
                        {contract.client.cep && ` - CEP: ${contract.client.cep}`}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tipo de Contrato</label>
                    <p className="text-xl font-bold text-white">{contract?.type}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Periodicidade</label>
                      <p className="text-lg font-bold text-white">{PERIODICITY_LABELS[contract?.periodicity] || contract?.periodicity}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Equipamentos no Relatório</label>
                      <p className="text-lg font-bold text-white">{logs.length}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Data de Geração</label>
                    <p className="text-lg font-bold text-white">
                      {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {contract?.start_date && contract?.duration_months && (() => {
                    const startDate = new Date(contract.start_date);
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + (contract.duration_months || 12));
                    return (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Vigência do Contrato</label>
                        <p className="text-lg font-bold text-white">
                          {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-auto">
                <div className="p-8 rounded-3xl bg-primary-500/5 border border-primary-500/10">
                  <p className="text-sm text-slate-400 leading-relaxed italic text-center">
                    Este documento consolida os registros de manutenção preventiva realizados conforme cronograma contratual.
                    As inspeções seguem as normas técnicas de qualidade e segurança estabelecidas pela <span className="font-bold uppercase tracking-tight">{orgName}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Log Pages */}
            {logs.map((log) => {
              const checklist = log.checklist_data || {};
              const equipment = log.equipments;
              const checkedItems = Object.entries(checklist).filter(([_, item]: [string, any]) => {
                return typeof item === 'boolean' ? item : item?.checked;
              });

              return (
                <div key={log.id} className="bg-navy-950/30 border border-slate-800/30 rounded-[32px] p-8 space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">verified</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Relatório de Manutenção</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          {equipment ? `${equipment.name} • TAG: ${equipment.tag || 'S/N'}` : 'Detalhes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Realizado em {new Date(log.performed_at).toLocaleDateString('pt-BR')} às {new Date(log.performed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ITENS VERIFICADOS</h4>
                    </div>
                    <div className="space-y-3">
                      {checkedItems.map(([id, item]: [string, any]) => {
                        const label = CHECKLIST_LABELS[id] || item?.label || id;
                        const photoUrl = typeof item === 'object' ? item?.photo_url : null;
                        const caption = typeof item === 'object' ? item?.caption : null;

                        return (
                          <div key={id} className="flex flex-col gap-3 p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span>
                              <span className="text-sm font-bold leading-tight text-white">{label}</span>
                            </div>
                            {photoUrl && (
                              <div className="mt-2 space-y-2">
                                <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-navy-950">
                                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                                {caption && (
                                  <p className="text-[11px] text-slate-400 font-medium italic">{caption}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer: Notes + Signature */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-end justify-between gap-6">
                    {log.notes && (
                      <div className="flex-1 p-4 rounded-2xl bg-navy-900 border border-slate-800 text-slate-400 text-xs leading-relaxed italic max-w-md">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Observações</span>
                        {log.notes}
                      </div>
                    )}
                    <div className="w-64 text-center border-t border-slate-800 pt-3 shrink-0">
                      <p className="text-sm font-bold text-white">{log.technician_name || 'Equipe Técnica Fixar'}</p>
                      {log.technician_document && (
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{log.technician_document}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
