'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getOrganizationContext } from '@/lib/auth-context';
import { unstable_noStore as noStore } from 'next/cache';

export type FinancialRecord = {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  type: 'income' | 'expense';
  category: string;
  client_id: string | null;
  order_id: string | null;
  contract_id: string | null;
  equipment_id: string | null;
  client?: { full_name: string };
  order?: { name: string };
  contract?: { name: string };
  documents?: FinancialDocument[];
};

export type FinancialDocument = {
  id: string;
  created_at: string;
  file_url: string;
  file_name: string;
  document_type: 'invoice' | 'receipt' | 'other';
  notes: string | null;
  record_id: string | null;
  client_id?: string | null;
  order_id?: string | null;
  contract_id?: string | null;
  equipment_id?: string | null;
};

/**
 * Fetch financial summary for dashboard stats
 */
export async function getFinancialSummary(filters?: { startDate?: string; endDate?: string; status?: string; client_id?: string; type?: string }) {
  const { organizationId } = await getOrganizationContext();
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('financial_records')
    .select('amount, status, type, due_date')
    .eq('organization_id', organizationId);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.startDate) query = query.gte('due_date', filters.startDate);
  if (filters?.endDate) query = query.lte('due_date', filters.endDate);

  // Auto-update overdue records before returning summary
  await autoUpdateOverdueRecordsForOrg(organizationId);

  const { data, error } = await query;

  if (error) throw error;

  const summary = {
    totalRevenue: 0,
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    totalExpenses: 0
  };

  data?.forEach(record => {
    if (record.type === 'income') {
      if (record.status === 'paid') summary.totalPaid += Number(record.amount);
      if (record.status === 'pending') summary.totalPending += Number(record.amount);
      if (record.status === 'overdue') summary.totalOverdue += Number(record.amount);
      summary.totalRevenue += Number(record.amount);
    } else {
      summary.totalExpenses += Number(record.amount);
    }
  });

  return summary;
}

