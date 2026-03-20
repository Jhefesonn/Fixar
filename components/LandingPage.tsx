'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: config, error: configErr } = await supabase.from('site_config').select('*').eq('id', 1).single();
        const { data: servs, error: servsErr } = await supabase.from('services').select('*').order('order', { ascending: true });
        const { data: diffs, error: diffsErr } = await supabase.from('differentiators').select('*').order('order', { ascending: true });

        if (configErr || servsErr || diffsErr) {
          setError('Tabelas não encontradas no Supabase. Verifique se a migração SQL foi aplicada no projeto correto.');
          return;
        }

        if (config) setSiteConfig(config);
        if (servs) setServices(servs);
        if (diffs) setDifferentiators(diffs);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Erro de conexão com o Supabase');
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-navy-950 min-h-screen flex flex-col items-center justify-center gap-6 text-white p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-red-500">error</span>
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6">
            Conectado ao projeto: <strong>{supabase.storage.from('site-assets').getPublicUrl('test').data.publicUrl.split('//')[1].split('.')[0]}</strong>
          </div>
          <button onClick={() => window.location.reload()} className="btn btn-primary px-8">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  if (!siteConfig) {
    return (
      <div className="bg-navy-950 min-h-screen flex flex-col items-center justify-center gap-4 text-white">
        <div className="h-12 w-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500 animate-pulse">Sincronizando com Supabase...</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-950 font-sans text-slate-100 antialiased min-h-screen">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2">
              <span className="text-primary-600 font-bold text-2xl tracking-tighter flex items-center gap-2">
                {siteConfig.logo_url ? (
                  <img src={siteConfig.logo_url} alt="Fixar Refrigeração" className="h-10 md:h-12 w-auto object-contain" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl">ac_unit</span>
                    FIXAR
                  </>
                )}
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-white">
              <a className="text-sm font-semibold hover:text-primary-600 transition-colors" href="#sobre">Sobre</a>
              <a className="text-sm font-semibold hover:text-primary-600 transition-colors" href="#servicos">Serviços</a>
              <a className="text-sm font-semibold hover:text-primary-600 transition-colors" href="#diferenciais">Por que nós</a>
              <a className="text-sm font-semibold hover:text-primary-600 transition-colors" href="#contato">Contato</a>
              <a 
                href="/login"
                className="btn btn-secondary text-sm px-6 py-2.5 bg-navy-900 border-slate-700 hover:border-primary-600 text-white"
              >
                Área do Cliente
              </a>
            </nav>
            <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-navy-950/95 backdrop-blur-lg animate-fade-in">
            <div className="px-4 py-6 flex flex-col gap-4">
              <a className="text-base font-semibold text-white hover:text-primary-600 transition-colors py-2" href="#sobre" onClick={() => setIsMobileMenuOpen(false)}>Sobre</a>
              <a className="text-base font-semibold text-white hover:text-primary-600 transition-colors py-2" href="#servicos" onClick={() => setIsMobileMenuOpen(false)}>Serviços</a>
              <a className="text-base font-semibold text-white hover:text-primary-600 transition-colors py-2" href="#diferenciais" onClick={() => setIsMobileMenuOpen(false)}>Por que nós</a>
              <a className="text-base font-semibold text-white hover:text-primary-600 transition-colors py-2" href="#contato" onClick={() => setIsMobileMenuOpen(false)}>Contato</a>
              <a 
                href="/login"
                className="btn btn-primary text-sm text-center mt-2"
              >
                Área do Cliente
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-8">
                <div className="inline-flex items-center gap-2 bg-primary-600/20 text-blue-400 px-4 py-1.5 rounded-full w-fit">
                  <span className="text-xs font-bold uppercase tracking-wider">{siteConfig.hero_badge}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-white whitespace-pre-line">
                  {siteConfig.hero_title}
                </h1>
                <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                  {siteConfig.hero_subtitle}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a className="btn btn-primary px-8 py-4 text-lg" href={siteConfig.hero_cta_link}>
                    {siteConfig.hero_cta_text}
                  </a>
                  <a 
                    href="/login"
                    className="btn btn-secondary px-8 py-4 text-lg"
                  >
                    Área do Cliente
                  </a>
                </div>
              </div>
              <div className="relative">
                <div 
                  className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-800 bg-cover bg-center"
                  style={{ backgroundImage: `url('${siteConfig.hero_image_url}')` }}
                />
                <div className="absolute -bottom-6 -left-6 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary-600/20 p-3 rounded-full text-primary-600">
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">+10 Anos</p>
                      <p className="text-xs text-slate-400">De experiência no mercado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 -z-10 w-1/3 h-full bg-primary-600/10 blur-3xl rounded-full"></div>
        </section>

        {/* About Us Section */}
        <section className="py-24 bg-slate-900/50" id="sobre">
          <div className="max-width-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white uppercase tracking-tight">{siteConfig.about_title}</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                {siteConfig.about_description}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-primary-600/50 transition-all">
                <span className="material-symbols-outlined text-primary-600 text-4xl mb-4">handshake</span>
                <h3 className="text-xl font-bold mb-2">Confiabilidade</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Transparência total em todos os diagnósticos e orçamentos apresentados.</p>
              </div>
              <div className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-primary-600/50 transition-all">
                <span className="material-symbols-outlined text-primary-600 text-4xl mb-4">engineering</span>
                <h3 className="text-xl font-bold mb-2">Expertise Técnica</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Profissionais certificados e atualizados com as últimas tecnologias do setor.</p>
              </div>
              <div className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-primary-600/50 transition-all">
                <span className="material-symbols-outlined text-primary-600 text-4xl mb-4">psychology</span>
                <h3 className="text-xl font-bold mb-2">Foco no Cliente</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Soluções personalizadas que atendem às necessidades específicas de cada projeto.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24" id="servicos">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white uppercase tracking-tight">{siteConfig.services_title}</h2>
                <p className="text-slate-400">{siteConfig.services_subtitle}</p>
              </div>
              <a className="text-primary-600 font-bold flex items-center gap-2 hover:gap-3 transition-all" href="#servicos">
                Ver todos os serviços <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, idx) => (
                <div key={service.id} className="group bg-slate-800/50 p-2 rounded-3xl border border-slate-700/50 shadow-sm hover:shadow-xl transition-all">
                  <div 
                    className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative bg-cover bg-center" 
                    style={{ backgroundImage: `url('${service.image_url}')` }}
                  >
                    <div className="absolute inset-0 bg-primary-600/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="px-4 pb-6">
                    <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                    <p className="text-sm text-slate-400">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-primary-600 text-white overflow-hidden relative" id="diferenciais">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight uppercase tracking-tight">{siteConfig.diferenciais_title}</h2>
                <div className="space-y-8">
                  {differentiators.map((item, idx) => (
                    <div key={item.id} className="flex gap-6">
                      <div className="bg-white/20 p-4 rounded-2xl h-fit text-white">
                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2 uppercase tracking-wide">{item.title}</h4>
                        <p className="text-white/80 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block relative">
                <div className="aspect-video bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 p-8 flex flex-col justify-center items-center text-center">
                  <span className="material-symbols-outlined text-8xl mb-4">thumb_up</span>
                  <p className="text-2xl font-bold italic">"Qualidade que você sente na pele."</p>
                </div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 border-t border-slate-800" id="contato">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight mb-4">{siteConfig.contato_title}</h2>
              <p className="text-slate-400">{siteConfig.contato_subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* WhatsApp Link */}
              <a className="group flex flex-col items-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-primary-600/50 transition-all text-center" href={`https://wa.me/${siteConfig.contato_whatsapp}`} target="_blank">
                <div className="bg-[#25D366]/20 p-5 rounded-full text-[#25D366] mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.334 0 0 5.332 0 12.043c0 2.145.56 4.241 1.632 6.11L0 24l6.105-1.604a11.845 11.845 0 005.937 1.587h.005c6.712 0 12.05-5.333 12.056-12.048a11.823 11.823 0 00-3.626-8.526z"/>
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">WhatsApp</p>
                <p className="text-xl font-bold text-white mb-2">{siteConfig.contato_whatsapp.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '($2) $3-$4')}</p>
                <span className="text-sm text-[#25D366] font-medium flex items-center gap-2">Enviar Mensagem <span className="material-symbols-outlined text-sm">open_in_new</span></span>
              </a>
              {/* Email Link */}
              <a className="group flex flex-col items-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-primary-600/50 transition-all text-center" href={`mailto:${siteConfig.contato_email}`}>
                <div className="bg-primary-600/20 p-5 rounded-full text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">mail</span>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-mail</p>
                <p className="text-xl font-bold text-white mb-2">{siteConfig.contato_email}</p>
                <span className="text-sm text-primary-600 font-medium flex items-center gap-2">Enviar E-mail <span className="material-symbols-outlined text-sm">mail</span></span>
              </a>
              {/* Location Info */}
              <div className="group flex flex-col items-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="bg-primary-600/20 p-5 rounded-full text-primary-600 mb-6">
                  <span className="material-symbols-outlined text-4xl">location_on</span>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Localização</p>
                <p className="text-xl font-bold text-white mb-2">{siteConfig.contato_address}</p>
                <span className="text-sm text-slate-400 font-medium">Atendimento Domiciliar</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-white mb-6">
                <span className="text-primary-600 font-bold text-xl tracking-tighter flex items-center gap-2">
                  {siteConfig.logo_url ? (
                    <img src={siteConfig.logo_url} alt="Fixar Logo" className="h-10 w-auto object-contain" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl">ac_unit</span>
                      FIXAR
                    </>
                  )}
                </span>
              </div>
              <p className="max-w-sm">
                {siteConfig.footer_text}
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navegação</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#sobre" className="hover:text-primary-600 transition-colors">Sobre</a></li>
                <li><a href="#servicos" className="hover:text-primary-600 transition-colors">Serviços</a></li>
                <li><a href="#diferenciais" className="hover:text-primary-600 transition-colors">Diferenciais</a></li>
                <li><a href="#contato" className="hover:text-primary-600 transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary-600 transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest">
            <p>© 2024 FIXAR REFRIGERAÇÃO. TODOS OS DIREITOS RESERVADOS.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href={`https://wa.me/${siteConfig.contato_whatsapp}`} 
        target="_blank" 
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-[100] flex items-center justify-center"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.334 0 0 5.332 0 12.043c0 2.145.56 4.241 1.632 6.11L0 24l6.105-1.604a11.845 11.845 0 005.937 1.587h.005c6.712 0 12.05-5.333 12.056-12.048a11.823 11.823 0 00-3.626-8.526z"/>
        </svg>
      </a>
    </div>
  );
}
