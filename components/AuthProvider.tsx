'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['jhefesonn@hotmail.com', 'fixar.tec@hotmail.com'];

type Profile = {
  id: string;
  role: 'admin' | 'client';
  full_name: string;
  email: string;
  avatar_url: string | null;
  must_change_password: boolean;
  whatsapp?: string;
  document?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  birthday?: string;
  notes?: string;
  organization_id?: string;
  organizations?: { 
    id: string;
    name: string;
    cnpj: string;
    company_name: string;
    fantasy_name: string;
    phone: string;
    email: string;
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    notes: string;
    logo_url: string;
    report_logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    report_footer?: string;
    plan: string;
  } | null;
};

type AuthContextType = {
  user: any;
  profile: Profile | null;
  loading: boolean;
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isProfileLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'client';
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const fetchingProfileFor = React.useRef<string | null>(null);
  const router = useRouter();

  const fetchProfile = async (userId: string, userEmail: string) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetch Profile Timeout')), 5000)
    );

    try {
      return await Promise.race([
        (async () => {
          // 1. Usar RPC para identificar o papel (role) do usuário de forma centralizada
          const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', { p_user_id: userId });

          if (roleError) {
            console.error('Auth: Error fetching user role. Verifique se a RPC "get_user_role" existe.', roleError);
            return { data: null, isFallback: true };
          }

          if (userRole === 'admin') {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('owner_id', userId)
              .maybeSingle();

            if (orgData) {
              return {
                data: {
                  id: userId,
                  role: 'admin',
                  full_name: orgData.fantasy_name || orgData.name,
                  email: userEmail,
                  avatar_url: null,
                  must_change_password: false,
                  organization_id: orgData.id,
                  organizations: orgData
                } as Profile,
                isFallback: false
              };
            }
          }

          if (userRole === 'client') {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*, organizations:organizations!left(*)')
              .eq('id', userId)
              .maybeSingle();

            if (profileData) {
              return { data: profileData, isFallback: false };
            }
          }

          return { data: null, isFallback: false };
        })(),
        timeoutPromise
      ]) as any;
    } catch (err) {
      console.error('Auth: fetchProfile failed (could be timeout):', err);
      return { data: null, isFallback: true };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      setIsProfileLoading(true);
      const result = await fetchProfile(user.id, user.email);
      setProfile(result.data);
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const syncAuth = async (session: any) => {
      if (!session) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setIsProfileLoading(false);
          router.replace('/login');
        }
        return;
      }

      const currentUser = session.user;
      if (mounted) setUser(currentUser);

      if (fetchingProfileFor.current === currentUser.id && profile) return;
      fetchingProfileFor.current = currentUser.id;

      if (!profile) setIsProfileLoading(true);

      try {
        const { data: profileData, isFallback } = await fetchProfile(currentUser.id, currentUser.email || '');
        
        if (!mounted) return;

        if (profile && isFallback) {
          // Mantém o perfil anterior em caso de erro temporário
        } else {
          setProfile(profileData);
        }

        // REDIRECIONAMENTO E PROTEÇÃO
        if (profileData) {
          if (profileData.must_change_password) {
            router.replace('/change-password');
            return;
          }

          if (requiredRole && profileData.role !== requiredRole) {
            console.log(`Auth: Redirecting ${profileData.role} to their correct area (required: ${requiredRole})`);
            const target = profileData.role === 'admin' ? '/admin' : '/client';
            router.replace(target);
            return;
          }
        } else {
           // Se não temos profileData, o usuário logado não tem vínculo (nem org nem profile)
           // Se estiver em uma rota protegida, redireciona para login imediatamente.
           if (requiredRole && !isFallback) {
             console.warn('Auth: Logged user has no role determination but is on protected route. Kicking out.');
             router.replace('/login');
             return;
           }
        }
      } catch (err) {
        console.error('Auth: Sync error', err);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsProfileLoading(false);
          fetchingProfileFor.current = null;
        }
      }
    };

    // Helper para salvar cookie
    const setTokenCookie = (session: any) => {
      if (session?.access_token) {
        document.cookie = `sb_token=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = `sb_token=; path=/; max-age=0;`;
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setTokenCookie(session);
      if (mounted) syncAuth(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTokenCookie(session);
      if (mounted) syncAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, requiredRole]);

  const signOut = async () => {
    // Reset local state immediately to avoid UI flickering
    setUser(null);
    setProfile(null);
    setLoading(false);
    
    // Clear cookie
    document.cookie = `sb_token=; path=/; max-age=0;`;
    
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Se estiver carregando OU se a rota exige um papel que ainda não foi confirmado/não bate
  const isAuthorized = !requiredRole || (profile && profile.role === requiredRole);

  if (loading || !isAuthorized) {
    return (
      <div className="bg-navy-950 min-h-screen flex flex-col items-center justify-center gap-4 text-white font-sans">
        <div className="h-12 w-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500 animate-pulse">
          {isAuthorized ? 'Carregando seu ambiente...' : 'Verificando permissões...'}
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isProfileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
