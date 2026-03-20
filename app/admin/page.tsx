'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
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
      const { data } = await supabase.from('site_config').select('logo_url').eq('id', 1).single();
      if (data) setSiteConfig(data);
    };
    fetchConfig();
  }, []);

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
                {/* Logo Section */}
                <div className="flex flex-col gap-4 p-4 bg-navy-950 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logo da Empresa</label>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-xl bg-navy-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 group relative text-primary-600">
                      {siteData.logo_url ? (
                        <img src={siteData.logo_url} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl">ac_unit</span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer">
                          <span className="material-symbols-outlined text-white">edit</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'logoImage', 4221 / 1921)} />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">Logo Principal</p>
                      <p className="text-xs text-slate-500 mb-3">Recomendado: 512x512px (PNG ou JPG). Esta logo aparecerá em todo o site e painéis.</p>
                      <label className="btn border border-slate-800 text-xs py-1.5 px-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors inline-block text-white">
                        Alterar Logo
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'logoImage', 4221 / 1921)} />
                      </label>
                    </div>
                  </div>
                </div>

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

  // Form State - Focus only on Company (Organization)
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
  });

  // Logo state (Company)
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.organizations?.logo_url || null);
  
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Sync state
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
      });
      setLogoPreview(profile.organizations?.logo_url || null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = async (croppedImage: string) => {
    setLogoPreview(croppedImage);
    setIsCropOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // Atualizar Organização (Empresa)
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
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.organization_id);

        if (orgError) throw orgError;
      }

      await refreshProfile();
      setSuccess('Dados da empresa atualizados com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-600 text-white outline-none transition-all";
  const disabledClass = "w-full bg-navy-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">Perfil da Unidade / Empresa</h1>
        <p className="text-slate-500">Gerencie as informações corporativas que aparecem no sistema e relatórios.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Seção 1: Dados da Empresa */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>WhatsApp Comercial</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className={labelClass}>E-mail Comercial</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="comercial@suaempresa.com" />
                </div>
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <div className="card-premium space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="material-symbols-outlined text-primary-600">location_on</span>
                Localização / Sede
              </h3>
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

            {/* Seção 3: Notas */}
            <div className="card-premium">
               <label className={labelClass}>Observações Adicionais</label>
               <textarea name="notes" value={formData.notes} onChange={handleInputChange} className={`${inputClass} h-32 resize-none`} placeholder="Notas internas sobre a empresa..." />
            </div>
          </div>

          {/* Side Column: Logo and Plan */}
          <div className="space-y-6">
             {/* Company Logo Card */}
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
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
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

             {/* Action Buttons */}
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

      {isCropOpen && selectedImage && (
        <CropModal
          image={selectedImage}
          onClose={() => setIsCropOpen(false)}
          onCropComplete={onCropComplete}
          aspect={1}
        />
      )}
    </div>
  );
}

function SettingsView() {
  const router = useRouter();

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">Configurações</h1>
        <p className="text-slate-500">Ajustes da conta e segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium">
          <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Segurança</h3>
          <p className="text-sm text-slate-500 mb-6">Mantenha sua conta segura alterando sua senha regularmente.</p>
          <button
            onClick={() => router.push('/change-password')}
            className="w-full bg-transparent border border-slate-800 text-white rounded-xl py-3 text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">lock_reset</span>
            Trocar Senha
          </button>
        </div>

        <div className="card-premium opacity-50 cursor-not-allowed">
          <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Notificações</h3>
          <p className="text-sm text-slate-500 mb-6">Gerencie como você recebe alertas do sistema (Em breve).</p>
        </div>
      </div>
    </div>
  );
}

// Renamed and fixed the original ImageCropperModal to CropModal
function CropModal({ image, aspect, onClose, onCropComplete }: { image: string, aspect: number, onClose: () => void, onCropComplete: (img: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
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
            onCropChange={setCrop}
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
