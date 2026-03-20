import React from 'react';
import { getOrderDetails } from '@/app/actions/orders';
import { supabase } from '@/lib/supabase';
import { Manrope, Work_Sans } from 'next/font/google';
import Image from 'next/image';

const manrope = Manrope({ 
    subsets: ['latin'], 
    weight: ['400', '700', '800'],
    variable: '--font-manrope' 
});

const workSans = Work_Sans({ 
    subsets: ['latin'], 
    weight: ['300', '400', '500', '600'],
    variable: '--font-work-sans' 
});

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
    const order = await getOrderDetails(params.id);
    const { data: config } = await supabase.from('site_config').select('logo_url').eq('id', 1).single();

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface text-on-surface">
                <p className="text-xl font-headline font-bold">Pedido não encontrado.</p>
            </div>
        );
    }

    const totalServices = order.services?.reduce((acc: number, s: any) => acc + (parseFloat(s.price) * (parseFloat(s.quantity) || 1)), 0) || 0;
    const totalParts = order.parts?.reduce((acc: number, p: any) => acc + (parseFloat(p.price) * (parseFloat(p.quantity) || 1)), 0) || 0;
    const totalGlobal = totalServices + totalParts;

    const formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className={`${manrope.variable} ${workSans.variable} font-body bg-surface text-on-surface selection:bg-primary-fixed flex flex-col items-center min-h-screen`}>
            <style dangerouslySetInnerHTML={{ __html: `
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    vertical-align: middle;
                }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print-container { 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        margin: 0 !important; 
                        padding: 10mm 15mm !important; 
                        box-shadow: none !important;
                        border: none !important;
                    }
                    main { margin: 0 !important; }
                }
                .frost-gradient {
                    background: linear-gradient(135deg, #001a40 0%, #003f87 100%);
                }
                .a4-container {
                    width: 210mm;
                    height: 297mm;
                    box-sizing: border-box;
                }
            `}} />

            {/* TopAppBar (Web only) */}
            <header className="bg-surface w-full pt-4 pb-2 no-print shadow-sm flex justify-center">
                <div className="flex justify-between items-center w-full max-w-[210mm] px-4">
                    <div className="flex items-center gap-4">
                        <span className="font-headline font-bold text-lg text-[#001a40]">Orçamento #{order.name.replace('Pedido ', '')}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => window.print()}
                                className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                                title="Imprimir"
                            >
                                <span className="material-symbols-outlined">print</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main A4 Document */}
            <main className="a4-container mx-auto my-4 bg-surface-container-lowest p-[10mm_15mm] print-container relative shadow-xl rounded-sm overflow-hidden flex flex-col">
                <div>
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            {config?.logo_url ? (
                                <img 
                                    src={config.logo_url} 
                                    alt="Fixar Logo" 
                                    className="h-14 w-auto object-contain"
                                    style={{ filter: 'brightness(0) saturate(100%) invert(8%) sepia(35%) saturate(5437%) hue-rotate(203deg) brightness(92%) contrast(107%)' }}
                                />
                            ) : (
                                <div className="text-2xl font-black text-primary italic">FiXAr</div>
                            )}
                            <div className="text-[0.6rem] font-label uppercase tracking-[0.2em] text-on-surface-variant mt-1">Refrigeração de Precisão</div>
                        </div>
                        <div className="text-right">
                            <div className="bg-surface-container-highest px-4 py-2 rounded-lg">
                                <span className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">Orçamento Nº</span>
                                <span className="text-xl font-headline font-bold text-[#001a40]">#{order.name.replace('Pedido ', '')}</span>
                            </div>
                            <div className="mt-2 text-on-surface-variant text-[0.75rem] font-body">
                                Data: {formattedDate}
                            </div>
                        </div>
                    </div>

                    {/* Client/Order Photo Section */}
                    <div className="grid grid-cols-12 gap-6 mb-8 items-center bg-surface-container-low p-5 rounded-xl">
                        <div className="col-span-3 flex justify-center">
                            <div className="w-24 h-24 rounded-full border-2 border-surface-container-lowest overflow-hidden shadow-sm bg-surface-container-high flex items-center justify-center">
                                {order.image_url ? (
                                    <img 
                                        src={order.image_url} 
                                        alt="Foto do Pedido" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">image</span>
                                )}
                            </div>
                        </div>
                        <div className="col-span-9 grid grid-cols-2 gap-y-3">
                            <div>
                                <label className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">Cliente</label>
                                <span className="text-base font-headline font-bold text-on-surface">{order.client?.full_name}</span>
                            </div>
                            <div>
                                <label className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">WhatsApp</label>
                                <span className="text-base font-body font-medium text-on-surface">{order.client?.whatsapp}</span>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">Endereço de Serviço</label>
                                <span className="text-sm font-body text-on-surface">
                                    {order.client?.street}, {order.client?.number} {order.client?.complement && `- ${order.client.complement}`}
                                    <br />
                                    {order.client?.neighborhood} - {order.client?.city}/{order.client?.state} - CEP: {order.client?.cep}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Services Section */}
                    {order.services && order.services.length > 0 && (
                        <section className="mb-8">
                            <h2 className="font-headline font-bold text-lg text-[#001a40] mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">ac_unit</span>
                                Serviços Prestados
                            </h2>
                            <div className="space-y-1">
                                <div className="grid grid-cols-12 px-4 py-2 bg-surface-container-high rounded-t-lg">
                                    <div className="col-span-8 text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Descrição do Serviço</div>
                                    <div className="col-span-1 text-center text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Qtd</div>
                                    <div className="col-span-3 text-right text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Valor (R$)</div>
                                </div>
                                {order.services.map((s: any, idx: number) => (
                                    <div key={idx} className={`grid grid-cols-12 px-4 py-3 rounded-sm items-center ${idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-high'}`}>
                                        <div className="col-span-8">
                                            <span className="text-sm font-headline font-bold text-on-surface">{s.name}</span>
                                            {s.description && <p className="text-[0.7rem] text-on-surface-variant">{s.description}</p>}
                                        </div>
                                        <div className="col-span-1 text-center text-sm font-body text-on-surface">{s.quantity?.toString().padStart(2, '0') || '01'}</div>
                                        <div className="col-span-3 text-right font-headline font-bold text-base text-[#001a40]">
                                            {(s.price * (s.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Parts Section */}
                    {order.parts && order.parts.length > 0 && (
                        <section className="mb-8">
                            <h2 className="font-headline font-bold text-lg text-[#001a40] mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">settings</span>
                                Peças Selecionadas
                            </h2>
                            <div className="space-y-1">
                                <div className="grid grid-cols-12 px-4 py-2 bg-surface-container-high rounded-t-lg">
                                    <div className="col-span-8 text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Componente / Referência</div>
                                    <div className="col-span-1 text-center text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Qtd</div>
                                    <div className="col-span-3 text-right text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Valor (R$)</div>
                                </div>
                                {order.parts.map((p: any, idx: number) => (
                                    <div key={idx} className={`grid grid-cols-12 px-4 py-2 rounded-sm items-center ${idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-high'}`}>
                                        <div className="col-span-8">
                                            <span className="text-sm font-headline font-bold text-on-surface">{p.name}</span>
                                            {p.description && <p className="text-[0.65rem] font-label text-on-surface-variant">Ref: {p.description}</p>}
                                        </div>
                                        <div className="col-span-1 text-center text-sm font-body text-on-surface">{p.quantity?.toString().padStart(2, '0') || '01'}</div>
                                        <div className="col-span-3 text-right font-headline font-bold text-base text-[#001a40]">
                                            {(p.price * (p.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Payment and Summary */}
                    <div className="grid grid-cols-12 gap-6 mb-8">
                        <div className="col-span-7 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                            <h3 className="text-sm font-headline font-bold text-on-surface mb-4 uppercase tracking-tighter">Meios de Pagamento</h3>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant/15">
                                    <span className="material-symbols-outlined text-primary text-base">qr_code_2</span>
                                    <span className="text-[0.75rem] font-medium">PIX</span>
                                </div>
                                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant/15">
                                    <span className="material-symbols-outlined text-primary text-base">credit_card</span>
                                    <span className="text-[0.75rem] font-medium">Cartão</span>
                                </div>
                                <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg border border-outline-variant/15">
                                    <span className="material-symbols-outlined text-primary text-base">payments</span>
                                    <span className="text-[0.75rem] font-medium">Boleto</span>
                                </div>
                            </div>
                            <p className="mt-6 text-[0.65rem] text-on-surface-variant italic leading-tight">
                                Validade do orçamento: {order.validity_days || 7} dias úteis a partir da data de emissão.
                            </p>
                        </div>
                        <div className="col-span-5 frost-gradient p-6 rounded-xl flex flex-col justify-center text-on-primary shadow-lg">
                            <span className="text-[0.7rem] font-label uppercase tracking-widest opacity-80 mb-1">Total do Investimento</span>
                            <div className="text-3xl font-headline font-extrabold leading-tight">
                                R$ {totalGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer & Signature Section */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end border-t border-outline-variant/30 pt-8 mt-8">
                        <div className="max-w-[60%]">
                            <div className="font-headline font-bold text-on-surface text-base">Fixar Refrigeração</div>
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">call</span> (11) 99999-9999
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">mail</span> contato@fixar.com.br
                                </div>
                                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">corporate_fare</span> CNPJ: 00.000.000/0001-00
                                </div>
                            </div>
                        </div>
                        <div className="w-56 text-center pb-2">
                            <div className="h-px w-full bg-outline-variant/50 mb-3"></div>
                            <span className="block font-headline font-bold text-on-surface text-base">Equipe Técnica Fixar</span>
                            <span className="block text-[0.7rem] font-label uppercase tracking-wider text-on-surface-variant">Responsável</span>
                        </div>
                    </div>
                    <p className="text-center text-[0.6rem] uppercase tracking-[0.2em] text-on-surface-variant/40 mt-10 no-print">
                        © {new Date().getFullYear()} Fixar Refrigeration Services. Todos os direitos reservados.
                    </p>
                </div>
            </main>
            
            <div className="h-12 no-print"></div>
        </div>
    );
}
