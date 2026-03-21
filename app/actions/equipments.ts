'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { syncContractBillings } from './financial';
import { getOrganizationContext } from '@/lib/auth-context';

export async function getClients() {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', organizationId)
      .eq('role', 'client')
      .order('full_name');

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error fetching clients:', err);
    throw new Error('Falha ao buscar clientes.');
  }
}

export async function getContractEquipments() {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipments')
      .select(`
        *,
        profiles:client_id (full_name)
      `)
      .eq('organization_id', organizationId)
      .eq('has_contract', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Flatten the profiles object to client_name
    return data.map(item => ({
      ...item,
      client_name: item.profiles ? (item.profiles as any).full_name : 'N/A'
    }));
  } catch (err: any) {
    console.error('Error fetching contract equipments:', err);
    throw new Error('Falha ao buscar equipamentos com contrato.');
  }
}

export async function getEquipments() {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipments')
      .select(`
        *,
        profiles:client_id (full_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Flatten the profiles object to client_name
    return data.map(item => ({
      ...item,
      client_name: item.profiles ? (item.profiles as any).full_name : 'N/A'
    }));
  } catch (err: any) {
    console.error('Error fetching equipments:', err);
    throw new Error('Falha ao buscar equipamentos.');
  }
}

export async function getEquipmentsByClient(clientId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipments')
      .select(`
        *,
        profiles:client_id (full_name)
      `)
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(item => ({
      ...item,
      client_name: item.profiles ? (item.profiles as any).full_name : 'N/A'
    }));
  } catch (err: any) {
    console.error('Error fetching client equipments:', err);
    throw new Error('Falha ao buscar equipamentos do cliente.');
  }
}

export async function getEquipmentById(equipmentId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipments')
      .select(`
        *,
        profiles:client_id (full_name)
      `)
      .eq('id', equipmentId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      throw new Error(`Equipamento não encontrado ou sem permissão (ID: ${equipmentId})`);
    }

    return {
      ...data,
      client_name: data.profiles ? (data.profiles as any).full_name : 'N/A'
    };
  } catch (err: any) {
    console.error('Error fetching equipment by id detalhado:', err);
    throw new Error(err.message || 'Falha ao buscar detalhes do equipamento.');
  }
}

export async function adminCreateEquipment(formData: any) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Generate Tag
    const name = formData.name || 'EQU';
    // Get first 3 letters ignoring spaces (e.g. "Ar Condicionado" -> "ARC")
    const prefix = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
    
    // Get the highest tag with this prefix to avoid duplicates even after deletions
    const { data: lastEquip, error: lastError } = await supabaseAdmin
      .from('equipments')
      .select('tag')
      .like('tag', `${prefix}-%`)
      .order('tag', { ascending: false })
      .limit(1);
      
    if (lastError) throw lastError;
    
    let seq = 1;
    if (lastEquip && lastEquip.length > 0) {
      const lastTag = lastEquip[0].tag;
      const lastNum = parseInt(lastTag.split('-')[1]);
      if (!isNaN(lastNum)) {
        seq = lastNum + 1;
      }
    }
    
    const tag = `${prefix}-${String(seq).padStart(4, '0')}`;
    
    const { organizationId } = await getOrganizationContext();
    
    // 2. Insert equipment
    const { data, error } = await supabaseAdmin
      .from('equipments')
      .insert({
        organization_id: organizationId,
        tag,
        name: formData.name,
        photo_url: formData.photo_url,
        client_id: formData.client_id,
        brand: formData.brand,
        environment: formData.environment,
        model: formData.model,
        capacity: formData.capacity,
        voltage: formData.voltage,
        refrigerant_fluid: formData.refrigerant_fluid,
        has_contract: formData.has_contract,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, equipment: data };
  } catch (err: any) {
    console.error('Error creating equipment:', err);
    throw new Error(err.message || 'Falha ao criar equipamento.');
  }
}

export async function adminUpdateEquipment(equipmentId: string, formData: any) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };
    
    const fields = [
      'name', 'photo_url', 'client_id', 'brand', 'environment', 
      'model', 'capacity', 'voltage', 'refrigerant_fluid', 'has_contract'
    ];

    for (const field of fields) {
      if (formData[field] !== undefined) {
        updateData[field] = formData[field];
      }
    }

    const { organizationId } = await getOrganizationContext();
    const { error } = await supabaseAdmin
      .from('equipments')
      .update(updateData)
      .eq('id', equipmentId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Error updating equipment:', err);
    throw new Error(err.message || 'Falha ao atualizar equipamento.');
  }
}

export async function adminDeleteEquipment(equipmentId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { organizationId } = await getOrganizationContext();
    const { error } = await supabaseAdmin
      .from('equipments')
      .delete()
      .eq('id', equipmentId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting equipment:', err);
    throw new Error(err.message || 'Falha ao excluir equipamento.');
  }
}

export async function getMaintenanceHistory(equipmentId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    // Busca logs, incluindo informações do contrato se houver
    const { data, error } = await supabaseAdmin
      .from('maintenance_logs')
      .select(`
        *,
        contract:equipment_contracts(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('equipment_id', equipmentId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    
    return data.map(log => ({
      ...log,
      contract_name: (log as any).contract?.name || null
    }));
  } catch (err: any) {
    console.error('Error fetching maintenance history:', err);
    throw new Error('Falha ao buscar histórico de manutenção.');
  }
}

export async function getContracts() {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipment_contracts')
      .select(`
        *,
        client:profiles!client_id(full_name),
        equipments:contract_equipments(
          equipment:equipments(id, name, tag)
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(contract => ({
      ...contract,
      client_name: contract.client ? (contract.client as any).full_name : 'N/A',
      equipment_count: contract.equipments?.length || 0,
      equipment_list: contract.equipments?.map((e: any) => e.equipment) || []
    }));
  } catch (err: any) {
    console.error('Error fetching contracts:', err);
    throw new Error('Falha ao buscar contratos.');
  }
}

export async function getContractById(contractId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('equipment_contracts')
      .select(`
        *,
        client:profiles!client_id(*),
        equipments:contract_equipments(
          equipment:equipments(
            *,
            maintenance_logs(*)
          )
        ),
        organization:organizations(*)
      `)
      .eq('id', contractId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Contrato não encontrado.');
    
    return {
      ...data,
      client_name: data.client ? (data.client as any).full_name : 'N/A',
      equipment_list: data.equipments?.map((e: any) => {
        let status = 'not_done';
        
        if (e.equipment.maintenance_logs && e.equipment.maintenance_logs.length > 0) {
          // get the latest log for this contract
          const logsForContract = e.equipment.maintenance_logs
            .filter((log: any) => log.contract_id === contractId)
            .sort((a: any, b: any) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime());
          
          if (logsForContract.length > 0) {
            const lastLog = logsForContract[0];
            const lastPerformedAt = new Date(lastLog.performed_at);
            
            let monthsToAdd = 1;
            switch (data.periodicity) {
              case 'monthly': monthsToAdd = 1; break;
              case 'bimonthly': monthsToAdd = 2; break;
              case 'quarterly': monthsToAdd = 3; break;
              case 'semiannual': monthsToAdd = 6; break;
              case 'annual': monthsToAdd = 12; break;
              default: monthsToAdd = 1;
            }
            
            const validUntil = new Date(lastPerformedAt);
            validUntil.setMonth(validUntil.getMonth() + monthsToAdd);
            
            if (new Date() > validUntil) {
              status = 'pending';
            } else {
              status = 'ok';
            }
          }
        }
        
        return {
          ...e.equipment,
          checklist_status: status
        };
      }) || []
    };
  } catch (err: any) {
    console.error('Error fetching contract by id:', err);
    throw new Error(err.message || 'Falha ao buscar detalhes do contrato.');
  }
}

export async function getEquipmentContracts(equipmentId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Busca contratos através da tabela de junção contract_equipments
    const { data, error } = await supabaseAdmin
      .from('contract_equipments')
      .select(`
        contract_id,
        contract:equipment_contracts(*)
      `)
      .eq('equipment_id', equipmentId);

    if (error) throw error;
    
    // Retorna apenas a lista de contratos extraída da junção
    return data.map(item => item.contract).filter(Boolean);
  } catch (err: any) {
    console.error('Error fetching equipment contracts:', err);
    throw new Error('Falha ao buscar contratos do equipamento.');
  }
}

/**
 * Salva um contrato vinculado a um cliente e múltiplos equipamentos
 */
export async function saveContract(contractData: any, equipmentIds: string[], equipmentIdsToRemoveLogs: string[] = []) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    
    const dbData = {
      organization_id: organizationId,
      client_id: contractData.client_id,
      name: contractData.name,
      type: contractData.type,
      periodicity: contractData.periodicity,
      monthly_price: parseFloat(contractData.monthly_price) || 0,
      start_date: contractData.start_date || new Date().toISOString().slice(0, 10),
      duration_months: parseInt(contractData.duration_months) || 12,
      is_active: contractData.is_active ?? true,
      updated_at: new Date().toISOString()
    };

    let contractId = contractData.id;

    if (contractId) {
      // Update
      const { error: updateError } = await supabaseAdmin
        .from('equipment_contracts')
        .update(dbData)
        .eq('id', contractId);
      if (updateError) throw updateError;
    } else {
      // Insert
      const { data, error: insertError } = await supabaseAdmin
        .from('equipment_contracts')
        .insert({
          ...dbData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (insertError) throw insertError;
      contractId = data.id;
    }

    // Gerenciar vínculos de equipamentos
    // 1. Remover vínculos antigos desta instância
    await supabaseAdmin
      .from('contract_equipments')
      .delete()
      .eq('contract_id', contractId);

    // 2. Inserir novos vínculos
    if (equipmentIds && equipmentIds.length > 0) {
      const links = equipmentIds.map(eqId => ({
        contract_id: contractId,
        equipment_id: eqId,
        organization_id: organizationId
      }));
      
      const { error: linkError } = await supabaseAdmin
        .from('contract_equipments')
        .insert(links);
      if (linkError) throw linkError;
    }

    // 2.5 Deletar logs de equipamentos removidos se solicitado
    if (equipmentIdsToRemoveLogs && equipmentIdsToRemoveLogs.length > 0) {
      const { error: deleteLogsError } = await supabaseAdmin
        .from('maintenance_logs')
        .delete()
        .eq('contract_id', contractId)
        .in('equipment_id', equipmentIdsToRemoveLogs);
      
      if (deleteLogsError) {
        console.error('[saveContract] Error deleting removed equipment logs:', deleteLogsError);
      }
    }

    // 3. Atualizar flag has_contract nos equipamentos
    // Primeiro remove flag dos equipamentos do cliente
    await supabaseAdmin
      .from('equipments')
      .update({ has_contract: false })
      .eq('client_id', contractData.client_id);
      
    // Agora ativa para quem tem QUALQUER contrato ativo
    // Buscamos todos os equipamentos do cliente que possuem algum vínculo em contract_equipments
    // onde o contrato está ativo.
    const { data: activeEquips } = await supabaseAdmin
      .from('contract_equipments')
      .select('equipment_id')
      .match({ 'equipment_contracts.is_active': true }) // Isso exige join, vamos simplificar para os que acabamos de vincular se o contrato for ativo
    
    if (dbData.is_active && equipmentIds && equipmentIds.length > 0) {
      await supabaseAdmin
        .from('equipments')
        .update({ has_contract: true })
        .in('id', equipmentIds);
    }

    // Sync financial records
    try {
      await syncContractBillings();
    } catch (e) {
      console.error('[saveContract] Sync failed:', e);
    }

    revalidatePath('/admin');
    return { success: true, id: contractId };
  } catch (err: any) {
    console.error('Error saving contract:', err);
    throw new Error(err.message || 'Falha ao salvar contrato.');
  }
}

// Para compatibilidade temporária com EquipmentForm
export async function saveEquipmentContracts(equipmentId: string, contracts: any[]) {
  return { success: true };
}

export async function adminDeleteContract(contractId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Get associated equipments before deletion to update their flags
    const { data: links } = await supabaseAdmin
      .from('contract_equipments')
      .select('equipment_id')
      .eq('contract_id', contractId);

    const linkedEquipmentIds = links?.map(l => l.equipment_id) || [];

    // 2. Delete associated PENDING financial records
    await supabaseAdmin
      .from('financial_records')
      .delete()
      .eq('organization_id', organizationId)
      .eq('contract_id', contractId)
      .eq('status', 'pending');

    // 3. Delete the contract (cascades to contract_equipments)
    const { error: deleteError } = await supabaseAdmin
      .from('equipment_contracts')
      .delete()
      .eq('id', contractId)
      .eq('organization_id', organizationId);

    if (deleteError) throw deleteError;

    // 4. Update equipment flags for those affected
    if (linkedEquipmentIds.length > 0) {
      for (const eqId of linkedEquipmentIds) {
        const { data: others } = await supabaseAdmin
          .from('contract_equipments')
          .select('id')
          .eq('equipment_id', eqId);
        
        const hasOthers = (others?.length || 0) > 0;
        await supabaseAdmin
          .from('equipments')
          .update({ has_contract: hasOthers })
          .eq('id', eqId);
      }
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting contract:', err);
    throw new Error(err.message || 'Falha ao excluir contrato.');
  }
}

export async function saveMaintenanceChecklist(
  equipmentId: string, 
  checklistData: any, 
  notes: string = '', 
  contractId?: string, 
  checklistStructure?: any,
  technicianName: string = 'Equipe Técnica Fixar',
  technicianId?: string,
  technicianDocument?: string,
  logId?: string
) {
  const finalTechId = (technicianId && technicianId.trim() !== '') ? technicianId : null;

  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    
    // 0. Verify technician if ID is provided
    if (finalTechId) {
      console.log('Verifying technician ID:', finalTechId);
      const { data: tech, error: techError } = await supabaseAdmin
        .from('technicians')
        .select('id, name')
        .eq('id', finalTechId)
        .single();
        
      if (techError || !tech) {
        console.error('Technician not found in system:', finalTechId, techError);
        throw new Error('Técnico selecionado não foi encontrado no sistema.');
      }
      console.log('Technician verified:', tech.id, tech.name);
    }

    let query = supabaseAdmin.from('equipment_contracts').select('*');
    let contract: any = null;

    if (contractId) {
      const { data } = await query.eq('id', contractId).single();
      contract = data;
    } else {
      // Busca se o equipamento possui algum contrato ativo via junction table
      const { data: link } = await supabaseAdmin
        .from('contract_equipments')
        .select(`
          contract:equipment_contracts(*)
        `)
        .eq('equipment_id', equipmentId)
        .eq('contract.is_active', true)
        .limit(1)
        .maybeSingle();
      
      contract = link?.contract;
    }

    // 2. Insert or Update log
    const logData = {
      organization_id: organizationId,
      equipment_id: equipmentId,
      contract_id: contract?.id || null,
      checklist_data: checklistData,
      notes: notes,
      technician_name: technicianName,
      technician_id: finalTechId,
      technician_document: technicianDocument || null
    };

    if (logId) {
      const { error: logError } = await supabaseAdmin
        .from('maintenance_logs')
        .update(logData)
        .eq('id', logId)
        .eq('organization_id', organizationId);
      if (logError) throw logError;
    } else {
      const { error: logError } = await supabaseAdmin
        .from('maintenance_logs')
        .insert({
          ...logData,
          performed_at: new Date().toISOString()
        });
      if (logError) throw logError;
    }
    
    if (contract) {
      // 3. Calculate next visit
      const periodicity = contract.periodicity || 'monthly';
      const nextVisit = new Date();
      
      switch (periodicity) {
        case 'monthly': nextVisit.setMonth(nextVisit.getMonth() + 1); break;
        case 'bimonthly': nextVisit.setMonth(nextVisit.getMonth() + 2); break;
        case 'quarterly': nextVisit.setMonth(nextVisit.getMonth() + 3); break;
        case 'semiannual': nextVisit.setMonth(nextVisit.getMonth() + 6); break;
        case 'annual': nextVisit.setFullYear(nextVisit.getFullYear() + 1); break;
        default: nextVisit.setMonth(nextVisit.getMonth() + 1);
      }
      
      // 4. Update contract details
      const updateData: any = {
        next_maintenance_date: nextVisit.toISOString(),
        updated_at: new Date().toISOString()
      };

      if (checklistStructure) {
        updateData.checklist_template = checklistStructure;
      }

      const { error: updateError } = await supabaseAdmin
        .from('equipment_contracts')
        .update(updateData)
        .eq('id', contract.id);
        
      if (updateError) throw updateError;
      
      return { success: true, nextVisit };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Error saving maintenance checklist:', err);
    throw new Error(err.message || 'Falha ao salvar checklist de manutenção.');
  }
}

export async function updateMaintenanceLog(
  logId: string, 
  checklistData: any, 
  notes: string, 
  technicianName?: string,
  technicianDocument?: string,
  technicianId?: string
) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const finalTechId = (technicianId && technicianId.trim() !== '') ? technicianId : null;

    // 0. Verify technician if ID is provided
    if (finalTechId) {
      const { data: tech, error: techError } = await supabaseAdmin
        .from('technicians')
        .select('id')
        .eq('id', finalTechId)
        .single();
        
      if (techError || !tech) {
        throw new Error('Técnico selecionado não foi encontrado no sistema.');
      }
    }

    // Update the maintenance log entry
    const updateData: any = {
      checklist_data: checklistData,
      notes: notes
    };

    if (technicianName) updateData.technician_name = technicianName;
    if (technicianDocument) updateData.technician_document = technicianDocument;
    updateData.technician_id = finalTechId;

    const { error: updateError } = await supabaseAdmin
      .from('maintenance_logs')
      .update(updateData)
      .eq('id', logId)
      .eq('organization_id', organizationId);
      
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (err: any) {
    console.error('Error updating maintenance log:', err);
    throw new Error(err.message || 'Falha ao atualizar log de manutenção.');
  }
}

export async function deleteMaintenanceLog(logId: string) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    
    const { error: deleteError } = await supabaseAdmin
      .from('maintenance_logs')
      .delete()
      .eq('id', logId)
      .eq('organization_id', organizationId);
      
    if (deleteError) throw deleteError;
    
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting maintenance log:', err);
    throw new Error(err.message || 'Falha ao excluir log de manutenção.');
  }
}

export async function getTechnicians() {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('technicians')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching technicians:', err);
    return [];
  }
}

export async function upsertTechnician(technician: any) {
  try {
    const { organizationId } = await getOrganizationContext();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('technicians')
      .upsert({ ...technician, organization_id: organizationId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error upserting technician:', err);
    throw new Error(err.message || 'Falha ao salvar técnico.');
  }
}
