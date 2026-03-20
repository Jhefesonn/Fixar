'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getOrganizationContext } from '@/lib/auth-context';

export async function adminCreateClient(formData: any) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, full_name, password = 'temp123' } = formData;

    const { organizationId } = await getOrganizationContext();
    console.log(`SaaS: Creating client for org ${organizationId}`);

    // 1. Create the auth user. 
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'temp123',
      email_confirm: true,
      user_metadata: {
        ...formData,
        organization_id: organizationId,
        role: 'client',
        must_change_password: true,
      }
    });

    if (error) throw error;

    return { success: true, user: data.user, tempPassword: password };
  } catch (err: any) {
    console.error('Error in adminCreateClient:', err);
    throw new Error(err.message || 'Falha ao criar usuário.');
  }
}

export async function adminUpdateClient(userId: string, formData: any) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Update auth user metadata (only update email if provided)
    const authUpdate: any = { user_metadata: formData };
    if (formData.email) {
      authUpdate.email = formData.email;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);

    if (authError) throw authError;

    // 2. Build profile update object, only including fields that are present in formData
    const profileUpdate: any = { updated_at: new Date().toISOString() };
    
    const profileFields = [
      'full_name', 'email', 'whatsapp', 'document', 'source',
      'cep', 'street', 'number', 'complement', 'neighborhood',
      'city', 'state', 'notes', 'avatar_url', 'contacts'
    ];

    for (const field of profileFields) {
      if (formData[field] !== undefined) {
        profileUpdate[field] = formData[field];
      }
    }

    // Handle birthday separately (convert empty string to null)
    if (formData.birthday !== undefined) {
      profileUpdate.birthday = formData.birthday || null;
    }

    const { organizationId } = await getOrganizationContext();

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)
      .eq('organization_id', organizationId); // Segurança extra

    if (profileError) throw profileError;

    return { success: true };
  } catch (err: any) {
    console.error('Error in adminUpdateClient:', err);
    throw new Error(err.message || 'Falha ao atualizar usuário.');
  }
}

export async function adminDeleteClient(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { organizationId } = await getOrganizationContext();

    // Verificação de segurança: usuário pertence à mesma org?
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profile?.organization_id !== organizationId) {
      throw new Error('Acesso negado: o cliente não pertence à sua organização.');
    }
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error in adminDeleteClient:', err);
    throw new Error(err.message || 'Falha ao excluir usuário.');
  }
}

export async function getCurrentOrgId() {
  try {
    const { organizationId } = await getOrganizationContext();
    return organizationId;
  } catch (err) {
    return null;
  }
}

export async function publicCreateClient(formData: any, orgId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password = 'temp123' } = formData;

    if (!orgId) throw new Error('ID da empresa (org) é obrigatório.');

    // Create the auth user. The trigger handle_new_user() will create the profile.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: {
        ...formData,
        organization_id: orgId, // This is crucial for multi-tenant linking
        role: 'client',
        must_change_password: true,
      }
    });

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Error in publicCreateClient:', err);
    throw new Error(err.message || 'Falha ao criar cadastro. Verifique os dados ou se já existe conta com este email.');
  }
}

export async function getInviteOrgDetails(orgId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  let orgName = 'Nossa Empresa';
  let logoUrl = null;
  let ownerId = null;

  try {
    const { data: org } = await supabaseAdmin.from('organizations').select('name, owner_id, logo_url').eq('id', orgId).single();
    if (org) {
       orgName = org.name;
       ownerId = org.owner_id;
       if (org.logo_url) logoUrl = org.logo_url;
    }
  } catch (err) {
    console.error('Error fetching org:', err);
  }

  try {
    if (!logoUrl) {
      const { data: site } = await supabaseAdmin.from('site_config').select('logo_url').eq('id', 1).maybeSingle();
      if (site?.logo_url) {
         logoUrl = site.logo_url;
      } else if (ownerId) {
         const { data: profile } = await supabaseAdmin.from('profiles').select('avatar_url').eq('id', ownerId).maybeSingle();
         if (profile?.avatar_url) {
             logoUrl = profile.avatar_url;
         }
      }
    }
  } catch (err) {
    console.error('Error fetching site_config logo:', err);
  }

  return { name: orgName, logoUrl };
}
