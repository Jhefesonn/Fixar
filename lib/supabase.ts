import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuração do Supabase incompleta: verifique variáveis de ambiente');
}

// Para o TypeScript não se perder nos tipos (erro never), devemos criar o Client normalmente.
// No entanto, para não travar o build na Vercel se a URL vier errada/vazia, damos um "fallback" visual seguro vazio.
const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://build.supabase.co';
const safeKey = supabaseAnonKey || 'build-key';

export const supabase = createClient(safeUrl, safeKey);
