'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { getOrganizationContext } from '@/lib/auth-context';

/**
 * Fetch all service items
 */
export async function getServices() {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching service items:', error);
        return [];
    }
    return data;
}

/**
 * Admin: Create a new service item
 */
export async function adminCreateService(formData: any) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    // Ensure numeric price
    const price = parseFloat(formData.price) || 0;

    const { data, error } = await supabase
        .from('service_items')
        .insert({
            organization_id: organizationId,
            name: formData.name,
            description: formData.description,
            price: price,
            estimated_time: formData.estimated_time || null,
            image_url: formData.image_url || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating service item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true, service: data };
}

/**
 * Admin: Update an existing service item
 */
export async function adminUpdateService(serviceId: string, formData: any) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    // Ensure numeric price
    const price = parseFloat(formData.price) || 0;

    const { data, error } = await supabase
        .from('service_items')
        .update({
            name: formData.name,
            description: formData.description,
            price: price,
            estimated_time: formData.estimated_time || null,
            image_url: formData.image_url || null
        })
        .eq('id', serviceId)
        .eq('organization_id', organizationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating service item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true, service: data };
}

/**
 * Admin: Delete a service item
 */
export async function adminDeleteService(serviceId: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', serviceId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error deleting service item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true };
}
