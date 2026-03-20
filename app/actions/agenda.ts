'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import { getOrganizationContext } from '@/lib/auth-context';

export type AgendaItem = {
  id: string;
  title: string;
  type: 'preventive' | 'corrective';
  date: string;
  status: string;
  client_name: string;
  equipment_name: string;
  equipment_tag: string;
  technician_name?: string;
  priority?: 'low' | 'medium' | 'high';
  order_id?: string;
  contract_id?: string;
  equipment_id: string;
  completed_at?: string;
  checklist_id?: string;
};

/**
 * Fetches all upcoming agenda items (Preventive from contracts and Corrective from orders)
 */
export async function getAgendaItems() {
  noStore();
  const { organizationId } = await getOrganizationContext();
  const supabase = getSupabaseAdmin();

  // 1. Fetch upcoming Preventives from equipment_contracts
  const { data: contracts, error: contractsError } = await supabase
    .from('equipment_contracts')
    .select(`
      id,
      name,
      next_maintenance_date,
      is_active,
      equipment:equipments(
        id,
        name,
        tag,
        client:profiles!client_id(full_name)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .not('next_maintenance_date', 'is', null)
    .order('next_maintenance_date', { ascending: true });

  if (contractsError) {
    console.error('Error fetching preventive agenda:', contractsError);
  }

  // 2. Fetch scheduled Correctives from orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      name,
      scheduled_at,
      status,
      priority,
      technician:technicians(name),
      client:profiles!client_id(full_name),
      equipment:equipments(id, name, tag)
    `)
    .eq('organization_id', organizationId)
    .not('scheduled_at', 'is', null)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true });

  if (ordersError) {
    console.error('Error fetching corrective agenda:', ordersError);
  }

  // 3. Fetch History: Maintenance Logs (Completed Preventives)
  const { data: logs, error: logsError } = await supabase
    .from('maintenance_logs')
    .select(`
      id,
      created_at,
      technician_name,
      equipment:equipments(id, name, tag, client:profiles!client_id(full_name))
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (logsError) {
    console.error('Error fetching maintenance history:', logsError);
  }

  // 4. Fetch History: Completed Orders (Completed Correctives)
  const { data: completedOrders, error: completedOrdersError } = await supabase
    .from('orders')
    .select(`
      id,
      name,
      updated_at,
      status,
      technician:technicians(name),
      client:profiles!client_id(full_name),
      equipment:equipments(id, name, tag)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (completedOrdersError) {
    console.error('Error fetching completed orders history:', completedOrdersError);
  }

  // 5. Merge and normalize
  const agenda: AgendaItem[] = [];

  if (contracts) {
    contracts.forEach((c: any) => {
      agenda.push({
        id: `prev-${c.id}`,
        title: c.name || 'Manutenção Preventiva',
        type: 'preventive',
        date: c.next_maintenance_date,
        status: 'pending',
        client_name: c.equipment?.client?.full_name || 'Desconhecido',
        equipment_name: c.equipment?.name || '---',
        equipment_tag: c.equipment?.tag || '---',
        contract_id: c.id,
        equipment_id: c.equipment?.id
      });
    });
  }

  if (orders) {
    orders.forEach((o: any) => {
      agenda.push({
        id: `corr-${o.id}`,
        title: o.name || 'Ordem de Serviço',
        type: 'corrective',
        date: o.scheduled_at,
        status: o.status,
        priority: o.priority,
        client_name: o.client?.full_name || 'Desconhecido',
        equipment_name: o.equipment?.name || '---',
        equipment_tag: o.equipment?.tag || '---',
        technician_name: o.technician?.name,
        order_id: o.id,
        equipment_id: o.equipment?.id
      });
    });
  }

  if (logs) {
    logs.forEach((l: any) => {
      agenda.push({
        id: `log-${l.id}`,
        title: 'Preventiva Realizada',
        type: 'preventive',
        date: l.created_at,
        status: 'completed',
        client_name: l.equipment?.client?.full_name || 'Desconhecido',
        equipment_name: l.equipment?.name || '---',
        equipment_tag: l.equipment?.tag || '---',
        technician_name: l.technician_name,
        checklist_id: l.id,
        equipment_id: l.equipment?.id,
        completed_at: l.created_at
      });
    });
  }

  if (completedOrders) {
    completedOrders.forEach((o: any) => {
      agenda.push({
        id: `comp-${o.id}`,
        title: o.name || 'OS Concluída',
        type: 'corrective',
        date: o.updated_at,
        status: 'completed',
        client_name: o.client?.full_name || 'Desconhecido',
        equipment_name: o.equipment?.name || '---',
        equipment_tag: o.equipment?.tag || '---',
        technician_name: o.technician?.name,
        order_id: o.id,
        equipment_id: o.equipment?.id,
        completed_at: o.updated_at
      });
    });
  }

  // Sort by date (descending for history, ascending for future is tricky - we'll sort by date and let the view filter)
  return agenda.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
