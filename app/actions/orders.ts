'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { generateFinancialRecordForOrder } from './financial';
import { getOrganizationContext } from '@/lib/auth-context';

/**
 * Fetch all orders with client and equipment details
 */
export async function getOrders() {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            client:profiles!client_id(id, full_name, role, whatsapp, document, contacts, cep, street, number, complement, neighborhood, city, state),
            equipment:equipments(id, name, tag)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return data;
}

/**
 * Fetch a single order with services and parts
 */
export async function getOrderDetails(orderId: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    console.log(`[getOrderDetails] Buscando pedido: ${orderId} (Org: ${organizationId})`);
    
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            client:profiles!client_id(id, full_name, whatsapp, document, avatar_url, contacts, cep, street, number, complement, neighborhood, city, state),
            equipment:equipments(id, name, tag),
            services:order_services(*),
            parts:order_parts(*),
            organization:organizations(logo_url, report_logo_url, logo_size, report_logo_size)
        `)
        .eq('id', orderId)
        .eq('organization_id', organizationId)
        .single();

    if (orderError) {
        console.error('[getOrderDetails] Erro ao buscar detalhes:', orderError);
        return null;
    }
    
    if (order) {
        console.log(`[getOrderDetails] Pedido encontrado com ${(order.services || []).length} serviços e ${(order.parts || []).length} peças`);
    }
    
    return order;
}

/**
 * Admin: Create a new order with services and parts
 */
export async function adminCreateOrder(formData: any, services: any[], parts: any[]) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    // 1. Create the base order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            organization_id: organizationId,
            name: formData.name,
            client_id: formData.client_id,
            equipment_id: formData.equipment_id,
            description: formData.description || null,
            validity_days: parseInt(formData.validity_days) || 30,
            notes: formData.notes || null,
            image_url: formData.image_url || null,
            status: 'pending',
            scheduled_at: formData.scheduled_at || null,
            technician_id: formData.technician_id || null,
            priority: formData.priority || 'medium'
        })
        .select()
        .single();

    if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(orderError.message);
    }

    // 2. Add services
    if (services && services.length > 0) {
        const servicesToInsert = services.map(s => ({
            organization_id: organizationId,
            order_id: order.id,
            service_item_id: s.id,
            name: s.name,
            description: s.description || null,
            price: parseFloat(s.price) || 0,
            quantity: parseFloat(s.quantity) || 1,
            unit: s.unit || 'un.'
        }));

        const { error: servicesError } = await supabase
            .from('order_services')
            .insert(servicesToInsert);

        if (servicesError) {
            console.error('Error adding order services:', servicesError);
        }
    }

    // 3. Add parts
    if (parts && parts.length > 0) {
        const partsToInsert = parts.map(p => ({
            organization_id: organizationId,
            order_id: order.id,
            stock_item_id: p.id,
            name: p.name,
            price: parseFloat(p.unit_price) || 0,
            quantity: parseFloat(p.quantity) || 1,
            unit: p.unit || 'un.'
        }));

        const { error: partsError } = await supabase
            .from('order_parts')
            .insert(partsToInsert);

        if (partsError) {
            console.error('Error adding order parts:', partsError);
        }
    }

    revalidatePath('/admin');
    return { success: true, order };
}

/**
 * Admin: Update an existing order
 */
export async function adminUpdateOrder(orderId: string, formData: any, services: any[], parts: any[]) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    // 1. Update the base order
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            name: formData.name,
            client_id: formData.client_id,
            equipment_id: formData.equipment_id,
            description: formData.description || null,
            validity_days: parseInt(formData.validity_days) || 30,
            notes: formData.notes || null,
            image_url: formData.image_url || null,
            status: formData.status || 'pending',
            scheduled_at: formData.scheduled_at || null,
            technician_id: formData.technician_id || null,
            priority: formData.priority || 'medium'
        })
        .eq('id', orderId)
        .eq('organization_id', organizationId);

    if (orderError) {
        console.error('[adminUpdateOrder] Erro ao atualizar cabeçalho:', orderError);
        throw new Error(orderError.message);
    }

    // DEBUG: Check order_services columns
    const { data: colsCheck } = await supabase.from('order_services').select('*').limit(1);
    console.log('[DEBUG] Colunas em order_services:', colsCheck && colsCheck[0] ? Object.keys(colsCheck[0]) : 'Tabela vazia ou erro');

    // 2. Refresh services (Delete and re-insert)
    console.log(`[adminUpdateOrder] Atualizando ${services?.length || 0} serviços`);
    
    const servicesToInsert = (services || []).map(s => ({
        organization_id: organizationId,
        order_id: orderId,
        service_item_id: s.service_item_id || s.id,
        name: s.name,
        description: s.description || null,
        price: parseFloat(s.price) || 0,
        quantity: parseFloat(s.quantity) || 1,
        unit: s.unit || 'UN'
    }));

    // Deletar antigos e inserir novos
    const { error: deleteServicesError } = await supabase.from('order_services').delete().eq('order_id', orderId);
    if (deleteServicesError) {
        console.error('Error deleting services:', deleteServicesError);
        throw new Error(`Erro ao remover serviços antigos: ${deleteServicesError.message}`);
    }

    if (servicesToInsert.length > 0) {
        const { error: insertServicesError } = await supabase.from('order_services').insert(servicesToInsert);
        if (insertServicesError) {
            console.error('Error inserting services:', insertServicesError);
            throw new Error(`Erro ao salvar novos serviços: ${insertServicesError.message}`);
        }
    }

    // 3. Refresh parts (Delete and re-insert)
    console.log(`[adminUpdateOrder] Atualizando ${parts?.length || 0} peças`);
    
    const partsToInsert = (parts || []).map(p => ({
        organization_id: organizationId,
        order_id: orderId,
        stock_item_id: p.stock_item_id || p.id,
        name: p.name,
        price: parseFloat(p.price || p.unit_price || 0),
        quantity: parseFloat(p.quantity || 1),
        unit: p.unit || 'UN'
    }));

    const { error: deletePartsError } = await supabase.from('order_parts').delete().eq('order_id', orderId);
    if (deletePartsError) {
        console.error('Error deleting parts:', deletePartsError);
        throw new Error(`Erro ao remover peças antigas: ${deletePartsError.message}`);
    }

    if (partsToInsert.length > 0) {
        const { error: insertPartsError } = await supabase.from('order_parts').insert(partsToInsert);
        if (insertPartsError) {
            console.error('Error inserting parts:', insertPartsError);
            throw new Error(`Erro ao salvar novas peças: ${insertPartsError.message}`);
        }
    }

    revalidatePath('/admin');
    revalidatePath(`/admin/orders/${orderId}`);

    // Generate financial record if completed
    if (formData.status === 'completed') {
        try {
            await generateFinancialRecordForOrder(orderId);
        } catch (e) {
            console.error('[adminUpdateOrder] Failed to auto-generate financial record:', e);
        }
    }

    return { success: true };
}

/**
 * Admin: Delete an order
 */
export async function adminDeleteOrder(orderId: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error deleting order:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true };
}

/**
 * Admin: Update only the status of an order
 */
export async function adminUpdateOrderStatus(orderId: string, status: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error updating order status:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');

    // Generate financial record if completed
    if (status === 'completed') {
        try {
            await generateFinancialRecordForOrder(orderId);
        } catch (e) {
            console.error('[adminUpdateOrderStatus] Failed to auto-generate financial record:', e);
        }
    }

    return { success: true };
}

/**
 * Fetch orders associated with a specific equipment
 */
export async function getOrdersByEquipmentId(equipmentId: string) {
    noStore();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            client:profiles!client_id(id, full_name),
            equipment:equipments(id, name, tag)
        `)
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders by equipment:', error);
        return [];
    }
    return data;
}
