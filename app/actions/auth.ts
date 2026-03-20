'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { supabase as supabaseClient } from '@/lib/supabase'

export interface OrgData {
  userId: string;
  orgName: string;
  cnpj: string;
  companyName: string;
  fantasyName: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  logoBase64?: string | null;
}

export async function createOrganizationAction(data: OrgData) {
  const supabaseAdmin = getSupabaseAdmin()
  
  // 1. Upload Logo se base64 for enviado
  let logo_url = null;
  if (data.logoBase64) {
    try {
      const base64Data = data.logoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `logo-${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        });
        
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(filename);
        logo_url = publicUrl;
      } else {
        console.error('Falha ao upar logo no storage:', uploadError);
      }
    } catch (e) {
      console.error('Erro na manipulação da imagem (base64 -> buffer):', e);
    }
  }

  // 2. Create Organization with owner_id
  const slug = data.orgName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ 
      name: data.orgName, 
      slug,
      owner_id: data.userId, // Novo vínculo direto
      cnpj: data.cnpj,
      company_name: data.companyName,
      fantasy_name: data.fantasyName,
      phone: data.phone,
      email: data.email,
      cep: data.cep,
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      notes: data.notes,
      logo_url
    })
    .select()
    .maybeSingle()

  if (orgError) {
    console.error('Erro ao criar organização:', orgError)
    throw new Error('Falha ao criar organização. Tente outro nome ou CNPJ.')
  }

  // O passo 3 (Link Profile) não é mais necessário para o admin criador,
  // pois ele agora é o owner_id da organization e não possui linha no profiles.
  return { success: true, organizationId: org.id }
}

export async function checkUserOrganization(userId: string) {
  // Busca primeiro como owner (admin)
  const { data: orgAdmin, error: adminError } = await supabaseClient
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (orgAdmin) return { organization_id: orgAdmin.id, role: 'admin' }

  // Se não for admin, busca como cliente (perfil)
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) return null
  return profile
}