export async function getRecentOrders() {
  noStore();
  const { organizationId } = await getOrganizationContext();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, 
      name, 
      client_id, 
      equipment_id,
      client:profiles!client_id(full_name),
      equipment:equipments!equipment_id(name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

/**
 * Get active contracts for financial vinculation
 */
export async function getActiveContracts() {
  noStore();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('equipment_contracts')
    .select(`
      id, 
      name, 
      client_id,
      monthly_price,
      client:profiles!client_id(full_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    monthly_price: c.monthly_price || 0,
    client_id: c.client_id,
    client_name: c.client?.full_name
  }));
}

/**
 * Fetch records with filters and relations
 */
export async function getFinancialRecords(filters?: any) {
  noStore();
  const { organizationId } = await getOrganizationContext();
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('financial_records')
    .select(`
      *,
      client:profiles!client_id(full_name),
      order:orders(id, name),
      contract:equipment_contracts(id, name),
      documents:financial_documents(*)
    `)
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.client_id) query = query.eq('client_id', filters.client_id);
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.startDate) query = query.gte('due_date', filters.startDate);
  if (filters?.endDate) query = query.lte('due_date', filters.endDate);

  // Auto-update overdue records before returning records
  await autoUpdateOverdueRecordsForOrg(organizationId);

  const { data, error } = await query;
  if (error) throw error;
  return data as FinancialRecord[];
}

/**
 * Auto-update records that are past due_date and still pending
 */
export async function autoUpdateOverdueRecordsForOrg(organizationId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('financial_records')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lt('due_date', today);

    if (error) {
      console.error('[autoUpdateOverdueRecords] Error:', error);
    }
  } catch (err) {
    console.error('[autoUpdateOverdueRecords] Catch:', err);
  }
}

/**
 * Upsert a financial record
 */
export async function saveFinancialRecord(record: Partial<FinancialRecord>) {
  try {
    const supabase = getSupabaseAdmin();
    // Filter only valid columns to avoid errors with related objects (client, order, etc)
    const validColumns = [
      'description', 'amount', 'due_date', 'paid_at', 'status', 
      'type', 'category', 'client_id', 'order_id', 'contract_id', 'equipment_id', 'created_at'
    ];
    
    const dataToSave: any = {};
    validColumns.forEach(col => {
      if (record[col as keyof FinancialRecord] !== undefined) {
        dataToSave[col] = record[col as keyof FinancialRecord];
      }
    });

    console.log('[saveFinancialRecord] Data to save:', { 
      description: dataToSave.description, 
      due_date: dataToSave.due_date, 
      created_at: dataToSave.created_at 
    });

    const { organizationId } = await getOrganizationContext();
    const id = record.id;
    const query = id 
      ? supabase.from('financial_records').update({ ...dataToSave, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId)
      : supabase.from('financial_records').insert({ 
          ...dataToSave, 
          organization_id: organizationId,
          created_at: dataToSave.created_at || new Date().toISOString() 
        });

    const { data, error } = await query.select(`
        *,
        client:profiles!client_id(full_name),
        order:orders(id, name),
        contract:equipment_contracts(id, name)
      `)
      .single();

    if (error) {
       console.error('[saveFinancialRecord] Erro detectado:', {
         code: error.code,
         message: error.message,
         details: error.details,
         hint: error.hint
       });
       throw error;
    }
    return data;
  } catch (err: any) {
    console.error('[saveFinancialRecord] Catch:', err);
    throw err;
  }
}

/**
 * Handle document upload and association
 */
export async function saveFinancialDocument(doc: Partial<FinancialDocument>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('financial_documents')
    .upsert(doc)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a record (will cascade to documents)
 */
export async function deleteFinancialRecord(id: string) {
    const { organizationId } = await getOrganizationContext();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
    .from('financial_records')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) throw error;
  return true;
}

/**
 * Quick update for financial record status
 */
export async function updateFinancialStatus(id: string, status: 'pending' | 'paid' | 'cancelled' | 'overdue') {
  try {
    const supabase = getSupabaseAdmin();
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    // If marking as paid, set paid_at if not already set
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { organizationId } = await getOrganizationContext();
    const { error } = await supabase
      .from('financial_records')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[updateFinancialStatus] Error:', err);
    throw err;
  }
}

/**
 * Sync all active contracts to generate monthly billings if they don't exist
 */
export async function syncContractBillings() {
  try {
    const supabase = getSupabaseAdmin();
    
    // 1. Get all active contracts with equipment/client info
    console.log('[syncContractBillings] Fetching contracts...');
    const { data: contracts, error: fetchError } = await supabase
      .from('equipment_contracts')
      .select(`
        id, 
        name, 
        monthly_price, 
        client_id, 
        start_date,
        duration_months,
        created_at,
        is_active
      `)
      .eq('is_active', true);
      
    if (fetchError) {
      console.error('[syncContractBillings] FETCH ERROR:', fetchError);
      throw fetchError;
    }

    console.log(`[syncContractBillings] Found ${contracts?.length || 0} contracts`);
    if (!contracts || contracts.length === 0) {
      return { success: true, count: 0 };
    }

    let generatedCount = 0;

    for (const contract of contracts) {
      console.log(`[syncContractBillings] Checking contract: ${contract.name} (ID: ${contract.id})`);
      
      const finalClientId = contract.client_id;
      
      if (!finalClientId) {
        console.warn(`[syncContractBillings] NO CLIENT ID for ${contract.name} (Contract ID: ${contract.id})`);
        continue;
      }

      // 2. Start from start_date
      const startDateStr = contract.start_date || contract.created_at;
      const startDate = new Date(startDateStr.includes('T') ? startDateStr : `${startDateStr}T12:00:00`);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth(); // 0-indexed for Date constructor

      // Use duration_months as total installments, default 12
      const totalInstallments = contract.duration_months || 12;

      console.log(`[syncContractBillings] Projecting ${totalInstallments} installments for ${contract.name} starting from ${startDateStr}`);

      for (let i = 0; i < totalInstallments; i++) {
        // Calculate each installment's date (15th of each month)
        const installmentDate = new Date(startYear, startMonth + i, 15, 12, 0, 0);
        const checkMonth = installmentDate.getMonth() + 1;
        const checkYear = installmentDate.getFullYear();
        const targetDueDate = installmentDate.toISOString().split('T')[0];

        // Check if billing for this month already exists using DUE_DATE
        const { count, error: checkError } = await supabase
          .from('financial_records')
          .select('id', { count: 'exact', head: true })
          .eq('contract_id', contract.id)
          .eq('due_date', targetDueDate);

        if (checkError) {
          console.error(`[syncContractBillings] Error checking ${contract.name} (${checkMonth}/${checkYear}):`, checkError);
          continue;
        }

        if (count === 0) {
          console.log(`[syncContractBillings] CREATING installment ${i+1}/${totalInstallments} for ${contract.name} (${checkMonth}/${checkYear})`);
          try {
            await saveFinancialRecord({
              description: `Manutenção Mensal: ${contract.name} (${checkMonth}/${checkYear})`,
              amount: contract.monthly_price || 0,
              status: 'pending',
              type: 'income',
              category: 'contract',
              contract_id: contract.id,
              client_id: finalClientId,
              due_date: targetDueDate,
              // Grouped by the 1st of each month for better chronological sorting
              created_at: new Date(checkYear, checkMonth - 1, 1, 10, 0, 0).toISOString()
            });
            generatedCount++;
          } catch (saveErr) {
            console.error(`[syncContractBillings] Save FAILED for ${contract.name} (${checkMonth}/${checkYear}):`, saveErr);
          }
        }
      }
    }

    console.log(`[syncContractBillings] Sync complete. Generated ${generatedCount} records.`);
    return { success: true, count: generatedCount };
  } catch (err) {
    console.error('[syncContractBillings] Error:', err);
    return { success: false, error: err };
  }
}

/**
 * Generate a financial record for a completed order
 */
export async function generateFinancialRecordForOrder(orderId: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check if record already exists
    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .eq('order_id', orderId)
      .single();
      
    if (existing) return { success: true, alreadyExists: true };

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        services:order_services(price, quantity),
        parts:order_parts(price, quantity)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error('Order not found');

    const servicesTotal = (order.services || []).reduce((acc: number, s: any) => acc + (s.price * s.quantity), 0);
    const partsTotal = (order.parts || []).reduce((acc: number, p: any) => acc + (p.price * p.quantity), 0);
    const total = servicesTotal + partsTotal;

    await saveFinancialRecord({
      description: `Faturamento: ${order.name}`,
      amount: total,
      client_id: order.client_id,
      order_id: order.id,
      equipment_id: order.equipment_id,
      status: 'pending',
      type: 'income',
      category: 'order',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    return { success: true };
  } catch (err) {
    console.error('[generateFinancialRecordForOrder] Error:', err);
    return { success: false, error: err };
  }
}

/**
 * Helper to sync an order to financial records (Deprecated - use generateFinancialRecordForOrder)
 */
export async function createRecordFromOrder(orderId: string, amount: number, clientId: string, orderName: string) {
  return await saveFinancialRecord({
    description: `Faturamento: ${orderName}`,
    amount,
    client_id: clientId,
    order_id: orderId,
    status: 'pending',
    type: 'income',
    category: 'order',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}
