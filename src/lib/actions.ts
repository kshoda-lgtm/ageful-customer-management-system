import { hasSupabaseEnv, supabase } from './supabase'
import {
  customerStore, projectStore, contractStore, annualRecordStore,
  maintenanceResponseStore, periodicMaintenanceStore, attachmentStore,
} from './mock-store'
import type {
  Customer, Project, Contract, AnnualRecord, MaintenanceResponse, PeriodicMaintenance,
  Attachment, CustomerInput, MaintenanceResponseInput, PeriodicMaintenanceInput,
  AnnualRecordInput, AnnualRecordStatus, CsvImportRow,
} from '../types'

function db() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

function toInt(v: string): number | null {
  if (!v || v.trim() === '') return null
  const n = parseInt(v.replace(/[,，\s]/g, ''), 10)
  return isNaN(n) ? null : n
}

function toFloat(v: string): number | null {
  if (!v || v.trim() === '') return null
  const n = parseFloat(v.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

function toDate(v: string): string | null {
  if (!v || v.trim() === '') return null
  return v.trim().replace(/\//g, '-')
}

// ── Customer CRUD ─────────────────────────────────────────

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const payload = {
    name: input.name,
    company_name: input.company_name || null,
    is_corporate: input.is_corporate,
    email: input.email || null,
    phone: input.phone || null,
    postal_code: input.postal_code || null,
    address: input.address || null,
  }
  if (!hasSupabaseEnv) return customerStore.create(payload)
  const { data, error } = await db().from('customers').insert(payload).select().single()
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<Customer> {
  const payload = {
    name: input.name,
    company_name: input.company_name || null,
    is_corporate: input.is_corporate,
    email: input.email || null,
    phone: input.phone || null,
    postal_code: input.postal_code || null,
    address: input.address || null,
  }
  if (!hasSupabaseEnv) {
    const updated = customerStore.update(id, payload)
    if (!updated) throw new Error('Not found')
    return updated
  }
  const { data, error } = await db().from('customers').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: number): Promise<void> {
  if (!hasSupabaseEnv) { customerStore.delete(id); return }
  const { error } = await db().from('customers').delete().eq('id', id)
  if (error) throw error
}

// ── Project CRUD ──────────────────────────────────────────

export type ProjectInput = {
  customer_id: number
  project_no: string
  project_name: string
  plant_name: string
  site_postal_code: string
  site_prefecture: string
  site_address: string
  latitude: string
  longitude: string
  panel_kw: string
  panel_count: string
  panel_maker: string
  panel_model: string
  pcs_kw: string
  pcs_count: string
  pcs_maker: string
  pcs_model: string
  grid_id: string
  grid_certified_at: string
  fit_period: string
  power_supply_start_date: string
  customer_number: string
  generation_point_id: string
  meter_reading_day: string
  monitoring_system: string
  monitoring_id: string
  monitoring_user: string
  monitoring_pw: string
  has_4g: boolean
  key_number: string
  local_association: string
  old_owner: string
  sales_company: string
  referrer: string
  power_change_date: string
  handover_date: string
  sales_price: string
  reference_price: string
  land_cost: string
  amuras_member_no: string
  notes: string
}

function projectPayload(input: Omit<ProjectInput, 'customer_id'>): Omit<Project, 'id' | 'created_at' | 'customer_id'> {
  return {
    project_no: input.project_no || null,
    project_name: input.project_name,
    plant_name: input.plant_name || null,
    site_postal_code: input.site_postal_code || null,
    site_prefecture: input.site_prefecture || null,
    site_address: input.site_address || null,
    latitude: toFloat(input.latitude),
    longitude: toFloat(input.longitude),
    panel_kw: toFloat(input.panel_kw),
    panel_count: toInt(input.panel_count),
    panel_maker: input.panel_maker || null,
    panel_model: input.panel_model || null,
    pcs_kw: toFloat(input.pcs_kw),
    pcs_count: toInt(input.pcs_count),
    pcs_maker: input.pcs_maker || null,
    pcs_model: input.pcs_model || null,
    grid_id: input.grid_id || null,
    grid_certified_at: toDate(input.grid_certified_at),
    fit_period: toInt(input.fit_period),
    power_supply_start_date: toDate(input.power_supply_start_date),
    customer_number: input.customer_number || null,
    generation_point_id: input.generation_point_id || null,
    meter_reading_day: input.meter_reading_day || null,
    monitoring_system: input.monitoring_system || null,
    monitoring_id: input.monitoring_id || null,
    monitoring_user: input.monitoring_user || null,
    monitoring_pw: input.monitoring_pw || null,
    has_4g: input.has_4g ?? null,
    key_number: input.key_number || null,
    local_association: input.local_association || null,
    old_owner: input.old_owner || null,
    sales_company: input.sales_company || null,
    referrer: input.referrer || null,
    power_change_date: toDate(input.power_change_date),
    handover_date: toDate(input.handover_date),
    sales_price: toInt(input.sales_price),
    reference_price: toInt(input.reference_price),
    land_cost: toInt(input.land_cost),
    amuras_member_no: input.amuras_member_no || null,
    notes: input.notes || null,
  }
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const payload = { customer_id: input.customer_id, ...projectPayload(input) }
  if (!hasSupabaseEnv) return projectStore.create(payload)
  const { data, error } = await db().from('projects').insert(payload).select().single()
  if (error) throw error
  return data as Project
}

export async function updateProject(id: number, input: Omit<ProjectInput, 'customer_id'>): Promise<Project> {
  const payload = projectPayload(input)
  if (!hasSupabaseEnv) {
    const updated = projectStore.update(id, payload)
    if (!updated) throw new Error('Not found')
    return updated
  }
  const { data, error } = await db().from('projects').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Project
}

// ── Maintenance Response CRUD ─────────────────────────────

export async function createMaintenanceResponse(input: MaintenanceResponseInput): Promise<MaintenanceResponse> {
  const payload = {
    project_id: input.project_id,
    response_no: input.response_no || null,
    status: '対応中' as const,
    inquiry_date: input.inquiry_date || null,
    occurrence_date: input.occurrence_date || null,
    target_area: input.target_area || null,
    situation: input.situation || null,
    response_content: input.response_content || null,
    report: input.report || null,
  }
  if (!hasSupabaseEnv) return maintenanceResponseStore.create(payload)
  const { data, error } = await db().from('maintenance_responses').insert(payload).select().single()
  if (error) throw error
  return data as MaintenanceResponse
}

export async function updateMaintenanceResponse(
  id: number,
  input: Partial<MaintenanceResponseInput & { status: '対応中' | '完了' }>
): Promise<void> {
  const payload: Partial<MaintenanceResponse> = {
    response_no: input.response_no || null,
    inquiry_date: input.inquiry_date || null,
    occurrence_date: input.occurrence_date || null,
    target_area: input.target_area || null,
    situation: input.situation || null,
    response_content: input.response_content || null,
    report: input.report || null,
    status: input.status,
  }
  if (!hasSupabaseEnv) { maintenanceResponseStore.update(id, payload); return }
  const { error } = await db().from('maintenance_responses').update(payload).eq('id', id)
  if (error) throw error
}

export async function completeMaintenanceResponse(id: number): Promise<void> {
  if (!hasSupabaseEnv) { maintenanceResponseStore.update(id, { status: '完了' }); return }
  const { error } = await db().from('maintenance_responses').update({ status: '完了' }).eq('id', id)
  if (error) throw error
}

export async function deleteMaintenanceResponse(id: number): Promise<void> {
  if (!hasSupabaseEnv) { maintenanceResponseStore.delete(id); return }
  const { error } = await db().from('maintenance_responses').delete().eq('id', id)
  if (error) throw error
}

// ── Periodic Maintenance CRUD ─────────────────────────────

export async function createPeriodicMaintenance(input: PeriodicMaintenanceInput): Promise<PeriodicMaintenance> {
  const payload = {
    project_id: input.project_id,
    record_date: input.record_date,
    work_type: input.work_type || null,
    content: input.content || null,
  }
  if (!hasSupabaseEnv) return periodicMaintenanceStore.create(payload)
  const { data, error } = await db().from('periodic_maintenance').insert(payload).select().single()
  if (error) throw error
  return data as PeriodicMaintenance
}

export async function deletePeriodicMaintenance(id: number): Promise<void> {
  if (!hasSupabaseEnv) { periodicMaintenanceStore.delete(id); return }
  const { error } = await db().from('periodic_maintenance').delete().eq('id', id)
  if (error) throw error
}

// ── Annual Record CRUD ────────────────────────────────────

export async function upsertAnnualRecord(input: AnnualRecordInput): Promise<AnnualRecord> {
  const payload = {
    contract_id: input.contract_id,
    year: input.year,
    billing_date: input.billing_date || null,
    received_date: input.received_date || null,
    maintenance_record: input.maintenance_record || null,
    escort_record: input.escort_record || null,
    status: input.status,
  }
  if (!hasSupabaseEnv) {
    const existing = annualRecordStore.getByContractId(input.contract_id).find(r => r.year === input.year)
    if (existing) {
      return annualRecordStore.update(existing.id, payload) ?? existing
    }
    return annualRecordStore.create(payload)
  }
  const { data, error } = await db()
    .from('annual_records')
    .upsert(payload, { onConflict: 'contract_id,year' })
    .select()
    .single()
  if (error) throw error
  return data as AnnualRecord
}

export async function updateAnnualRecordStatus(id: number, status: AnnualRecordStatus): Promise<void> {
  if (!hasSupabaseEnv) { annualRecordStore.update(id, { status }); return }
  const { error } = await db().from('annual_records').update({ status }).eq('id', id)
  if (error) throw error
}

// ── Contract CRUD ─────────────────────────────────────────

export async function updateContract(id: number, input: Partial<Omit<Contract, 'id' | 'created_at'>>): Promise<void> {
  if (!hasSupabaseEnv) { contractStore.update(id, input); return }
  const { error } = await db().from('contracts').update(input).eq('id', id)
  if (error) throw error
}

// ── CSV Bulk Import ────────────────────────────────────────

export async function bulkImportProjects(
  rows: CsvImportRow[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []
  const custIdCache: Record<string, number> = {}

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      // 顧客の名寄せ / 作成
      let customerId: number
      const custKey = row.customer_name || row.company_name || '（名前未設定）'
      if (custIdCache[custKey]) {
        customerId = custIdCache[custKey]
      } else if (!hasSupabaseEnv) {
        const existing = row.customer_name || row.company_name ? customerStore.findByName(custKey) : null
        if (existing) {
          customerId = existing.id
        } else {
          const newCust = customerStore.create({
            name: row.customer_name || row.company_name || '（名前未設定）',
            company_name: row.company_name || null,
            is_corporate: !!row.company_name,
            email: row.email || null,
            phone: row.phone || null,
            postal_code: row.postal_code || null,
            address: row.customer_address || null,
          })
          customerId = newCust.id
        }
        custIdCache[custKey] = customerId
      } else {
        const customerName = row.customer_name || row.company_name || '（名前未設定）'
        const { data: existing } = await db()
          .from('customers')
          .select('id')
          .eq('name', customerName)
          .limit(1)
          .single()
        if (existing) {
          customerId = (existing as { id: number }).id
        } else {
          const { data: newCust, error: custErr } = await db()
            .from('customers')
            .insert({
              name: customerName,
              company_name: row.company_name || null,
              is_corporate: !!row.company_name,
              email: row.email || null,
              phone: row.phone || null,
              postal_code: row.postal_code || null,
              address: row.customer_address || null,
            })
            .select()
            .single()
          if (custErr) throw custErr
          customerId = (newCust as { id: number }).id
        }
        custIdCache[custKey] = customerId
      }

      // 案件作成
      // 4G対応: '有'/'可'/'要' → true, '無'/'ー'/'-' → false, 空 → null
      function parseHas4g(v?: string): boolean | null {
        if (!v || v.trim() === '') return null
        const t = v.trim()
        if (['有', '可', '要'].includes(t)) return true
        if (['無', 'ー', '-', 'ー'].includes(t)) return false
        return null
      }

      const projPayload = {
        customer_id: customerId,
        project_no: row.project_number || null,
        project_name: row.project_name || '（案件名未設定）',
        plant_name: row.plant_name || null,
        site_postal_code: row.site_postal_code || null,
        site_prefecture: row.site_address ? row.site_address.match(/^(.{2,3}[都道府県])/)?.[1] ?? null : null,
        site_address: row.site_address || null,
        latitude: toFloat(row.latitude),
        longitude: toFloat(row.longitude),
        panel_kw: toFloat(row.panel_kw),
        panel_count: toInt(row.panel_count),
        panel_maker: row.panel_manufacturer || null,
        panel_model: row.panel_model || null,
        pcs_kw: toFloat(row.pcs_kw),
        pcs_count: toInt(row.pcs_count),
        pcs_maker: row.pcs_manufacturer || null,
        pcs_model: row.pcs_model || null,
        grid_id: row.grid_id || null,
        grid_certified_at: toDate(row.grid_certified_at),
        fit_period: toInt(row.fit_period),
        power_supply_start_date: toDate(row.power_supply_start_date),
        customer_number: row.customer_number || null,
        generation_point_id: row.generation_point_id || null,
        meter_reading_day: row.meter_reading_day || null,
        monitoring_system: row.monitoring_system || null,
        monitoring_id: row.monitoring_id || null,
        monitoring_user: null,
        monitoring_pw: row.monitoring_pw || null,
        has_4g: parseHas4g(row.has_4g_str),
        key_number: row.key_number || null,
        local_association: row.local_association || null,
        old_owner: row.old_owner || null,
        sales_company: row.sales_company || null,
        referrer: row.referrer || null,
        power_change_date: toDate(row.power_change_date ?? ''),
        handover_date: toDate(row.handover_date),
        sales_price: toInt(row.sales_price),
        reference_price: toInt(row.reference_price),
        land_cost: toInt(row.land_cost),
        amuras_member_no: row.amuras_member_no || null,
        notes: row.notes || null,
      }

      let projectId: number
      if (!hasSupabaseEnv) {
        const proj = projectStore.create(projPayload)
        projectId = proj.id
      } else {
        const { data: projData, error: projErr } = await db().from('projects').insert(projPayload).select('id').single()
        if (projErr) throw projErr
        projectId = (projData as { id: number }).id
      }

      // 契約情報があれば作成
      if (row.billing_method || row.billing_amount_inc || row.annual_maintenance_inc || row.maintenance_start_date
          || row.land_cost_monthly || row.insurance_fee || row.other_fee) {
        const contractPayload = {
          project_id: projectId,
          billing_method: row.billing_method || null,
          billing_due_day: row.billing_due_day || null,
          billing_amount_ex: toInt(row.billing_amount_ex ?? ''),
          billing_amount_inc: toInt(row.billing_amount_inc ?? ''),
          annual_maintenance_ex: toInt(row.annual_maintenance_ex ?? ''),
          annual_maintenance_inc: toInt(row.annual_maintenance_inc ?? ''),
          land_cost_monthly: toInt(row.land_cost_monthly ?? ''),
          insurance_fee: toInt(row.insurance_fee ?? ''),
          other_fee: toInt(row.other_fee ?? ''),
          transfer_account: null,
          subcontractor: row.subcontractor || null,
          subcontract_fee_ex: toInt(row.subcontract_fee_ex ?? ''),
          subcontract_fee_inc: toInt(row.subcontract_fee_inc ?? ''),
          subcontract_billing_day: null,
          subcontract_start_date: toDate(row.subcontract_start_date ?? ''),
          maintenance_start_date: toDate(row.maintenance_start_date ?? ''),
          notes: row.contract_notes || null,
        }
        if (!hasSupabaseEnv) {
          contractStore.create(contractPayload)
        } else {
          const { error: cErr } = await db().from('contracts').insert(contractPayload)
          if (cErr) throw cErr
        }
      }

      success++
    } catch (e) {
      failed++
      errors.push(`行${i + 2}（${row.project_name || '?'}）: ${String(e)}`)
    }
  }

  return { success, failed, errors }
}

// ── Attachment ─────────────────────────────────────────────

export async function uploadAttachment(
  customerId: number,
  file: File,
  description: string,
): Promise<Attachment> {
  const fileType = file.type.includes('pdf') ? 'pdf'
    : file.type.startsWith('image/') ? 'image'
    : 'other'

  if (!hasSupabaseEnv) {
    // モード：Object URL（セッション中のみ有効）
    const url = URL.createObjectURL(file)
    return attachmentStore.create({
      customer_id: customerId,
      file_name: file.name,
      file_url: url,
      file_type: fileType,
      description: description || null,
    })
  }

  const db = supabase!
  const path = `customers/${customerId}/${Date.now()}_${file.name}`
  const { error: uploadErr } = await db.storage.from('attachments').upload(path, file)
  if (uploadErr) throw uploadErr

  const { data: { publicUrl } } = db.storage.from('attachments').getPublicUrl(path)

  const { data, error } = await db.from('attachments').insert({
    customer_id: customerId,
    file_name: file.name,
    file_url: publicUrl,
    file_type: fileType,
    description: description || null,
  }).select().single()
  if (error) throw error
  return data as Attachment
}

export async function deleteAttachment(id: number, fileUrl: string): Promise<void> {
  if (!hasSupabaseEnv) { attachmentStore.delete(id); return }

  const db = supabase!
  // Storage からも削除
  const path = fileUrl.split('/attachments/')[1]
  if (path) await db.storage.from('attachments').remove([path])
  const { error } = await db.from('attachments').delete().eq('id', id)
  if (error) throw error
}
