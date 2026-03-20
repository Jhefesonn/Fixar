'use server';

import { startOfMonth, endOfMonth, format } from 'date-fns';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getOrganizationContext } from '@/lib/auth-context';

export async function getDashboardStats(tokenOverride?: string) {
  try {
    const { organizationId } = await getOrganizationContext(tokenOverride);
    const supabase = getSupabaseAdmin();

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const firstDay = format(startOfMonth(now), 'yyyy-MM-01');
    const lastDay = format(endOfMonth(now), 'yyyy-MM-dd');

    // 1. Total de Clientes (Somente da Org)
    const { count: totalClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('role', 'client');

    // 2. Total de Contratos (Somente da Org)
    const { count: totalContracts } = await supabase
      .from('equipment_contracts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // 3. Pedidos Futuros (Somente da Org)
    const { count: futureOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'approved'])
      .gte('created_at', format(now, 'yyyy-MM-dd'));

    // 4. Resumo Financeiro Mensal (Somente da Org)
    const { data: monthlyRecords } = await supabase
      .from('financial_records')
      .select('amount, status')
      .eq('organization_id', organizationId)
      .gte('due_date', firstDay)
      .lte('due_date', lastDay);
    
    const paidRevenue = (monthlyRecords || [])
      .filter(r => r.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const expectedRevenue = (monthlyRecords || [])
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 5. Alertas: Estoque Baixo (Somente da Org)
    const { data: stockItems } = await supabase
      .from('stock_items')
      .select('id, name, current_quantity, min_quantity')
      .eq('organization_id', organizationId);
    
    const lowStockItems = (stockItems || []).filter(item => 
      Number(item.current_quantity) <= Number(item.min_quantity || 5)
    );

    // 6. Alertas: Pagamentos Atrasados (Somente da Org)
    const { data: unpaidRecordsStats } = await supabase
      .from('financial_records')
      .select('amount, status, due_date')
      .eq('organization_id', organizationId)
      .neq('status', 'paid')
      .neq('status', 'cancelled');
    
    const overdueRecords = (unpaidRecordsStats || []).filter(r => 
      r.status === 'overdue' || (r.due_date && format(new Date(r.due_date), 'yyyy-MM-dd') < todayStr)
    );
    
    const overdueCount = overdueRecords.length;
    const overdueTotalValue = overdueRecords.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 7. Alertas: Pedidos Atrasados (Somente da Org)
    const { data: pendingOrdersData } = await supabase
      .from('orders')
      .select('id, created_at, scheduled_at')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');
    
    const delayedOrdersCount = (pendingOrdersData || []).filter(order => {
      const dateToCompare = order.scheduled_at || order.created_at;
      if (!dateToCompare) return false;
      return format(new Date(dateToCompare), 'yyyy-MM-dd') < todayStr;
    }).length;

    return {
      success: true,
      stats: {
        totalClients: totalClients || 0,
        totalContracts: totalContracts || 0,
        futureOrders: futureOrders || 0,
        expectedRevenue,
        paidRevenue,
        overdueCount,
        overdueValue: overdueTotalValue,
        delayedOrders: delayedOrdersCount,
        lowStockItemsCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 5) // Top 5 alertas
      }
    };

  } catch (error: any) {
    if (error.message === 'AUTH_SESSION_MISSING' || error.message === 'AUTH_SESSION_EXPIRED') {
       return { success: false, error: 'SESSION_EXPIRED' };
    }
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: error.message };
  }
}
