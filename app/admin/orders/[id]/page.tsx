'use client';

import React, { useState, useEffect, use } from 'react';
import { getOrderDetails, adminUpdateOrder, adminUpdateOrderStatus } from '@/app/actions/orders';
import { supabase } from '@/lib/supabase';
import { Manrope, Work_Sans } from 'next/font/google';
import OrderForm from '@/components/OrderForm';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

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

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [availableContacts, setAvailableContacts] = useState<any[]>([]);


    useEffect(() => {
        const isEdit = typeof window !== 'undefined' && window.location.search.includes('edit=true');
        if (isEdit) setIsEditing(true);
        loadData();
    }, [id]);

    const openShareModal = () => {
        if (!order) return;
        const contacts = [];

        // Primary WhatsApp
        if (order.client?.whatsapp) {
            contacts.push({
                id: 'primary',
                name: order.client.full_name,
                role: 'Principal',
                number: order.client.whatsapp,
                selected: true
            });
        }

        // Additional Contacts
        if (Array.isArray(order.client?.contacts)) {
            order.client.contacts.forEach((c: any, index: number) => {
                if (c.number) {
                    contacts.push({
                        id: `contact-${index}`,
                        name: c.name || `Contato ${index + 1}`,
                        role: c.role || c.department || 'Adicional',
                        number: c.number,
                        selected: false
                    });
                }
            });
        }

        setAvailableContacts(contacts);
        setIsShareModalOpen(true);
    };

    const generatePDF = async (shouldDownload = true) => {
        const element = document.getElementById('budget-document');
        if (!element || !(window as any).html2pdf) return;

        const opt = {
            margin: 0,
            filename: `Orc_${(order.client?.full_name || 'Cliente').trim().split(' ')[0]}_${order.name.replace('Pedido ', '')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true, 
                backgroundColor: '#ffffff',
                usePrintMedia: true,
                width: 794,
                height: 1122,
                onclone: (clonedDoc: any) => {
                    const budget = clonedDoc.getElementById('budget-document');
                    if (budget) {
                        budget.style.height = '297mm';
                        budget.style.maxHeight = '297mm';
                        budget.style.overflow = 'hidden';
                        budget.style.boxSizing = 'border-box';
                    }
                    if (clonedDoc.documentElement) {
                        clonedDoc.documentElement.style.height = '297mm';
                        clonedDoc.documentElement.style.overflow = 'hidden';
                    }
                    if (clonedDoc.body) {
                        clonedDoc.body.style.margin = '0';
                        clonedDoc.body.style.padding = '0';
                        clonedDoc.body.style.height = '297mm';
                        clonedDoc.body.style.overflow = 'hidden';
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'avoid-all' }
        };

        const worker = (window as any).html2pdf().set(opt).from(element);
        
        if (shouldDownload) {
            return worker.save();
        } else {
            return worker.output('blob');
        }
    };

    const handleSendWhatsApp = async () => {
        const selectedContacts = availableContacts.filter(c => c.selected);
        if (selectedContacts.length === 0) {
            showToast('Selecione pelo menos um contato', 'error');
            return;
        }

        setSaving(true);
        try {
            // Inform the user we are generating the PDF
            // Try Web Share API for direct file sending
            const pdfBlob = await generatePDF(false);
            const fileName = `Orcamento_${order.name.replace('Pedido ', '')}.pdf`;
            const file = new File([pdfBlob as Blob], fileName, { type: 'application/pdf' });

            const message = `Olá! Acabei de gerar o seu orçamento da Fixar Refrigeração em PDF. 
            
*Orçamento:* #${order.name.replace('Pedido ', '')}
*Valor Total:* R$ ${totalGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Ficamos à disposição!`;

            // Just download the file (user's request for manual attach)
            showToast('Baixando PDF para o seu dispositivo...', 'success');
            await generatePDF(true); // Triggers browser download

            // Open WhatsApp conversation for each selected contact
            selectedContacts.forEach(contact => {
                const encodedMessage = encodeURIComponent(message);
                const cleanNumber = contact.number.replace(/\D/g, '');
                // Always use country code 55 for Brazil if not present
                const fullNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
                const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            });

            setIsShareModalOpen(false);
            showToast('Conversas abertas! Anexe o PDF baixado.');
        } catch (err) {
            console.error('Error generating PDF:', err);
            showToast('Erro ao gerar PDF', 'error');
        } finally {
            setSaving(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            console.log('Carregando pedido com ID:', id);
            const orderData = await getOrderDetails(id);
            console.log('Resultado getOrderDetails:', orderData);
            if (!orderData) {
                console.error('Pedido não retornado pelo getOrderDetails');
            }
            setOrder(orderData);
            
            // Set config from order's organization
            if (orderData?.organization) {
                setConfig(orderData.organization);
            }
        } catch (err: any) {
            console.error('Error loading order:', err);
            showToast('Erro ao carregar dados: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveOrder = async (formData: any, services: any[], parts: any[]) => {
        setSaving(true);
        try {
            await adminUpdateOrder(id, formData, services, parts);
            showToast('Pedido atualizado com sucesso!');
            setIsEditing(false);
            // Clean the URL if it had ?edit=true
            router.replace(`/admin/orders/${id}`);
            loadData();
        } catch (err: any) {
            showToast('Erro ao salvar: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            await adminUpdateOrderStatus(id, newStatus);
            showToast('Status atualizado!');
            loadData();
        } catch (err: any) {
            showToast('Erro ao atualizar status: ' + err.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-navy-950 text-white">
                <div className="h-12 w-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950 text-white gap-4">
                <p className="text-xl font-bold">Pedido não encontrado.</p>
                <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-white/5 border border-slate-800 rounded-xl">Voltar ao Painel</button>
            </div>
        );
    }

    const servicesList = order.services || order.order_services || [];
    const partsList = order.parts || order.order_parts || [];

    const totalServices = servicesList.reduce((acc: number, s: any) => {
        const p = parseFloat(s.price);
        const q = parseFloat(s.quantity) || 1;
        return acc + (isNaN(p) ? 0 : p * q);
    }, 0);

    const totalParts = partsList.reduce((acc: number, p: any) => {
        const pr = parseFloat(p.price);
        const q = parseFloat(p.quantity) || 1;
        return acc + (isNaN(pr) ? 0 : pr * q);
    }, 0);

    const totalGlobal = totalServices + totalParts;

    const formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const statusOptions = [
        { id: 'pending', label: '⏳ Pendente', color: 'text-amber-500' },
        { id: 'approved', label: '✅ Aprovado', color: 'text-blue-500' },
        { id: 'completed', label: '🏁 Concluído', color: 'text-emerald-500' },
        { id: 'cancelled', label: '❌ Cancelado', color: 'text-red-500' }
    ];

    return (
        <div className={`${manrope.variable} ${workSans.variable} font-body bg-surface text-on-surface selection:bg-primary-fixed flex flex-col items-center min-h-screen pb-12`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    vertical-align: middle;
                }
                @page {
                    size: A4;
                    margin: 0;
                }
                @media print {
                    .no-print { display: none !important; }
                    html, body { 
                        height: 297mm !important; 
                        width: 210mm !important;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        overflow: hidden !important;
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        background: white !important;
                    }
                    .print-container { 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        margin: 0 !important; 
                        padding: 4mm 15mm 15mm 15mm !important; 
                        box-shadow: none !important;
                        border: none !important;
                        position: relative !important;
                        display: flex !important;
                        flex-direction: column !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                        page-break-after: avoid;
                        background: white !important;
                    }
                    main { 
                        margin: 0 !important; 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        overflow: hidden !important; 
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        page-break-after: avoid;
                        background: white !important;
                    }
                    .frost-gradient { background: #003f87 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
                }
                .frost-gradient {
                    background: linear-gradient(135deg, #003f87 0%, #0056b3 100%);
                }
                .a4-container {
                    width: 100%;
                    max-width: 210mm;
                    min-height: 297mm;
                    height: auto;
                    box-sizing: border-box;
                    position: relative;
                }
            `}} />

            {/* Toast Notifications */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl animate-slide-in flex items-center gap-3 backdrop-blur-md border ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-emerald-500/90 border-emerald-400 text-white'
                    }`}>
                    <span className="material-symbols-outlined">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                </div>
            )}

            {/* Header (Web only) */}
            <header className="bg-[#001229] w-full px-4 md:px-8 py-3 md:py-4 no-print shadow-2xl sticky top-0 z-[100] flex justify-center border-b border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl gap-4 md:gap-8">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/admin')}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 border border-white/10"
                                title="Voltar"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </button>
                            <div>
                                <span className="block text-[10px] uppercase font-black tracking-[0.2em] text-white/40">Gestão de Orçamento</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-headline font-black text-lg md:text-2xl text-white leading-tight">#{order.name.replace('Pedido ', '')}</span>
                                    <span className="hidden md:inline px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-[10px] font-black text-primary-light uppercase tracking-wider">A4 VIEW</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile Status Picker */}
                        <div className="md:hidden">
                            <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                className={`appearance-none bg-[#1a2d44] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/50 transition-all ${statusOptions.find(o => o.id === order.status)?.color || 'text-slate-400'}`}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.id} value={opt.id} className="bg-[#001229] text-white">{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                        {/* Status Select */}
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-inner">
                            <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Status:</span>
                            <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                className={`bg-transparent text-[10px] md:text-xs font-black uppercase tracking-widest outline-none cursor-pointer ${statusOptions.find(o => o.id === order.status)?.color || 'text-slate-400'}`}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.id} value={opt.id} className="bg-[#001229] text-white">{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 flex-1 md:flex-none">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`h-10 md:h-12 px-4 md:px-6 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 flex-1 md:flex-none shadow-lg ${isEditing
                                    ? 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                                    : 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{isEditing ? 'close' : 'edit_square'}</span>
                                {isEditing ? 'Cancelar' : 'Editar'}
                            </button>

                            <button
                                onClick={openShareModal}
                                className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                                title="Compartilhar WhatsApp"
                            >
                                <span className="material-symbols-outlined text-xl">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isEditing ? (
                <div className="w-full max-w-6xl mt-8 px-6 no-print">
                    <div className="bg-navy-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-12">
                        <OrderForm
                            initialData={order}
                            onSubmit={handleSaveOrder}
                            onCancel={() => setIsEditing(false)}
                            loading={saving}
                        />
                    </div>
                </div>
            ) : (
                <div className="w-full overflow-x-auto pb-12 pt-4 px-4 flex flex-col items-center scrollbar-hide">
                    {/* Mobile Hint */}
                    <div className="md:hidden flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-4 bg-surface-container-high px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-sm">swipe_left</span>
                        Arraste para o lado para ver o documento
                    </div>
                    
                    <main id="budget-document" className="a4-container mx-auto bg-surface-container-lowest p-[4mm_15mm_15mm_15mm] print-container relative shadow-2xl rounded-sm overflow-hidden flex flex-col border border-outline-variant/5">
                    <div className="flex-1">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-2 page-break-avoid">
                            <div className="space-y-1">
                                {config?.report_logo_url || config?.logo_url ? (
                                    <img
                                        src={config.report_logo_url || config.logo_url}
                                        alt="Logo Fixar"
                                        className="w-auto object-contain transition-all origin-left"
                                        style={{ height: `${48 * (config?.report_logo_size ? config.report_logo_size / 100 : 1)}px` }}
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">ac_unit</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="bg-surface-container-highest px-4 py-2 rounded-lg">
                                    <span className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">Orçamento Nº</span>
                                    <span className="text-xl font-headline font-bold text-[#001a40]">#{order.name.replace('Pedido ', '')}</span>
                                </div>
                                <div className="mt-2 text-on-surface-variant text-[0.7rem] md:text-[0.85rem] font-body">
                                    Data: {formattedDate}
                                </div>
                            </div>
                        </div>

                        {/* Client/Order Photo Section */}
                        <div className="grid grid-cols-12 gap-4 mb-1 items-center bg-surface-container-low p-2 rounded-xl border border-outline-variant/5 page-break-avoid">
                            <div className="col-span-3 flex justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-surface-container-lowest overflow-hidden shadow-sm bg-surface-container-high flex items-center justify-center">
                                    {order.client?.avatar_url ? (
                                        <img
                                            src={order.client.avatar_url}
                                            alt="Avatar do Cliente"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-4xl">person</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-9 grid grid-cols-2 gap-y-3">
                                <div>
                                    <label className="block text-[0.6rem] md:text-[0.7rem] font-label uppercase tracking-wider text-on-surface-variant">Cliente</label>
                                    <span className="text-base md:text-lg font-headline font-bold text-on-surface leading-tight">{order.client?.full_name}</span>
                                </div>
                                <div>
                                    <label className="block text-[0.6rem] md:text-[0.7rem] font-label uppercase tracking-wider text-on-surface-variant">WhatsApp</label>
                                    <span className="text-sm md:text-base font-body font-medium text-on-surface">{order.client?.whatsapp}</span>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant">CPF/CNPJ</label>
                                    <span className="text-sm font-body font-medium text-on-surface">{order.client?.document || 'Não informado'}</span>
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
                        {servicesList.length > 0 && (
                            <section className="mb-4 page-break-avoid">
                                <h2 className="font-headline font-bold text-base text-[#001a40] mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">ac_unit</span>
                                    Serviços Prestados
                                </h2>
                                <div className="space-y-1">
                                    <div className="grid grid-cols-12 px-4 py-2 bg-surface-container-high rounded-t-xl overflow-hidden">
                                        <div className="col-span-8 text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Descrição do Serviço</div>
                                        <div className="col-span-1 text-center text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Qtd</div>
                                        <div className="col-span-3 text-right text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Valor (R$)</div>
                                    </div>
                                    {servicesList.map((s: any, idx: number) => (
                                        <div key={idx} className={`grid grid-cols-12 px-4 py-3 rounded-sm items-center page-break-avoid ${idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-high'}`}>
                                            <div className="col-span-8">
                                                <span className="text-sm md:text-base font-headline font-bold text-on-surface">{s.name}</span>
                                                {s.description && <p className="text-[0.65rem] md:text-[0.75rem] text-on-surface-variant">{s.description}</p>}
                                            </div>
                                            <div className="col-span-1 text-center text-sm md:text-base font-body text-on-surface">{s.quantity?.toString().padStart(2, '0') || '01'}</div>
                                            <div className="col-span-3 text-right font-headline font-bold text-base md:text-xl text-[#001a40]">
                                                {((parseFloat(s.price) || 0) * (parseFloat(s.quantity) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Parts Section */}
                        {partsList.length > 0 && (
                            <section className="mb-4 page-break-avoid">
                                <h2 className="font-headline font-bold text-base text-[#001a40] mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                    Peças Selecionadas
                                </h2>
                                <div className="space-y-1">
                                    <div className="grid grid-cols-12 px-4 py-2 bg-surface-container-high rounded-t-xl overflow-hidden">
                                        <div className="col-span-8 text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Componente / Referência</div>
                                        <div className="col-span-1 text-center text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Qtd</div>
                                        <div className="col-span-3 text-right text-[0.65rem] font-label uppercase tracking-wider text-on-surface-variant">Valor (R$)</div>
                                    </div>
                                    {partsList.map((p: any, idx: number) => (
                                        <div key={idx} className={`grid grid-cols-12 px-4 py-2 rounded-sm items-center page-break-avoid ${idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-high'}`}>
                                            <div className="col-span-8">
                                                <span className="text-sm md:text-base font-headline font-bold text-on-surface">{p.name}</span>
                                                {p.description && <p className="text-[0.65rem] md:text-[0.75rem] font-label text-on-surface-variant">Ref: {p.description}</p>}
                                            </div>
                                            <div className="col-span-1 text-center text-sm md:text-base font-body text-on-surface">{p.quantity?.toString().padStart(2, '0') || '01'}</div>
                                            <div className="col-span-3 text-right font-headline font-bold text-base md:text-xl text-[#001a40]">
                                                {((parseFloat(p.price) || 0) * (parseFloat(p.quantity) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Payment and Summary */}
                        {/* DICA: Para ajustar a altura manualmente, altere os valores de 'p-' (padding), 'mt-' (margin-top) e 'min-h-' (altura mínima) abaixo */}
                        <div className="flex gap-4 mt-1 md:mt-2 mb-1 page-break-avoid">
                            <div className="flex-1 bg-white p-2 md:p-3 rounded-xl md:rounded-[24px] border border-slate-200">
                                <h3 className="text-[0.6rem] font-black font-headline text-slate-900 mb-0.5 md:mb-1.5 uppercase tracking-tight md:tracking-widest">Meios de Pagamento</h3>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    <div className="flex items-center gap-1 md:gap-2 bg-slate-50 px-2 md:px-4 py-0.5 md:py-1 rounded-md md:rounded-xl border border-slate-100 md:border-slate-200">
                                        <span className="material-symbols-outlined text-primary text-sm md:text-lg">qr_code_2</span>
                                        <span className="text-[0.65rem] md:text-sm font-bold text-slate-900">PIX (CNPJ)</span>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-2 bg-slate-50 px-2 md:px-4 py-0.5 md:py-1 rounded-md md:rounded-xl border border-slate-100 md:border-slate-200">
                                        <span className="material-symbols-outlined text-primary text-sm md:text-lg">credit_card</span>
                                        <span className="text-[0.65rem] md:text-sm font-bold text-slate-900">Cartão / Débito</span>
                                    </div>
                                </div>
                                <p className="mt-0.5 md:mt-1.5 text-[0.55rem] md:text-xs text-slate-400 md:text-slate-500 italic leading-tight font-medium">
                                    Validade: {order.validity_days || 30} dias úteis.
                                </p>
                            </div>
                            <div 
                                className="w-40 md:w-52 p-2 md:p-3 flex flex-col items-center justify-center text-white text-center min-h-[50px] md:min-h-[75px] shadow-lg md:shadow-xl"
                                style={{ 
                                    background: 'linear-gradient(135deg, #003f87 0%, #0056b3 100%)',
                                    borderRadius: '16px',
                                    WebkitBorderRadius: '16px'
                                }}
                            >
                                <span className="text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-[0.2em] opacity-90 mb-0.5 md:mb-1 leading-none">Investimento Total</span>
                                <div className="text-xl md:text-2xl font-headline font-black leading-none tracking-tighter">
                                    R$ {totalGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer & Signature Section */}
                    <div className="mt-2 md:mt-8 text-on-surface page-break-avoid">
                        <div className="flex justify-between items-end border-t border-outline-variant/30 pt-2">
                            <div className="max-w-[70%]">
                                <div className="font-headline font-bold text-slate-800 text-[15px]">Fixar refrigeração</div>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-medium">
                                        <div className="w-4 h-4 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                                            <span className="material-symbols-outlined text-[10px]">call</span>
                                        </div>
                                        (43) 98805-3145
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-medium">
                                        <div className="w-4 h-4 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                                            <span className="material-symbols-outlined text-[10px]">mail</span>
                                        </div>
                                        fixar.tec@hotmail.com
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-medium">
                                        <div className="w-4 h-4 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                                            <span className="material-symbols-outlined text-[10px]">corporate_fare</span>
                                        </div>
                                        Arapongas - PR | CNPJ: 59.509.239/0001-34
                                    </div>
                                </div>
                            </div>
                            <div className="w-48 text-center pb-1">
                                <div className="h-px w-full bg-outline-variant/50 mb-2"></div>
                                <span className="block font-headline font-bold text-on-surface text-sm">Jhefesonn Mesquita</span>
                                <span className="block text-[0.6rem] font-label uppercase tracking-wider text-on-surface-variant tracking-[0.2em] mt-0.5">Responsável Técnico</span>
                            </div>
                        </div>
                        <p className="text-center text-[0.5rem] uppercase tracking-[0.3em] text-on-surface-variant/40 mt-4 no-print font-bold">
                            Emitido via Sistema FiXAr Gestão de Ordem de Serviço
                        </p>
                    </div>
                </main>
            </div>
        )}

            {/* WhatsApp Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in no-print">
                    <div className="bg-navy-900 border border-slate-800 rounded-[40px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-500">share</span>
                                Compartilhar
                            </h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">Selecione os contatos para envio:</p>

                            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                {availableContacts.map((contact, idx) => (
                                    <label key={contact.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${contact.selected ? 'bg-primary-600/10 border-primary-600/50' : 'bg-navy-950/50 border-slate-800 hover:border-slate-700'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={contact.selected}
                                            onChange={() => {
                                                const newContacts = [...availableContacts];
                                                newContacts[idx].selected = !newContacts[idx].selected;
                                                setAvailableContacts(newContacts);
                                            }}
                                            className="hidden"
                                        />
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${contact.selected ? 'bg-primary-600 text-white' : 'bg-navy-950 border border-slate-800 text-slate-600 group-hover:text-slate-400'
                                            }`}>
                                            <span className="material-symbols-outlined font-black">
                                                {contact.selected ? 'check_box' : 'check_box_outline_blank'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{contact.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black uppercase text-primary-500 tracking-widest">{contact.role}</span>
                                                <span className="text-[10px] text-slate-500">{contact.number}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
                                <button
                                    onClick={handleSendWhatsApp}
                                    className="w-full py-5 rounded-3xl bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                    Enviar Agora
                                </button>
                                <button onClick={() => setIsShareModalOpen(false)} className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
                strategy="lazyOnload"
            />
        </div>
    );
}
