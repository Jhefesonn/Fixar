'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { removeBackground } from '@imgly/background-removal';

import { supabase } from '@/lib/supabase';
import AuthProvider, { useAuth } from '@/components/AuthProvider';
import ClientsView from '@/components/ClientsView';
import EquipmentsView from '@/components/EquipmentsView';
import ServicesView from '@/components/ServicesView';
import StockView from '@/components/StockView';
import OrdersView from '@/components/OrdersView';
import ContractsView from '@/components/ContractsView';
import AgendaView from '@/components/AgendaView';
import FinancialView from '@/components/FinancialView';
import DashboardView from '@/components/DashboardView';

export default function AdminPage() {
  return (
    <AuthProvider requiredRole="admin">
      <AdminDashboard />
    </AuthProvider>
  );
}

function AdminDashboard() {
  const { signOut, profile, isProfileLoading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchConfig = async () => {
      if (!profile?.organization_id) return;
      const { data } = await supabase.from('organizations').select('logo_url').eq('id', profile.organization_id).single();
      if (data) setSiteConfig(data);
    };
    if (profile?.organization_id) fetchConfig();
  }, [profile?.organization_id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'clientes', icon: 'group', label: 'Clientes' },
    { id: 'equipamentos', icon: 'ac_unit', label: 'Equipamentos' },
    { id: 'pedidos', icon: 'receipt_long', label: 'Pedidos' },
    { id: 'contratos', icon: 'description', label: 'Contratos' },
    { id: 'agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: 'servicos', icon: 'build', label: 'Serviços' },
    { id: 'estoque', icon: 'inventory_2', label: 'Estoque' },
    { id: 'financeiro', icon: 'payments', label: 'Financeiro' },
    { id: 'site', icon: 'settings_suggest', label: 'Site' },
  ];

  const handleLogout = async () => {
    // Proper Supabase signout
    await signOut();
  };

  const getViewTitle = () => {
    if (activeView === 'profile') return 'Meu Perfil';
    if (activeView === 'settings') return 'Configurações';
    const item = navItems.find(i => i.id === activeView);
    // @ts-ignore - organizations is joined
    const orgName = profile?.organizations?.name || 'Administrador';
    return activeView === 'dashboard' ? (orgName || 'Carregando...') : `Gestão de ${item?.label || ''}`;
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside className={`sidebar-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="p-4 flex flex-col gap-4">
          {/* Navigation */}
          <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
                className={`nav-item ${activeView === item.id ? 'nav-item-active' : ''}`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="header-dashboard">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Olá, {profile?.organizations?.fantasy_name || profile?.organizations?.name || 'Bem-vindo'} 👋
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block uppercase tracking-wider">
                Veja o que está acontecendo na sua empresa hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Search bar */}
            <div className="relative hidden md:block group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] group-focus-within:text-primary-600 transition-colors">search</span>
              <input
                className="bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-600 w-72 text-white transition-all outline-none"
                placeholder="Pesquisar no sistema..."
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-primary-600 transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-accent rounded-full border-2 border-navy-950"></span>
              </button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  disabled={isProfileLoading}
                  className={`flex items-center gap-3 p-1.5 rounded-xl transition-all text-left outline-none ${isProfileLoading ? 'cursor-default' : 'hover:bg-slate-800'}`}
                >
                  <div className="h-9 w-9 rounded-full bg-navy-900 flex items-center justify-center overflow-hidden border border-slate-800 shrink-0 relative">
                    {isProfileLoading ? (
                      <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                    ) : profile?.organizations?.logo_url ? (
                      <img src={profile.organizations.logo_url} alt="" className="h-full w-full object-contain p-1 bg-white" />
                    ) : (
                      <span className="material-symbols-outlined text-accent">business</span>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col min-w-0 pr-1 gap-1">
                    {isProfileLoading ? (
                      <>
                        <div className="h-3 w-24 bg-slate-800 animate-pulse rounded" />
                        <div className="h-2 w-32 bg-slate-800/50 animate-pulse rounded" />
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold truncate leading-tight text-white">{profile?.full_name || 'Usuário'}</h3>
                        <p className="text-[11px] text-slate-400 truncate leading-tight">{profile?.email || ''}</p>
                      </>
                    )}
                  </div>
                  {!isProfileLoading && (
                    <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-navy-900 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 z-50">
                    <div className="p-2 flex flex-col gap-1">
                      <button
                        onClick={() => { setActiveView('profile'); setIsProfileOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-left w-full ${activeView === 'profile' ? 'bg-slate-800' : ''}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">person</span>
                        <span className="text-sm font-medium">Perfil</span>
                      </button>
                      <button
                        onClick={() => { setActiveView('settings'); setIsProfileOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-left w-full ${activeView === 'settings' ? 'bg-slate-800' : ''}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                        <span className="text-sm font-medium">Configurações</span>
                      </button>
                      <div className="my-1 border-t border-slate-800"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/10 text-red-500 transition-colors text-left w-full"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="text-sm font-medium">Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 sm:p-8">
          {activeView === 'profile' ? (
            <ProfileView />
          ) : activeView === 'settings' ? (
            <SettingsView />
          ) : activeView === 'clientes' ? (
            <ClientsView externalSearch={globalSearch} />
          ) : activeView === 'equipamentos' ? (
            <EquipmentsView externalSearch={globalSearch} />
          ) : activeView === 'servicos' ? (
            <ServicesView externalSearch={globalSearch} />
          ) : activeView === 'estoque' ? (
            <StockView externalSearch={globalSearch} />
          ) : activeView === 'pedidos' ? (
            <OrdersView externalSearch={globalSearch} />
          ) : activeView === 'contratos' ? (
            <ContractsView externalSearch={globalSearch} />
          ) : activeView === 'agenda' ? (
            <AgendaView />
          ) : activeView === 'dashboard' ? (
            <DashboardView userName={profile?.full_name} onNavigate={setActiveView} />
          ) : activeView === 'financeiro' ? (
            <FinancialView />
          ) : activeView === 'site' ? (
            <SiteConfig setSiteConfig={setSiteConfig} />
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-black tracking-tight">{navItems.find(i => i.id === activeView)?.label}</h1>
                <p className="text-slate-500 dark:text-slate-400">Gerenciamento do módulo de {navItems.find(i => i.id === activeView)?.label.toLowerCase()}.</p>
              </div>
              <div className="bg-navy-900 p-12 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{navItems.find(i => i.id === activeView)?.icon}</span>
                <h2 className="text-xl font-bold mb-2">Módulo em Desenvolvimento</h2>
                <p className="text-slate-500 max-w-md">Esta tela exibirá as funcionalidades completas de {navItems.find(i => i.id === activeView)?.label.toLowerCase()} em breve.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-auto px-8 pb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between bg-navy-900 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div>
                <p className="text-sm font-bold">Sistema Operacional</p>
                <p className="text-xs text-slate-500">Todos os módulos estão funcionando corretamente.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Última atualização: Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Site Configuration Component ---
function SiteConfig({ setSiteConfig }: { setSiteConfig: any }) {
  const [siteData, setSiteData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; image: string | null; aspect: number; field: string; index?: number }>({
    isOpen: false,
    image: null,
    aspect: 1,
    field: ''
  });

  useEffect(() => {
    fetchSiteData();
  }, []);

  const fetchSiteData = async () => {
    setIsLoading(true);
    try {
      const { data: config, error: configError } = await supabase
        .from('site_config')
        .select('*')
        .eq('id', 1)
        .single();

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('order', { ascending: true });

      const { data: diffData, error: diffError } = await supabase
        .from('differentiators')
        .select('*')
        .order('order', { ascending: true });

      if (configError) throw configError;
      setSiteData(config);
      setServices(servicesData || []);
      setDifferentiators(diffData || []);
    } catch (error) {
      console.error('Error fetching site data:', error);
      alert('Erro ao carregar dados do site.');
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, aspect: number, index?: number) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropModal({
          isOpen: true,
          image: reader.result as string,
          aspect,
          field,
          index
        });
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadImage = async (base64: string, path: string) => {
    const blob = await (await fetch(base64)).blob();
    const isPng = base64.startsWith('data:image/png');
    const ext = isPng ? 'png' : 'jpg';
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const fileName = `${path}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('site-assets')
      .upload(fileName, blob, { contentType, upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('site-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const onCropComplete = async (croppedImage: string) => {
    try {
      setIsSaving(true);
      if (cropModal.field === 'heroImage') {
        const publicUrl = await uploadImage(croppedImage, 'hero');
        setSiteData((prev: any) => ({ ...prev, hero_image_url: publicUrl }));
      } else if (cropModal.field === 'logoImage') {
        const publicUrl = await uploadImage(croppedImage, 'logo');
        setSiteData((prev: any) => ({ ...prev, logo_url: publicUrl }));
        // Also update the local siteConfig for the sidebar
        setSiteConfig((prev: any) => ({ ...prev, logo_url: publicUrl }));
      } else if (cropModal.field === 'serviceImage' && typeof cropModal.index === 'number') {
        const publicUrl = await uploadImage(croppedImage, `service-${cropModal.index}`);
        setServices((prev: any[]) => {
          const newServices = [...prev];
          if (newServices[cropModal.index!]) {
            newServices[cropModal.index!] = { ...newServices[cropModal.index!], image_url: publicUrl };
          }
          return newServices;
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao processar imagem.');
    } finally {
      setIsSaving(false);
      setCropModal({ ...cropModal, isOpen: false, image: null });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error: configError } = await supabase
        .from('site_config')
        .update(siteData)
        .eq('id', 1);

      if (configError) throw configError;

      // Update services
      for (const service of services) {
        await supabase
          .from('services')
          .update({
            name: service.name,
            description: service.description,
            image_url: service.image_url,
            order: service.order
          })
          .eq('id', service.id);
      }

      alert('Configurações salvas com sucesso no Supabase!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Carregando Configurações...</p>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Configurações do Site</h1>
            <p className="text-slate-400">Gerencie os conteúdos visíveis na página inicial.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined">save</span>
            )}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Texts Configuration */}
          <div className="flex flex-col gap-6">
            <div className="card-premium">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">title</span>
                Textos Principais (Hero)
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Badge da Hero</label>
                  <input
                    type="text"
                    value={siteData.hero_badge || ''}
                    onChange={(e) => setSiteData({ ...siteData, hero_badge: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Título da Hero</label>
                  <input
                    type="text"
                    value={siteData.hero_title || ''}
                    onChange={(e) => setSiteData({ ...siteData, hero_title: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Resumo da Hero</label>
                  <textarea
                    rows={4}
                    value={siteData.hero_subtitle || ''}
                    onChange={(e) => setSiteData({ ...siteData, hero_subtitle: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Texto CTA</label>
                    <input
                      type="text"
                      value={siteData.hero_cta_text || ''}
                      onChange={(e) => setSiteData({ ...siteData, hero_cta_text: e.target.value })}
                      className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Link CTA</label>
                    <input
                      type="text"
                      value={siteData.hero_cta_link || ''}
                      onChange={(e) => setSiteData({ ...siteData, hero_cta_link: e.target.value })}
                      className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">info</span>
                Seção Sobre Nós
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Título da Seção</label>
                  <input
                    type="text"
                    value={siteData.about_title || ''}
                    onChange={(e) => setSiteData({ ...siteData, about_title: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                  <textarea
                    rows={6}
                    value={siteData.about_description || ''}
                    onChange={(e) => setSiteData({ ...siteData, about_description: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">contact_support</span>
                Informações de Contato
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp (Apenas números)</label>
                  <input
                    type="text"
                    value={siteData.contato_whatsapp || ''}
                    onChange={(e) => setSiteData({ ...siteData, contato_whatsapp: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                  <input
                    type="text"
                    value={siteData.contato_email || ''}
                    onChange={(e) => setSiteData({ ...siteData, contato_email: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Endereço / Localização</label>
                  <input
                    type="text"
                    value={siteData.contato_address || ''}
                    onChange={(e) => setSiteData({ ...siteData, contato_address: e.target.value })}
                    className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-600 outline-none text-white w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assets Configuration */}
          <div className="flex flex-col gap-6">
            <div className="card-premium">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">image</span>
                Imagens e Logo
              </h3>
              <div className="flex flex-col gap-8">


                {/* Hero Image Section */}
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Imagem da Hero</label>
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-800 aspect-video bg-navy-950">
                    <img src={siteData.hero_image_url} alt="Hero Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                      <p className="text-white font-bold mb-2">Imagem da Hero (1:1)</p>
                      <label className="btn btn-primary cursor-pointer !py-2 !px-4 text-xs font-bold">
                        <span className="material-symbols-outlined mr-2 !text-[18px]">add_a_photo</span>
                        Trocar e Recortar
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'heroImage', 1)} />
                      </label>
                    </div>
                  </div>
                  <div className="p-4 bg-navy-950 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 leading-relaxed uppercase font-bold tracking-wider mb-2">Dica de Design</p>
                    <p className="text-[11px] text-slate-400">Use imagens de alta resolução com tons frios ou neutros para manter o contraste do tema escuro premium.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">grid_view</span>
                Galeria de Serviços
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {services.map((service, idx) => (
                  <div key={service.id} className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex gap-4">
                    <div className="relative h-24 w-32 rounded-lg overflow-hidden shrink-0 group">
                      <img src={service.image_url} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer">
                          <span className="material-symbols-outlined text-white text-sm">edit</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'serviceImage', 4 / 3, idx)} />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        value={service.title || ''}
                        onChange={(e) => {
                          const newServices = [...services];
                          newServices[idx].title = e.target.value;
                          setServices(newServices);
                        }}
                        className="bg-transparent border-b border-slate-800 focus:border-primary-600 outline-none text-sm font-bold text-white w-full"
                        placeholder="Título do Serviço"
                      />
                      <textarea
                        rows={2}
                        value={service.description || ''}
                        onChange={(e) => {
                          const newServices = [...services];
                          newServices[idx].description = e.target.value;
                          setServices(newServices);
                        }}
                        className="bg-transparent text-xs text-slate-400 outline-none resize-none"
                        placeholder="Descrição curta..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED POSITION ELEMENTS - Moved outside animated div */}
      {cropModal.isOpen && cropModal.image && (
        <ImageCropperModal
          image={cropModal.image}
          aspect={cropModal.aspect}
          onClose={() => setCropModal({ ...cropModal, isOpen: false, image: null })}
          onComplete={onCropComplete}
        />
      )}
    </>
  );
}

// --- Image Cropper Modal ---
interface ImageCropperModalProps {
  image: string;
  aspect: number;
  onClose: () => void;
  onComplete: (croppedImage: string) => void;
}

function ImageCropperModal({ image, aspect, onClose, onComplete }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: any) => setZoom(zoom);
  const onCropCompleteAction = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx || !croppedAreaPixels) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const isPng = image.startsWith('data:image/png');
      onComplete(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">crop</span>
            Recortar Imagem
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="relative h-[400px] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteAction}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 bg-navy-950 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-slate-500">zoom_in</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="bg-transparent border border-slate-800 text-slate-400 px-6 py-2 rounded-xl hover:bg-slate-800 transition-colors">Cancelar</button>
            <button onClick={getCroppedImg} className="bg-primary-600 text-white px-8 py-2 rounded-xl hover:bg-primary-700 transition-colors font-bold">Confirmar Recorte</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Views ---

function ProfileView() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: profile?.organizations?.name || '',
    cnpj: profile?.organizations?.cnpj || '',
    company_name: profile?.organizations?.company_name || '',
    fantasy_name: profile?.organizations?.fantasy_name || '',
    phone: profile?.organizations?.phone || '',
    email: profile?.organizations?.email || '',
    cep: profile?.organizations?.cep || '',
    street: profile?.organizations?.street || '',
    number: profile?.organizations?.number || '',
    neighborhood: profile?.organizations?.neighborhood || '',
    city: profile?.organizations?.city || '',
    state: profile?.organizations?.state || '',
    notes: profile?.organizations?.notes || '',
    plan: profile?.organizations?.plan || 'free',
    primary_color: profile?.organizations?.primary_color || '#2563eb',
    secondary_color: profile?.organizations?.secondary_color || '#1e293b',
    report_footer: profile?.organizations?.report_footer || '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.organizations?.logo_url || null);
  const [reportLogoPreview, setReportLogoPreview] = useState<string | null>(profile?.organizations?.report_logo_url || null);
  
  const [cropConfig, setCropConfig] = useState<{ isOpen: boolean; image: string | null; aspect: number; field: 'logo' | 'report_logo' }>({
    isOpen: false,
    image: null,
    aspect: 1,
    field: 'logo'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.organizations?.name || '',
        cnpj: profile.organizations?.cnpj || '',
        company_name: profile.organizations?.company_name || '',
        fantasy_name: profile.organizations?.fantasy_name || '',
        phone: profile.organizations?.phone || '',
        email: profile.organizations?.email || '',
        cep: profile.organizations?.cep || '',
        street: profile.organizations?.street || '',
        number: profile.organizations?.number || '',
        neighborhood: profile.organizations?.neighborhood || '',
        city: profile.organizations?.city || '',
        state: profile.organizations?.state || '',
        notes: profile.organizations?.notes || '',
        plan: profile.organizations?.plan || 'free',
        primary_color: profile.organizations?.primary_color || '#2563eb',
        secondary_color: profile.organizations?.secondary_color || '#1e293b',
        report_footer: profile.organizations?.report_footer || '',
      });
      setLogoPreview(profile.organizations?.logo_url || null);
      setReportLogoPreview(profile.organizations?.report_logo_url || null);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchCep = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        const data = await res.json();
        if (!data.message) {
          setFormData(prev => ({
            ...prev,
            street: data.street || prev.street,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state
          }));
        }
      } catch (err) { console.error('Erro CEP', err); }
    }
  };

  const fetchCnpj = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, '');
    if (cnpj.length === 14) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        const data = await res.json();
        if (!data.message) {
          setFormData(prev => ({
            ...prev,
            company_name: data.razao_social || prev.company_name,
            fantasy_name: data.nome_fantasia || '',
            phone: data.ddd_telefone_1 || prev.phone,
            email: data.email || prev.email,
            cep: data.cep?.toString() || prev.cep,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.municipio || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (err) { console.error('Erro CNPJ', err); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'report_logo') => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropConfig({
          isOpen: true,
          image: reader.result as string,
          aspect: field === 'logo' ? 1 : 16 / 5, 
          field
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedImage: string) => {
    if (cropConfig.field === 'logo') {
      setLogoPreview(croppedImage);
    } else {
      setReportLogoPreview(croppedImage);
    }
    setCropConfig(prev => ({ ...prev, isOpen: false, image: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      if (profile?.organization_id) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            cnpj: formData.cnpj,
            company_name: formData.company_name,
            fantasy_name: formData.fantasy_name,
            phone: formData.phone,
            email: formData.email,
            cep: formData.cep,
            street: formData.street,
            number: formData.number,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            notes: formData.notes,
            logo_url: logoPreview,
            report_logo_url: reportLogoPreview,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            report_footer: formData.report_footer,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.organization_id);

        if (orgError) throw orgError;
      }

      await refreshProfile();
      setSuccess('Dados da empresa atualizados com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-600 text-white outline-none transition-all";
  const disabledClass = "w-full bg-navy-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="animate-fade-in max-w-5xl text-white">
      <div className="mb-8 font-black flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-600 text-3xl">corporate_fare</span>
        <div>
           <h1 className="text-2xl font-black tracking-tight">Câmpus / Unidade</h1>
           <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Gerenciamento de dados corporativos e fiscais</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="material-symbols-outlined text-primary-600">business</span>
                Identificação PJ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input name="cnpj" value={formData.cnpj} onChange={handleInputChange} onBlur={fetchCnpj} className={inputClass} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                   <label className={labelClass}>Nome Fantasia</label>
                   <input name="fantasy_name" value={formData.fantasy_name} onChange={handleInputChange} className={inputClass} placeholder="Nome do seu negócio" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Razão Social</label>
                  <input name="company_name" value={formData.company_name} onChange={handleInputChange} className={inputClass} placeholder="Razão social completa" />
                </div>
              </div>
            </div>

            <div className="card-premium space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="material-symbols-outlined text-primary-600">location_on</span>
                Endereço e Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>E-mail Corporativo</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label className={labelClass}>Telefone / WhatsApp</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>CEP</label>
                  <input name="cep" value={formData.cep} onChange={handleInputChange} onBlur={fetchCep} className={inputClass} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Rua / Logradouro</label>
                  <input name="street" value={formData.street} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input name="number" value={formData.number} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} className={inputClass}>
                    <option value="">UF</option>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <option key={uf} value={uf} className="bg-navy-900">{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Removed Printing Config (moved to settings) */}
          </div>

          <div className="space-y-6">
             <div className="card-premium flex flex-col items-center">
                <h4 className="text-xs font-black uppercase text-primary-500 tracking-widest mb-4">Logo do Negócio</h4>
                <div className="relative group mb-4">
                   <div className="h-40 w-40 rounded-2xl border-4 border-slate-800 overflow-hidden bg-white flex items-center justify-center shadow-xl p-4">
                     {logoPreview ? (
                       <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                     ) : (
                       <span className="material-symbols-outlined text-6xl text-slate-300">business</span>
                     )}
                   </div>
                   <label className="absolute bottom-[-10px] right-[-10px] h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center border-4 border-navy-900 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                     <span className="material-symbols-outlined text-white">edit</span>
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                   </label>
                </div>
                <div className="text-center mt-2">
                   <p className="text-sm font-bold text-white">{formData.fantasy_name || formData.name}</p>
                   <p className="text-xs text-slate-500">{profile?.email}</p>
                </div>
             </div>

             <div className="card-premium bg-primary-600/5 border-primary-600/20">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-primary-600/10 pb-3 mb-4">
                  <span className="material-symbols-outlined text-primary-600">star</span>
                  Plano Ativo
                </h3>
                <div className="p-4 bg-navy-900 rounded-xl text-center shadow-inner">
                   <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Seu Plano Atual</p>
                   <p className="text-2xl font-black text-primary-500 uppercase tracking-tighter">{formData.plan}</p>
                </div>
                <div className="mt-4">
                   <label className={labelClass}>Gestão de Plano</label>
                   <input value={formData.plan} disabled className={disabledClass} />
                   <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">O plano atual concede acesso a todos os módulos contratados. Para upgrades, fale com o suporte.</p>
                </div>
             </div>

             <div className="sticky top-24 space-y-3 pt-4">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl italic">{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl font-bold">{success}</div>}
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20">
                  {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined">save</span>Salvar Empresa</>}
                </button>
             </div>
          </div>
        </div>
      </form>

      {cropConfig.isOpen && cropConfig.image && (
        <CropModal
          image={cropConfig.image}
          onClose={() => setCropConfig(prev => ({ ...prev, isOpen: false, image: null }))}
          onCropComplete={onCropComplete}
          aspect={cropConfig.aspect}
        />
      )}
    </div>
  );
}

function SettingsView() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    primary_color: profile?.organizations?.primary_color || '#2563eb',
    secondary_color: profile?.organizations?.secondary_color || '#1e293b',
    report_footer: profile?.organizations?.report_footer || '',
    notes: profile?.organizations?.notes || '',
  });

  // Sync general settings when profile changes
  useEffect(() => {
    if (profile?.organizations) {
      setGeneralSettings({
        primary_color: profile.organizations.primary_color || '#2563eb',
        secondary_color: profile.organizations.secondary_color || '#1e293b',
        report_footer: profile.organizations.report_footer || '',
        notes: profile.organizations.notes || '',
      });
    }
  }, [profile]);

  const handleGeneralInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveGeneralSettings = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          primary_color: generalSettings.primary_color,
          secondary_color: generalSettings.secondary_color,
          report_footer: generalSettings.report_footer,
          notes: generalSettings.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.organization_id);

      if (orgError) throw orgError;
      
      await refreshProfile();
      setSuccess('Configurações gerais atualizadas!');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  // Logo Editor State
  const [editorImage, setEditorImage] = useState<string | null>(profile?.organizations?.logo_url || null);
  const [isMonochrome, setIsMonochrome] = useState(false);
  const [monochromeColor, setMonochromeColor] = useState('#000000');
  
  // Crop Modal State
  const [cropConfig, setCropConfig] = useState<{ isOpen: boolean; image: string | null; aspect: number }>({
    isOpen: false,
    image: null,
    aspect: 1
  });

  // Logo Scale State
  // @ts-ignore
  const [logoSize, setLogoSize] = useState<number>(profile?.organizations?.logo_size ?? 100);
  // @ts-ignore
  const [reportLogoSize, setReportLogoSize] = useState<number>(profile?.organizations?.report_logo_size ?? 100);
  const [isSavingScale, setIsSavingScale] = useState(false);

  useEffect(() => {
    if (profile?.organizations) {
      // @ts-ignore
      setLogoSize(profile.organizations.logo_size ?? 100);
      // @ts-ignore
      setReportLogoSize(profile.organizations.report_logo_size ?? 100);
    }
  }, [profile]);

  // Auto-save debounced effect
  useEffect(() => {
    if (!profile?.organizations) return;
    
    // @ts-ignore
    const currentLogoSize = profile.organizations.logo_size ?? 100;
    // @ts-ignore
    const currentReportLogoSize = profile.organizations.report_logo_size ?? 100;

    if (logoSize === currentLogoSize && reportLogoSize === currentReportLogoSize) return;

    const handler = setTimeout(() => {
      saveLogoScale();
    }, 800);

    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoSize, reportLogoSize]);

  const saveLogoScale = async () => {
    if (!profile?.organization_id) return;
    setIsSavingScale(true);
    try {
      await supabase
        .from('organizations')
        .update({
          logo_size: logoSize,
          report_logo_size: reportLogoSize
        })
        .eq('id', profile.organization_id);

      await refreshProfile();
    } catch (err: any) {
      console.error('Erro ao salvar tamanhos das logos:', err);
    } finally {
      setIsSavingScale(false);
    }
  };

  // Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    if (!profile?.organization_id) return;
    setIsGalleryLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_logos')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGallery(data || []);
    } catch (err: any) {
      console.error('Erro galeria:', err);
    } finally {
      setIsGalleryLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setCropConfig({
            isOpen: true,
            image: reader.result as string,
            aspect: 0 // 0 means freeform in our updated CropModal
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemoveBackground = async () => {
    if (!editorImage) return;
    setIsRemovingBg(true);
    setError('');
    try {
      // @ts-ignore
      const blob = await removeBackground(editorImage);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditorImage(reader.result as string);
        setIsRemovingBg(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Erro na remoção de fundo:', err);
      setError('Falha ao remover fundo. Verifique sua conexão.');
      setIsRemovingBg(false);
    }
  };

  const toggleMonochrome = () => {
    if (!editorImage) return;
    setIsMonochrome(!isMonochrome);
  };

  const saveLogoToGallery = async () => {
    if (!editorImage || !profile?.organization_id) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let finalImage = editorImage;

      // Apply monochrome filter to the dataURL if active
      if (isMonochrome) {
        finalImage = await applyMonochromeToDataURL(editorImage, monochromeColor);
      }

      const { data, error: uploadError } = await supabase
        .from('organization_logos')
        .insert({
          organization_id: profile.organization_id,
          url: finalImage,
          is_active: false
        })
        .select()
        .single();

      if (uploadError) throw uploadError;
      
      setSuccess('Logo salva na galeria!');
      setIsMonochrome(false);
      fetchGallery();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar logo.');
    } finally {
      setLoading(false);
    }
  };

  const setLogoType = async (logoUrl: string, type: 'profile' | 'document') => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const updateData = type === 'profile' 
        ? { logo_url: logoUrl } 
        : { report_logo_url: logoUrl };

      if (type === 'profile') {
        await supabase
          .from('organization_logos')
          .update({ is_active: false })
          .eq('organization_id', profile.organization_id);
          
        await supabase
          .from('organization_logos')
          .update({ is_active: true })
          .eq('url', logoUrl)
          .eq('organization_id', profile.organization_id);
      }

      const { error: orgError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', profile.organization_id);

      if (orgError) throw orgError;
      
      await refreshProfile();
      if (type === 'profile') fetchGallery();
      setSuccess(type === 'profile' ? 'Foto de perfil atualizada!' : 'Logo para documentos atualizada!');
    } catch (err: any) {
      setError('Erro ao definir logo.');
    } finally {
      setLoading(false);
    }
  };

  const deleteLogo = async (logoId: string) => {
    try {
      const { error } = await supabase
        .from('organization_logos')
        .delete()
        .eq('id', logoId);
      if (error) throw error;
      fetchGallery();
    } catch (err) {
      setError('Erro ao deletar logo.');
    }
  };

  // Helper function to apply solid color via canvas
  const applyMonochromeToDataURL = (dataUrl: string, color: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        
        ctx.drawImage(img, 0, 0);
        
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'source-over';
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  };

  const onCropComplete = (croppedImage: string) => {
    setEditorImage(croppedImage);
    setCropConfig({ isOpen: false, image: null, aspect: 1 });
  };

  return (
    <div className="animate-fade-in max-w-6xl text-white pb-20">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Identidade Visual</h1>
          <p className="text-slate-500 font-medium uppercase text-xs tracking-[0.2em] mt-1">Smart Editor & Galeria de Logos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Editor Inteligente */}
        <div className="xl:col-span-7 space-y-6">
          <div className="card-premium h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
               <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary-500">auto_fix_high</span>
                 Smart Editor AI
               </h3>
               <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${editorImage ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                    {editorImage ? 'Imagem Carregada' : 'Aguardando Imagem'}
                  </div>
               </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative bg-navy-950/50 rounded-3xl border-2 border-dashed border-slate-800/50 overflow-hidden group">
               {editorImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    {isMonochrome ? (
                      <div 
                        className="max-w-full w-full h-full max-h-[350px] transition-all duration-500 drop-shadow-2xl"
                        style={{
                          maskImage: `url(${editorImage})`,
                          WebkitMaskImage: `url(${editorImage})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          backgroundColor: monochromeColor
                        }}
                      />
                    ) : (
                      <img 
                        src={editorImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[350px] object-contain transition-all duration-500 drop-shadow-2xl" 
                      />
                    )}
                    
                    {isRemovingBg && (
                      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-fade-in">
                        <div className="relative">
                          <div className="h-20 w-20 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
                          <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 text-3xl animate-pulse">magic_button</span>
                        </div>
                        <p className="mt-4 font-black uppercase tracking-widest text-xs text-white">IA Removendo Fundo...</p>
                        <p className="text-[10px] text-slate-400 mt-2">Processando localmente no seu navegador</p>
                      </div>
                    )}
                  </div>
               ) : (
                  <div className="text-center p-10 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-primary-600/5 transition-colors" onClick={handleUploadClick}>
                    <div className="h-24 w-24 bg-navy-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                      <span className="material-symbols-outlined text-5xl text-slate-700">cloud_upload</span>
                    </div>
                    <p className="text-lg font-black text-slate-400">Arraste ou clique para enviar</p>
                    <p className="text-xs text-slate-600 mt-2 uppercase tracking-[0.2em]">JPG, PNG ou WEBP (Max 5MB)</p>
                  </div>
               )}
            </div>

            {/* Toolbar Inferior */}
            <div className={`mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3`}>
               <button 
                  onClick={handleUploadClick}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-navy-900 rounded-2xl border border-slate-800 hover:border-primary-600/50 hover:bg-navy-800 transition-all group"
               >
                 <span className="material-symbols-outlined text-primary-500 group-hover:scale-110 transition-transform">add_photo_alternate</span>
                 <span className="text-[10px] items-center text-center font-bold uppercase tracking-widest text-slate-400">Nova Imagem</span>
               </button>

               <button 
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg || !editorImage}
                  className={`flex flex-col items-center justify-center gap-2 p-4 bg-navy-900 rounded-2xl border border-slate-800 hover:border-primary-600/50 hover:bg-navy-800 transition-all group ${!editorImage ? 'opacity-30 cursor-not-allowed' : ''}`}
               >
                 <span className="material-symbols-outlined text-primary-500 group-hover:scale-110 transition-transform">content_cut</span>
                 <span className="text-[10px] items-center text-center font-bold uppercase tracking-widest text-slate-400">Remover Fundo</span>
               </button>

               <button 
                  onClick={() => {
                    if (editorImage) setCropConfig({ isOpen: true, image: editorImage, aspect: 1 });
                  }}
                  disabled={!editorImage}
                  className={`flex flex-col items-center justify-center gap-2 p-4 bg-navy-900 rounded-2xl border border-slate-800 hover:border-primary-600/50 hover:bg-navy-800 transition-all group ${!editorImage ? 'opacity-30 cursor-not-allowed' : ''}`}
               >
                 <span className="material-symbols-outlined text-primary-500 group-hover:scale-110 transition-transform">crop</span>
                 <span className="text-[10px] items-center text-center font-bold uppercase tracking-widest text-slate-400">Recortar</span>
               </button>

               <div className={`relative flex flex-col items-center justify-center p-1 rounded-2xl border transition-all group ${isMonochrome ? 'bg-primary-600/20 border-primary-600' : 'bg-navy-900 border-slate-800 hover:border-primary-600/50 hover:bg-navy-800'} ${!editorImage ? 'opacity-30 cursor-not-allowed' : ''}`}>
                 <button 
                    onClick={toggleMonochrome}
                    disabled={!editorImage}
                    className="flex flex-col items-center justify-center outline-none w-full h-full py-3"
                 >
                   <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isMonochrome ? 'text-primary-500' : 'text-primary-500'}`}>tonality</span>
                   <span className="text-[10px] items-center text-center font-bold uppercase tracking-widest text-slate-400 mt-2">Monocromático</span>
                 </button>
                 {isMonochrome && editorImage && (
                   <input 
                     type="color" 
                     value={monochromeColor} 
                     onChange={(e) => setMonochromeColor(e.target.value)} 
                     className="absolute top-2 right-2 w-6 h-6 rounded cursor-pointer border-none p-0 outline-none"
                     title="Escolher cor"
                   />
                 )}
               </div>

               <button 
                  onClick={saveLogoToGallery}
                  disabled={loading || !editorImage}
                  className={`flex flex-col items-center justify-center gap-2 p-4 bg-primary-600 rounded-2xl border border-primary-500 hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 active:scale-95 ${!editorImage ? 'opacity-30 cursor-not-allowed' : ''}`}
               >
                 {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>
                      <span className="material-symbols-outlined text-white group-hover:scale-110 transition-transform">save</span>
                      <span className="text-[10px] text-center font-black uppercase tracking-widest text-white">Salvar na Galeria</span>
                    </>
                 )}
               </button>
            </div>
            
            {(error || success) && (
               <div className={`mt-4 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-bounce ${error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                 <span className="material-symbols-outlined text-sm">{error ? 'error' : 'check_circle'}</span>
                 {error || success}
               </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Galeria */}
        <div className="xl:col-span-5 space-y-6">
          <div className="card-premium h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
               <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary-500">grid_view</span>
                 Minhas Logos
               </h3>
               <span className="text-[10px] text-slate-500 font-bold uppercase">{gallery.length} Intens</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
               {isGalleryLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="aspect-square bg-navy-900 rounded-2xl animate-pulse border border-slate-800"></div>
                    ))}
                  </div>
               ) : gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {gallery.map((item) => {
                      const isProfile = profile?.organizations?.logo_url === item.url;
                      const isDocument = profile?.organizations?.report_logo_url === item.url;
                      
                      return (
                       <div key={item.id} className={`group relative aspect-square rounded-2xl border-2 transition-all p-3 flex items-center justify-center bg-white ${isProfile || isDocument ? 'border-primary-600 shadow-lg shadow-primary-600/10' : 'border-slate-800 hover:border-slate-600'}`}>
                          <img src={item.url} alt="Logo" className="max-w-full max-h-full object-contain" />
                          
                          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                             {isProfile && (
                                <div className="bg-primary-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                   <span className="material-symbols-outlined text-[10px]">person</span> Perfil
                                </div>
                             )}
                             {isDocument && (
                                <div className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                   <span className="material-symbols-outlined text-[10px]">description</span> Docs
                                </div>
                             )}
                          </div>

                          <div className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                             <div className="flex w-full gap-2">
                               <button 
                                  onClick={() => setLogoType(item.url, 'profile')}
                                  disabled={isProfile}
                                  className={`w-full text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-all shadow-lg ${isProfile ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500 text-white'}`}
                               >
                                  Usar no Perfil
                               </button>
                               <button 
                                  onClick={() => setLogoType(item.url, 'document')}
                                  disabled={isDocument}
                                  className={`w-full text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-all shadow-lg ${isDocument ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                               >
                                  Usar em Docs
                               </button>
                             </div>

                             <button 
                                onClick={() => setEditorImage(item.url)}
                                className="w-full bg-navy-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all border border-slate-700 mt-2"
                             >
                                Editar Novamente
                             </button>
                             <button 
                                onClick={() => deleteLogo(item.id)}
                                className="absolute top-2 right-2 text-slate-500 hover:text-red-500 transition-colors"
                             >
                                <span className="material-symbols-outlined text-xl">delete</span>
                             </button>
                          </div>
                       </div>
                      );
                    })}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-slate-600">
                     <span className="material-symbols-outlined text-6xl mb-4 opacity-20">image_search</span>
                     <p className="font-black uppercase tracking-widest text-[10px]">Sua galeria está vazia</p>
                  </div>
               )}
            </div>

            <div className="mt-6 space-y-4 pt-4 border-t border-slate-800">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200">Proporção de Exibição / Zoom</h4>
                 {isSavingScale && <span className="text-[9px] font-bold text-primary-500 flex items-center gap-1 animate-pulse"><span className="material-symbols-outlined text-[10px] animate-spin">autorenew</span> Salvando...</span>}
               </div>
               
               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between items-end text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      <span>Logo do Perfil</span>
                      <span className="text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-md">{logoSize}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="10" 
                     max="200" 
                     value={logoSize} 
                     onChange={(e) => setLogoSize(Number(e.target.value))}
                     className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>
                 
                 <div>
                   <div className="flex justify-between items-end text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      <span>Logo de Documentos</span>
                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{reportLogoSize}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="10" 
                     max="200" 
                     value={reportLogoSize} 
                     onChange={(e) => setReportLogoSize(Number(e.target.value))}
                     className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>
               </div>
            </div>

            <div className="mt-6 p-4 bg-navy-950 rounded-2xl border border-slate-800/50">
               <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-500 mt-0.5">info</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">As logos salvas aqui podem ser ativadas rapidamente como sua identidade visual principal em todo o sistema e documentos.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium">
          <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-black uppercase tracking-tight">Segurança da Conta</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">Mantenha sua conta segura alterando sua senha regularmente ou configurando autenticação avançada.</p>
          <button
            onClick={() => window.location.href = '/change-password'}
            className="w-full bg-transparent border border-slate-800 text-white rounded-xl py-4 text-[11px] uppercase tracking-widest font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg text-primary-500">lock_reset</span>
            Redefinir Senha de Acesso
          </button>
        </div>

        <div className="card-premium opacity-50 relative overflow-hidden group">
          <div className="absolute top-4 right-4 bg-slate-800 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500">Coming Soon</div>
          <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-black uppercase tracking-tight">Alarmes & Notificações</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">Personalize como você deseja ser alertado sobre pedidos, manutenções e alertas críticos de segurança.</p>
          <div className="h-1.5 w-full bg-navy-900 rounded-full overflow-hidden">
             <div className="h-full w-1/3 bg-primary-600"></div>
          </div>
        </div>
      </div>

      {cropConfig.isOpen && cropConfig.image && (
        <CropModal
          image={cropConfig.image}
          onClose={() => setCropConfig({ ...cropConfig, isOpen: false, image: null })}
          onCropComplete={onCropComplete}
          aspect={cropConfig.aspect}
        />
      )}
    </div>
  );
}

// Renamed and fixed the original ImageCropperModal to CropModal
function CropModal({ image, aspect: initialAspect, onClose, onCropComplete }: { image: string, aspect: number, onClose: () => void, onCropComplete: (img: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentAspect, setCurrentAspect] = useState(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropCompleteAction = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !croppedAreaPixels) return;

      const targetSize = 512;
      let width = croppedAreaPixels.width;
      let height = croppedAreaPixels.height;

      // Calculate resize dimensions maintaining aspect ratio
      if (width > targetSize || height > targetSize) {
        if (width > height) {
          height = (targetSize / width) * height;
          width = targetSize;
        } else {
          width = (targetSize / height) * width;
          height = targetSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        width,
        height
      );

      // Preserve transparency if original is PNG, otherwise compress as JPEG
      const isPng = image.startsWith('data:image/png');
      onCropComplete(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      console.error(e);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">crop</span>
            Recortar Imagem
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="relative h-[300px] sm:h-[350px] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect || undefined}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteAction}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 bg-navy-950 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full flex items-center gap-4">
              <span className="material-symbols-outlined text-slate-500">zoom_in</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary-600"
              />
            </div>

            <div className="flex items-center gap-2 bg-navy-900 p-1 rounded-xl border border-slate-800">
               {[
                 { label: 'Recorte Livre', value: 0, icon: 'crop_free' },
                 { label: 'Quadrado (1:1)', value: 1, icon: 'crop_square' },
                 { label: 'Paisagem (4:3)', value: 4/3, icon: 'crop_7_5' },
                 { label: 'Widescreen (16:9)', value: 16/9, icon: 'crop_16_9' }
               ].map(opt => (
                 <button
                    key={opt.label}
                    title={opt.label}
                    onClick={() => setCurrentAspect(opt.value)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${currentAspect === opt.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                 >
                    <span className="material-symbols-outlined text-xl leading-none">{opt.icon}</span>
                 </button>
               ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button onClick={onClose} className="bg-transparent border border-slate-800 text-slate-400 px-6 py-2 rounded-xl hover:bg-slate-800 transition-colors">Cancelar</button>
            <button onClick={getCroppedImg} className="bg-primary-600 text-white px-8 py-2 rounded-xl hover:bg-primary-700 transition-colors font-bold">Confirmar Recorte</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
