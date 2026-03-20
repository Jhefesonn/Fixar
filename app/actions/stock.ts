'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { getOrganizationContext } from '@/lib/auth-context';

/**
 * Fetch all stock items
 */
export async function getStockItems() {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching stock items:', error);
        return [];
    }
    return data;
}

/**
 * Admin: Create a new stock item
 */
export async function adminCreateStockItem(formData: any) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
        .from('stock_items')
        .insert({
            organization_id: organizationId,
            name: formData.name,
            details: formData.details || null,
            barcode: formData.barcode || null,
            internal_code: formData.internal_code || null,
            brand: formData.brand || null,
            unit: formData.unit || 'UN',
            cost_price: parseFloat(formData.cost_price) || 0,
            unit_price: parseFloat(formData.unit_price) || 0,
            profit_margin: parseFloat(formData.profit_margin) || 0,
            markup_percentage: parseFloat(formData.markup_percentage) || 0,
            current_quantity: parseFloat(formData.current_quantity) || 0,
            min_quantity: parseFloat(formData.min_quantity) || 0,
            image_url: formData.image_url || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating stock item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true, item: data };
}

/**
 * Admin: Update an existing stock item
 */
export async function adminUpdateStockItem(itemId: string, formData: any) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
        .from('stock_items')
        .update({
            name: formData.name,
            details: formData.details || null,
            barcode: formData.barcode || null,
            internal_code: formData.internal_code || null,
            brand: formData.brand || null,
            unit: formData.unit || 'UN',
            cost_price: parseFloat(formData.cost_price) || 0,
            unit_price: parseFloat(formData.unit_price) || 0,
            profit_margin: parseFloat(formData.profit_margin) || 0,
            markup_percentage: parseFloat(formData.markup_percentage) || 0,
            current_quantity: parseFloat(formData.current_quantity) || 0,
            min_quantity: parseFloat(formData.min_quantity) || 0,
            image_url: formData.image_url || null
        })
        .eq('id', itemId)
        .eq('organization_id', organizationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating stock item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true, item: data };
}

/**
 * Admin: Delete a stock item
 */
export async function adminDeleteStockItem(itemId: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', itemId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error deleting stock item:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    return { success: true };
}

/**
 * Admin: Restock item with Average Cost calculation
 */
export async function adminRestockItem(itemId: string, newQuantity: number, newCost: number, newMargin?: number) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    
    // 1. Get current data
    const { data: item, error: getError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('id', itemId)
        .eq('organization_id', organizationId)
        .single();
        
    if (getError || !item) throw new Error('Item não encontrado para reposição');

    const currentQty = parseFloat(item.current_quantity) || 0;
    const currentCost = parseFloat(item.cost_price) || 0;
    const margin = newMargin !== undefined ? newMargin : (parseFloat(item.profit_margin) || 0);

    // 2. Calculate Weighted Average Cost
    const totalQty = currentQty + newQuantity;
    let averageCost = newCost;
    
    if (totalQty > 0) {
        averageCost = ((currentQty * currentCost) + (newQuantity * newCost)) / totalQty;
    }

    // 3. Recalculate Unit Price (Sales Price) keeping the new or same MARGIN
    // Price = AverageCost / (1 - Margin/100)
    let newUnitPrice = averageCost;
    if (margin < 100) {
        newUnitPrice = averageCost / (1 - (margin / 100));
    }

    // 4. Update item
    const { error: updateError } = await supabase
        .from('stock_items')
        .update({
            current_quantity: totalQty,
            cost_price: averageCost,
            unit_price: newUnitPrice,
            profit_margin: margin,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('organization_id', organizationId);

    if (updateError) throw new Error(updateError.message);
    
    revalidatePath('/admin');
    return { success: true };
}
