'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabase';
import AuthProvider, { useAuth } from '@/components/AuthProvider';

export default function ClientPage() {
  return (
    <AuthProvider requiredRole="client">
      <ClientDashboard />
    </AuthProvider>
  );
}

function ClientDashboard() {
  const { signOut, profile, isProfileLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
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
    { id: 'equipamentos', icon: 'ac_unit', label: 'Equipamentos' },
    { id: 'pedidos', icon: 'receipt_long', label: 'Pedidos' },
    { id: 'contratos', icon: 'description', label: 'Contratos' },
    { id: 'financeiro', icon: 'payments', label: 'Financeiro' },
  ];

  const sectionMetadata: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: `Bem-vindo, ${profile?.full_name?.split(' ')[0] || 'Cliente'}`,
      subtitle: 'Acompanhe o status dos seus equipamentos e pedidos.',
    },
    equipamentos: {
      title: 'Meus Equipamentos',
      subtitle: 'Visualize a lista completa e status de todos os seus ativos.',
    },
    pedidos: {
      title: 'Pedidos e Serviços',
      subtitle: 'Gerencie ordens de serviço, solicitações de reparo e compras.',
    },
    contratos: {
      title: 'Documentos e Contratos',
      subtitle: 'Acesse seus contratos vigentes, termos e PMOC.',
    },
    financeiro: {
      title: 'Painel Financeiro',
      subtitle: 'Gestão de faturas, boletos e histórico de transações.',
    },
    profile: {
      title: 'Meu Perfil',
      subtitle: 'Gerencie suas informações pessoais e de contato.',
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Ajustes de segurança e preferências da conta.',
    },
  };

  const handleLogout = async () => {
    await signOut();
  };

  // @ts-ignore
  const logoScale = profile?.organizations?.logo_size ? profile.organizations.logo_size / 100 : 1;

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* Sidebar Navigation */}
      <aside className={`sidebar-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="p-6">
          <span className="text-primary-600 font-bold text-2xl tracking-tighter flex items-center gap-2">
            {siteConfig === null ? (
              <span className="h-10" />
            ) : siteConfig.logo_url ? (
              <img 
                src={siteConfig.logo_url} 
                alt="Fixar Logo" 
                className="w-auto object-contain transition-all origin-left" 
                style={{ height: `${40 * logoScale}px` }} 
              />
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl">ac_unit</span>
                FIXAR
              </>
            )}
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
              className={`nav-item ${activeSection === item.id ? 'nav-item-active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">© 2024 Fixar Refrigeração</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header-dashboard">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white uppercase tracking-tight">
                {isProfileLoading && activeSection === 'dashboard' ? (
                  <div className="h-6 w-48 bg-slate-800 animate-pulse rounded" />
                ) : (
                  sectionMetadata[activeSection].title
                )}
              </h1>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                {isProfileLoading && activeSection === 'dashboard' ? (
                  <div className="h-3 w-64 bg-slate-800/50 animate-pulse rounded mt-1" />
                ) : (
                  sectionMetadata[activeSection].subtitle
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative hidden xl:block group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] group-focus-within:text-primary-600 transition-colors">search</span>
              <input 
                className="bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-600 w-72 text-white transition-all outline-none" 
                placeholder="Pesquisar no sistema..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl bg-navy-900 border border-slate-800 hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-slate-400">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-navy-950"></span>
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  disabled={isProfileLoading}
                  className={`flex items-center gap-3 p-1 pr-3 rounded-full transition-colors text-left select-none outline-none ${isProfileLoading ? 'cursor-default' : 'hover:bg-slate-800'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-navy-900 flex items-center justify-center border border-slate-800 shrink-0 relative overflow-hidden">
                    {isProfileLoading ? (
                      <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary-600">person</span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col min-w-0 gap-1">
                    {isProfileLoading ? (
                      <>
                        <div className="h-3 w-20 bg-slate-800 animate-pulse rounded" />
                        <div className="h-2 w-28 bg-slate-800/50 animate-pulse rounded" />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-white truncate leading-tight">{profile?.full_name || 'Cliente'}</p>
                        <p className="text-[11px] text-slate-500 truncate leading-tight">{profile?.email || ''}</p>
                      </>
                    )}
                  </div>
                  {!isProfileLoading && (
                    <span className={`material-symbols-outlined text-slate-400 text-sm hidden md:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  )}
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-navy-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                    <button 
                      onClick={() => { setActiveSection('profile'); setIsProfileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${activeSection === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      <span>Perfil</span>
                    </button>
                    <button 
                      onClick={() => { setActiveSection('settings'); setIsProfileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${activeSection === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <span className="material-symbols-outlined text-lg">settings</span>
                      <span>Configurações</span>
                    </button>
                    <hr className="my-2 border-slate-800"/>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-8 animate-fade-in">
          {activeSection === 'profile' ? (
            <ProfileView />
          ) : activeSection === 'settings' ? (
            <SettingsView />
          ) : activeSection === 'dashboard' ? (
            <div className="space-y-8">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Equipamentos Ativos', value: '12', change: '+2 este mês', icon: 'ac_unit', color: 'blue' },
                  { label: 'Pedidos em Aberto', value: '04', change: 'Aguardando', icon: 'pending_actions', color: 'orange' },
                  { label: 'Contratos Vigentes', value: '02', icon: 'verified', color: 'emerald' },
                  { label: 'Próxima Manutenção', value: '15 Jan, 2024', icon: 'calendar_today', color: 'slate' }
                ].map((stat, idx) => (
                  <div key={idx} className="card-premium">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`p-2 rounded-lg bg-primary-600/10 text-primary-600 material-symbols-outlined`}>{stat.icon}</span>
                      {stat.change && <span className={`badge ${stat.color === 'orange' ? 'text-orange-500 bg-orange-500/10' : 'text-green-500 bg-green-500/10'}`}>{stat.change}</span>}
                    </div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <h3 className={`${stat.label.includes('Data') || stat.label.includes('Próxima') ? 'text-xl' : 'text-3xl'} font-bold mt-1 text-white`}>{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Equipamentos Recentes */}
                <div className="lg:col-span-2 card-premium !p-0">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Equipamentos em Destaque</h2>
                    <button onClick={() => setActiveSection('equipamentos')} className="text-primary-600 font-semibold text-sm hover:underline">Ver todos</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table-dashboard">
                      <thead className="table-header">
                        <tr>
                          <th className="px-6 py-4">Equipamento</th>
                          <th className="px-6 py-4">Série</th>
                          <th className="px-6 py-4">Localização</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {[
                          { name: 'Chiller Industrial K-20', id: 'CH-8829-X', place: 'Unidade Matriz - Bloco A', status: 'Operando', icon: 'severe_cold', color: 'green' },
                          { name: 'VRF Split 60.000 BTU', id: 'VRF-1102-Y', place: 'Escritório Central', status: 'Operando', icon: 'air_freshener', color: 'green' },
                          { name: 'Câmara Fria Mod 4', id: 'CF-9921-Z', place: 'Depósito Resfriados', status: 'Manutenção', icon: 'kitchen', color: 'orange' }
                        ].map((eq, idx) => (
                          <tr key={idx} className="table-row text-sm">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-primary-600/10 flex items-center justify-center text-primary-600 material-symbols-outlined text-[18px]">{eq.icon}</div>
                              <span className="font-medium text-white">{eq.name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-400">{eq.id}</td>
                            <td className="px-6 py-4 text-slate-400">{eq.place}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold bg-${eq.color}-900/30 text-${eq.color}-400 uppercase tracking-wider`}>{eq.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Últimos Pedidos */}
                <div className="card-premium !p-0 flex flex-col">
                  <div className="p-6 border-b border-slate-800">
                    <h2 className="text-lg font-bold">Últimos Pedidos</h2>
                  </div>
                  <div className="p-6 space-y-6 flex-1">
                    {[
                      { title: 'Manutenção Preventiva #450', date: 'Solicitado em 12 Out, 2023', status: 'Em atendimento', color: 'blue', icon: 'build' },
                      { title: 'Compra de Filtros Hepa (5un)', date: 'Solicitado em 05 Out, 2023', status: 'Entregue', color: 'emerald', icon: 'shopping_basket' }
                    ].map((order, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 shrink-0">
                          <span className="material-symbols-outlined text-[20px]">{order.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-white">{order.title}</p>
                          <p className="text-xs text-slate-500">{order.date}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${order.color === 'blue' ? 'bg-primary-600' : 'bg-green-500'}`}></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 mt-auto">
                    <button onClick={() => setActiveSection('pedidos')} className="w-full btn btn-secondary py-2.5">
                      Ver Todo o Histórico
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-navy-900 rounded-xl border border-slate-800 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">{navItems.find(i => i.id === activeSection)?.icon}</span>
              <h2 className="text-xl font-bold mb-2">Módulo em Desenvolvimento</h2>
              <p className="text-slate-500 max-w-md mx-auto">Esta tela exibirá os detalhes de {activeSection} em breve.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
function ProfileView() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    whatsapp: profile?.whatsapp || '',
    document: profile?.document || '',
    cep: profile?.cep || '',
    street: profile?.street || '',
    number: profile?.number || '',
    complement: profile?.complement || '',
    neighborhood: profile?.neighborhood || '',
    city: profile?.city || '',
    state: profile?.state || '',
    birthday: profile?.birthday || '',
    notes: profile?.notes || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: profile.whatsapp || '',
        document: profile.document || '',
        cep: profile.cep || '',
        street: profile.street || '',
        number: profile.number || '',
        complement: profile.complement || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
        birthday: profile.birthday || '',
        notes: profile.notes || '',
      });
      setAvatarPreview(profile.avatar_url || null);
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
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) { console.error('Erro ao buscar CEP', err); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => { setSelectedImage(reader.result as string); setIsCropOpen(true); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ...formData, avatar_url: avatarPreview, updated_at: new Date().toISOString() })
        .eq('id', profile?.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) { setError(err.message || 'Erro ao atualizar perfil.'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-600 text-white outline-none transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <>
      <div className="animate-fade-in max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500">Gerencie suas informações pessoais.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card-premium flex flex-col items-center">
            <div className="relative group mb-6">
              <div className="h-32 w-32 rounded-full border-4 border-slate-800 overflow-hidden bg-navy-900 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-slate-700">person</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center border-4 border-navy-900 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                <span className="material-symbols-outlined text-white text-[20px]">add_a_photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{profile?.full_name || 'Cliente'}</h3>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card-premium space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={labelClass}>Nome Completo</label><input name="full_name" value={formData.full_name} onChange={handleInputChange} className={inputClass} required /></div>
              <div><label className={labelClass}>WhatsApp</label><input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>CPF / CNPJ</label><input name="document" value={formData.document} onChange={handleInputChange} className={inputClass} /></div>
            </div>
            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary-600">location_on</span>Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>CEP</label><input name="cep" value={formData.cep} onChange={handleInputChange} onBlur={fetchCep} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Rua</label><input name="street" value={formData.street} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>Número</label><input name="number" value={formData.number} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Bairro</label><input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Cidade</label><input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>Estado</label><input name="state" value={formData.state} onChange={handleInputChange} className={inputClass} /></div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
          </form>
        </div>
      </div>
      </div>

      {/* FIXED POSITION ELEMENTS - Moved outside animated div */}
      {isCropOpen && selectedImage && (
        <CropModal 
          image={selectedImage} 
          onClose={() => setIsCropOpen(false)} 
          onCropComplete={(img) => { setAvatarPreview(img); setIsCropOpen(false); }} 
          aspect={1} 
        />
      )}
    </>
  );
}

function SettingsView() {
  const router = useRouter();
  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">Configurações</h1>
        <p className="text-slate-500">Configurações de segurança.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium">
          <div className="h-12 w-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-4"><span className="material-symbols-outlined text-2xl">lock</span></div>
          <h3 className="text-lg font-bold text-white mb-2">Segurança</h3>
          <p className="text-sm text-slate-500 mb-6">Altere sua senha de acesso.</p>
          <button onClick={() => router.push('/change-password')} className="btn-secondary w-full py-3 flex items-center justify-center gap-2"><span className="material-symbols-outlined text-lg">lock_reset</span>Trocar Senha</button>
        </div>
      </div>
    </div>
  );
}

function CropModal({ image, aspect, onClose, onCropComplete }: { image: string, aspect: number, onClose: () => void, onCropComplete: (img: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const onCropCompleteAction = useCallback((_: any, croppedAreaPixels: any) => { setCroppedAreaPixels(croppedAreaPixels); }, []);
  const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image(); img.addEventListener('load', () => resolve(img)); img.addEventListener('error', (err) => reject(err));
    img.setAttribute('crossOrigin', 'anonymous'); img.src = url;
  });
  const getCroppedImg = async () => {
    try {
      const img = await createImage(image); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      if (!ctx || !croppedAreaPixels) return;

      const targetSize = 512;
      let width = croppedAreaPixels.width;
      let height = croppedAreaPixels.height;

      if (width > targetSize || height > targetSize) {
        if (width > height) {
          height = (targetSize / width) * height;
          width = targetSize;
        } else {
          width = (targetSize / height) * width;
          height = targetSize;
        }
      }

      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, width, height);
      onCropComplete(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) { console.error(e); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between"><h3 className="text-lg font-bold">Recortar Imagem</h3><button onClick={onClose}><span className="material-symbols-outlined">close</span></button></div>
        <div className="relative h-[400px] bg-black"><Cropper image={image} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onCropComplete={onCropCompleteAction} onZoomChange={setZoom} /></div>
        <div className="p-6 bg-navy-950 flex flex-col gap-6">
          <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2 border border-slate-800 rounded-xl">Cancelar</button><button onClick={getCroppedImg} className="bg-primary-600 px-8 py-2 rounded-xl font-bold">Confirmar</button></div>
        </div>
      </div>
    </div>
  );
}
