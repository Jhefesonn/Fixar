'use client';

import React, { useState, useEffect, use } from 'react';
import { publicCreateClient, getInviteOrgDetails } from '@/app/actions/clients';
import ClientForm from '@/components/ClientForm';
import { Manrope, Work_Sans } from 'next/font/google';

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

export default function InvitePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [orgDetails, setOrgDetails] = useState<{name: string, logoUrl: string | null} | null>(null);

  useEffect(() => {
    getInviteOrgDetails(orgId).then(details => {
      setOrgDetails(details);
    }).catch(console.error);
  }, [orgId]);

  const handleSaveClient = async (formData: any) => {
    setSaving(true);
    setError(null);
    try {
      await publicCreateClient(formData, orgId);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className={`${manrope.variable} ${workSans.variable} font-body bg-navy-950 min-h-screen text-white flex flex-col items-center justify-center p-4 selection:bg-primary-500/30`}>
        <div className="bg-navy-900 border border-emerald-500/20 rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-12 max-w-lg w-full text-center animate-fade-in">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-black mb-4">Cadastro Concluído!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Seus dados foram enviados com sucesso para <strong className="text-white">{orgDetails?.name || 'a empresa responsável'}</strong>. Você já pode acessar a plataforma utilizando o seu e-mail cadastrado e a senha temporária.
          </p>
          <div className="bg-navy-950/50 border border-slate-800 rounded-2xl p-4 inline-block mb-8">
            <span className="text-xs text-slate-500 block mb-1 uppercase tracking-widest font-bold">Sua senha temporária</span>
            <span className="text-xl font-mono text-white tracking-[0.2em] font-black">temp123</span>
          </div>
          <br/>
          <a href="/login" className="inline-block px-8 py-4 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
            Ir para o Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${manrope.variable} ${workSans.variable} font-body bg-navy-950 min-h-screen text-white flex flex-col items-center justify-center py-12 px-4 selection:bg-primary-500/30 relative overflow-hidden`}>
      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-8 animate-fade-in mt-12 md:mt-20 mb-12">
        
        {/* Header Public Invite */}
        <div className="text-center space-y-4 mb-4">
          {orgDetails?.logoUrl ? (
             <img src={orgDetails.logoUrl} alt={orgDetails.name} className="h-16 w-auto mx-auto object-contain rounded-xl shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4" />
          ) : (
             <div className="h-16 w-16 mx-auto bg-primary-600/20 text-primary-500 rounded-2xl flex items-center justify-center border border-primary-500/30 mb-4 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
               <span className="material-symbols-outlined text-3xl">domain</span>
             </div>
          )}
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 leading-tight">
             Bem-vindo(a)!
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
             Você foi convidado(a) por <strong className="text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">{orgDetails?.name || 'Carregando...'}</strong> para se cadastrar na plataforma.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-3xl text-sm font-bold flex items-center gap-3 animate-slide-in">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Formulário Wrapper */}
        <div className="bg-navy-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-10 relative">
          
          <ClientForm 
            onSubmit={handleSaveClient}
            onCancel={() => window.history.back()}
            loading={saving}
            publicInviteWarning={true}
          />
          
        </div>
      </div>
      
      {/* Decoração de fundo premium */}
      <div className="absolute top-0 left-0 w-full h-[60vh] overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-primary-900/20 to-transparent"></div>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}
