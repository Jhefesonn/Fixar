import { supabase } from './supabase'
import { getSupabaseAdmin } from './supabase-admin'
import { cookies } from 'next/headers'

/**
 * Retorna o organization_id do usuário logado.
 * Deve ser usado apenas em Server Actions ou Server Components.
 */
export async function getOrganizationContext(tokenOverride?: string) {
  const cookieStore = await cookies();
  const token = tokenOverride || cookieStore.get('sb_token')?.value;

  if (!token) {
    throw new Error('AUTH_SESSION_MISSING');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('AUTH_SESSION_EXPIRED');
  }

  // Consulta o vínculo organizacional através do supabaseAdmin
  const supabaseAdmin = getSupabaseAdmin();
  
  // 1. Verificar se é Dono de Organização (Admin)
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (org) {
    return {
      organizationId: org.id,
      userId: user.id,
      role: 'admin'
    };
  }

  // 2. Fallback: Verificar se é Cliente/Funcionário (Profile)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    console.error(`Auth Context: No organization link found for user ${user.id}`);
    throw new Error('Usuário sem organização vinculada');
  }

  return { 
    organizationId: profile.organization_id, 
    userId: user.id,
    role: profile.role 
  };
}
