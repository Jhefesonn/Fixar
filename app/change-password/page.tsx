'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (authError) throw authError;

      // Update must_change_password flag
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', session.user.id);
        if (profileError) throw profileError;
      }

      // Redirect to appropriate dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session!.user.id)
        .single();

      router.replace(profile?.role === 'admin' ? '/admin' : '/client');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-600/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full bg-navy-900 rounded-3xl p-10 border border-slate-800 shadow-2xl">
        <div className="text-center mb-10">
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-primary-600/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-600 text-3xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Alterar Senha</h1>
          <p className="text-slate-400 text-sm">
            Por segurança, crie uma nova senha para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-600 transition-all"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-600 transition-all"
              placeholder="Repita a nova senha"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check</span>
                Salvar Nova Senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
