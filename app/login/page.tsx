'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createOrganizationAction, OrgData } from '@/app/actions/auth'
import Link from 'next/link'
import Cropper from 'react-easy-crop'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Login fields
  const [loginId, setLoginId] = useState('') // Aceita Email ou CNPJ
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Registration fields
  const [regData, setRegData] = useState({
    cnpj: '',
    companyName: '', // Razão Social
    fantasyName: '', // Nome Fantasia
    phone: '', // WhatsApp
    email: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: '',
  })
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Avatar/Logo cropper state
  const [avatarFile, setAvatarFile] = useState<string | null>(null)
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar se é Admin (dono de organização)
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (org) {
          router.replace('/admin');
          return;
        }

        // Caso contrário, verificar Perfil (cliente/outro)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, must_change_password')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.must_change_password) {
            router.replace('/change-password');
          } else {
            router.replace(profile.role === 'admin' ? '/admin' : '/client');
          }
        }
      }
    };
    checkSession();
  }, [router]);

  const updateRegData = (field: string, value: string) => {
    setRegData(prev => ({ ...prev, [field]: value }));
  };

  // Funções de Busca (BrasilAPI)
  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
        const data = await res.json();
        if (!data.message) {
          setRegData(prev => ({
            ...prev,
            cep: cleanCep, // guarda limpo
            street: data.street || prev.street,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
        }
      } catch (err) { console.error('Erro na busca de CEP', err) }
    }
  };

  const fetchCnpj = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length === 14) {
      // Indicador visual opcional de carregamento, mas vamos deixar transparecer rápido.
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        const data = await res.json();
        if (!data.message) {
          setRegData(prev => {
            const cepLimpo = data.cep ? String(data.cep).replace(/\D/g, '') : prev.cep;
            return {
              ...prev,
              cnpj: cleanCnpj, // guarda limpo
              companyName: data.razao_social || prev.companyName,
              fantasyName: data.nome_fantasia || '', // Não puxar mais a razão social automática
              phone: data.ddd_telefone_1 || prev.phone,
              email: data.email || prev.email,
              cep: cepLimpo,
              street: data.logradouro || prev.street,
              number: data.numero || prev.number,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.municipio || prev.city,
              state: data.uf || prev.state,
            }
          });
        }
      } catch (err) { console.error('Erro na busca de CNPJ', err) }
    }
  };

  // Avatar/Logo handling
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setAvatarFile(reader.result?.toString() || null);
        setShowCropper(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImage = async (): Promise<string> => {
    const image = new Image();
    image.src = avatarFile!;
    await new Promise(r => (image.onload = r));

    const canvas = document.createElement('canvas');
    const size = 256; // Melhor qualidade para logo
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; // fundo branco previne PNG transparente zoado
    ctx.fillRect(0,0,size,size);
    ctx.drawImage(
      image,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, size, size
    );
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCropConfirm = async () => {
    const cropped = await getCroppedImage();
    setCroppedAvatar(cropped);
    setShowCropper(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let authEmail = loginId.trim();
      const cleanLoginId = authEmail.replace(/\D/g, '');
      
      // Se tiver 14 dígitos, assumimos ser CNPJ e buscamos o E-mail via banco
      if (cleanLoginId.length === 14) {
        const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_cnpj', { p_cnpj: cleanLoginId });
        if (rpcError) throw new Error('Falha ao buscar e-mail vinculado a este CNPJ.');
        if (!foundEmail) throw new Error('CNPJ não encontrado em nossa base de dados.');
        authEmail = foundEmail;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: authEmail, password })
      if (authError) throw authError

      if (data?.session) {
        document.cookie = `sb_token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }

      // NOVO: Usar RPC unificada para descobrir o destino (Admin vs Cliente)
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', { p_user_id: data.user.id });

      if (roleError) console.error('Role check error:', roleError);

      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'client') {
        router.push('/client');
      } else {
        // Se não tem papel definido, pode ser um logout por segurança ou redirecionar p/ início
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciais incorretas.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const cleanCnpj = regData.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return setError('CNPJ inválido.');
    if (regData.password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (regData.password !== regData.confirmPassword) return setError('As senhas não coincidem.');

    setLoading(true)

    try {
      // 1. Criar Auth.User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regData.email.trim(),
        password: regData.password,
        options: {
          data: {
            full_name: regData.companyName || regData.fantasyName,
            is_org_owner: true, // Flag para o trigger saltar a criação de profile
            role: 'admin',
          }
        }
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Não foi possível registrar o usuário. Tente novamente.')

      // Opcional: já salvar cookie caso retorne sessão (auto login)
      if (authData.session) {
        document.cookie = `sb_token=${authData.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }

      // 2. Chamar Server Action para criar Organization e fazer Link c/ perfil
      const payload: OrgData = {
        userId: authData.user.id,
        orgName: regData.fantasyName || regData.companyName,
        cnpj: cleanCnpj,
        companyName: regData.companyName,
        fantasyName: regData.fantasyName,
        phone: regData.phone,
        email: regData.email.trim(),
        cep: regData.cep,
        street: regData.street,
        number: regData.number,
        neighborhood: regData.neighborhood,
        city: regData.city,
        state: regData.state,
        notes: regData.notes,
        logoBase64: croppedAvatar,
      };

      await createOrganizationAction(payload);

      setSuccess('Cadastro concluído com sucesso! Entrando...')
      // Se houve sessão imediata, redireciona, caso contrário manda pro login
      if (authData.session) {
         router.push('/admin');
      } else {
         setIsLogin(true);
         setLoginId(regData.email.trim());
         setPassword(regData.password); // Só pra facilitar na interface
         setSuccess('Cadastro criado! Faça o login para prosseguir.');
      }
    } catch (err: any) {
      // Se ocorreu um erro na Action (ex: CNPJ duplicado), o auth.users já foi criado, na prática. 
      // Mas o erro será exibido aqui para o dono notar.
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stateOptions = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  const inputClass = "w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-600 transition-all text-sm";
  const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/5 rounded-full blur-[120px] -z-10" />

      {/* Cabeçalho isolado do formulário, igual a versões modernas */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white tracking-tight">Fixar SaaS</h1>
        <p className="text-sm font-medium text-primary-500 mt-1 uppercase tracking-widest">Portal de Gestão</p>
      </div>

      <div className={`w-full bg-navy-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl transition-all duration-500 ${isLogin ? 'max-w-md' : 'max-w-3xl'}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white">{isLogin ? 'Bem-vindo de volta' : 'Nova Conta Empresarial'}</h2>
          <p className="text-slate-400 text-sm mt-2">{isLogin ? 'Acesse seu painel com E-mail ou CNPJ' : 'Crie seu ambiente 100% exclusivo e multi-tenant.'}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500 animate-shake">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 text-emerald-500">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm">{success}</p>
          </div>
        )}

        {isLogin ? (
          // ================= LOGIN FORM =================
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={labelClass}>E-mail ou CNPJ</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500">account_circle</span>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className={`${inputClass} pl-12`}
                  placeholder="Seu e-mail ou CNPJ"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-12 pr-12`}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link href="/recuperar-senha" className="text-xs font-bold text-primary-500 hover:text-primary-400 transition-colors cursor-pointer">
                Recuperar Senha?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
              {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-lg">login</span>Entrar no Sistema</>}
            </button>
          </form>
        ) : (
          // ================= REGISTER FORM =================
          <form onSubmit={handleRegister} className="space-y-6 animate-fade-in relative">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Left Column: Logo & Visual */}
              <div className="lg:col-span-1 flex flex-col items-center gap-3">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center w-full">Logo da Empresa</label>
                <div 
                  className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-slate-700 bg-navy-950 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all outline-none group relative overflow-hidden shadow-xl"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  {croppedAvatar ? (
                    <img src={croppedAvatar} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 group-hover:text-primary-500 transition-colors p-4 text-center">
                      <span className="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                      <span className="text-[10px] font-bold uppercase leading-tight">Escolher<br/>Imagem</span>
                    </div>
                  )}
                  {croppedAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">edit</span>
                    </div>
                  )}
                </div>
                <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              </div>

              {/* Right Column: Fields */}
              <div className="lg:col-span-3 space-y-5">
                
                {/* 1. Empresa info */}
                <div className="p-4 bg-navy-950/50 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase text-primary-500 tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">domain</span> Dados da Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>CNPJ *</label>
                      <input type="text" value={regData.cnpj} onChange={(e) => updateRegData('cnpj', e.target.value)} onBlur={(e) => fetchCnpj(e.target.value)} className={inputClass} placeholder="Digite o CNPJ (Busca Automática)" required />
                    </div>
                    <div>
                      <label className={labelClass}>Nome Fantasia</label>
                      <input type="text" value={regData.fantasyName} onChange={(e) => updateRegData('fantasyName', e.target.value)} className={inputClass} placeholder="Automático ou manual" required />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Razão Social</label>
                    <input type="text" value={regData.companyName} onChange={(e) => updateRegData('companyName', e.target.value)} className={inputClass} placeholder="Razão social da empresa" />
                  </div>
                </div>

                {/* 2. Endereço */}
                <div className="p-4 bg-navy-950/50 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase text-primary-500 tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">pin_drop</span> Endereço</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1 lg:col-span-1">
                      <label className={labelClass}>CEP</label>
                      <input type="text" value={regData.cep} onChange={(e) => updateRegData('cep', e.target.value)} onBlur={(e) => fetchCep(e.target.value)} className={inputClass} placeholder="00000-000" />
                    </div>
                    <div className="col-span-1 lg:col-span-3">
                      <label className={labelClass}>Rua / Logradouro</label>
                      <input type="text" value={regData.street} onChange={(e) => updateRegData('street', e.target.value)} className={inputClass} placeholder="Rua..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className={labelClass}>Número</label>
                      <input type="text" value={regData.number} onChange={(e) => updateRegData('number', e.target.value)} className={inputClass} placeholder="Nº" required/>
                    </div>
                    <div className="col-span-1 lg:col-span-1">
                      <label className={labelClass}>Bairro</label>
                      <input type="text" value={regData.neighborhood} onChange={(e) => updateRegData('neighborhood', e.target.value)} className={inputClass} placeholder="Bairro" />
                    </div>
                    <div className="col-span-1 lg:col-span-1">
                      <label className={labelClass}>Cidade</label>
                      <input type="text" value={regData.city} onChange={(e) => updateRegData('city', e.target.value)} className={inputClass} placeholder="Cidade" />
                    </div>
                    <div className="col-span-1 lg:col-span-1">
                      <label className={labelClass}>Estado</label>
                      <select value={regData.state} onChange={(e) => updateRegData('state', e.target.value)} className={inputClass}>
                        <option value="" className="bg-navy-900">UF</option>
                        {stateOptions.map(s => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Contato e Senha */}
                <div className="p-4 bg-navy-950/50 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase text-primary-500 tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">contact_mail</span> Contato de Acesso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>WhatsApp Pessoal/Empresa</label>
                      <input type="tel" value={regData.phone} onChange={(e) => updateRegData('phone', e.target.value)} className={inputClass} placeholder="(00) 00000-0000" required/>
                    </div>
                    <div>
                      <label className={labelClass}>E-mail de Login *</label>
                      <input type="email" value={regData.email} onChange={(e) => updateRegData('email', e.target.value)} className={inputClass} placeholder="comercial@empresa.com" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                    <div>
                      <label className={labelClass}>Senha de Acesso *</label>
                      <div className="relative">
                        <input type={showRegPassword ? "text" : "password"} value={regData.password} onChange={(e) => updateRegData('password', e.target.value)} className={`${inputClass} pr-12`} placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                          <span className="material-symbols-outlined text-[20px]">{showRegPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Repetir Senha *</label>
                      <input type={showRegPassword ? "text" : "password"} value={regData.confirmPassword} onChange={(e) => updateRegData('confirmPassword', e.target.value)} className={inputClass} placeholder="••••••••" required />
                    </div>
                  </div>
                </div>
                
                {/* 4. Notas */}
                <div>
                  <label className={labelClass}>Anotações (Opcional)</label>
                  <textarea value={regData.notes} onChange={(e) => updateRegData('notes', e.target.value)} className={`${inputClass} resize-none h-20 bg-navy-950`} placeholder="Qualquer detalhe extra sobre a assinatura..." />
                </div>

              </div>
            </div>

            <div className="pt-4 sticky bottom-0 bg-navy-900 pb-2">
              <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-primary-600/20">
                {loading ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-xl">business_center</span>Criar Minha Empresa no SaaS</>}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-sm font-medium">
            {isLogin ? 'Nova empresa?' : 'Já possui uma conta ativa?'}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="ml-2 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">
              {isLogin ? 'Cadastrar Minha Empresa' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>

      {/* ====== AVATAR/LOGO CROPPER MODAL ====== */}
      {showCropper && avatarFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-navy-900 rounded-3xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 text-center">
              <h3 className="text-lg font-black text-white">Recortar Logotipo</h3>
              <p className="text-xs text-slate-400 mt-1">Ajuste o quadrado para isolar sua marca.</p>
            </div>
            <div className="relative h-72 bg-navy-950">
              <Cropper
                image={avatarFile}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-5 bg-navy-900 flex flex-col gap-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">zoom_in</span>
                <input
                  type="range" min={1} max={3} step={0.1} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary-600"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCropper(false)} className="flex-1 btn bg-slate-800 hover:bg-slate-700 text-white py-3">Cancelar</button>
                <button onClick={handleCropConfirm} className="flex-1 btn btn-primary py-3 font-bold">Salvar Logo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
