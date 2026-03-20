import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuração do Supabase incompleta: verifique variáveis de ambiente');
}

// Evita quebra fatal no momento de build (como no Vercel) caso as chaves estejam com formato errado (sem https://)
let supabaseClient = {} as ReturnType<typeof createClient>;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.warn('Falha silenciosa ao criar Supabase Client no build:', e);
}
export const supabase = supabaseClient;
