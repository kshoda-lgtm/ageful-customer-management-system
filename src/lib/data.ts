import { hasSupabaseEnv, supabase } from './supabase'
import {
  customerStore, projectStore, contractStore, annualRecordStore,
  maintenanceResponseStore, periodicMaintenanceStore, attachmentStore,
} from './mock-store'
import type {
  Customer, DashboardStats, ProjectRow, ProjectDetail,
  CustomerDetailData, MaintenanceResponse, BillingRow, BillingDetail,
} from '../types'

function db() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

// ── Dashboard ─────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardStats> {
  if (!hasSupabaseEnv) {
    const all = maintenanceResponseStore.getAll()
    const currentYear = new Date().getFullYear()
    const allRecords = annualRecordStore.getAll()
    return {
      totalCustomers: customerStore.getAll().length,
      totalProjects: projectStore.getAll().length,
      activeMaintenanceCount: all.filter(m => m.status === '対応中').length,
      pendingBillingCount: allRecords.filter(r => r.year === currentYear && r.status !== '入金済').length,
    }
  }
  // Supabase stub
  const client = db()
  const [cust, proj] = await Promise.all([
    client.from('customers').select('id', { count: 'exact', head: true }),
    client.from('projects').select('id', { count: 'exact', head: true }),
  ])
  return { totalCustomers: cust.count ?? 0, totalProjects: proj.count ?? 0, activeMaintenanceCount: 0, pendingBillingCount: 0 }
}

// ── Customers ─────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (!hasSupabaseEnv) return customerStore.getAll()
  const client = db()
  const { data, error } = await client
    .from('customers')
    .select('*, projects(id)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as Customer),
    project_count: Array.isArray(row.projects) ? (row.projects as unknown[]).length : 0,
  }))
}

// ── Customer Detail ───────────────────────────────────────

export async function getCustomerDetail(customerId: number): Promise<CustomerDetailData | null> {
  if (!hasSupabaseEnv) {
    const customer = customerStore.getById(customerId)
    if (!customer) return null
    const projs = projectStore.getByCustomerId(customerId).map(p => {
      const contract = contractStore.getByProjectId(p.id)
      return {
        id: p.id,
        customer_id: p.customer_id,
        project_no: p.project_no,
        project_name: p.project_name,
        site_prefecture: p.site_prefecture,
        site_address: p.site_address,
        fit_period: p.fit_period,
        handover_date: p.handover_date,
        monitoring_system: p.monitoring_system,
        subcontractor: contract?.subcontractor ?? null,
        maintenance_start_date: contract?.maintenance_start_date ?? null,
        created_at: p.created_at,
        customer_name: customer.company_name ?? customer.name,
        company_name: customer.company_name,
      }
    })
    const attachments = attachmentStore.getByCustomerId(customerId)
    return { customer: { ...customer, project_count: projs.length }, projects: projs, attachments }
  }
  // Supabase stub
  const client = db()
  const { data: customer } = await client.from('customers').select('*').eq('id', customerId).single()
  if (!customer) return null
  return { customer: customer as Customer, projects: [], attachments: [] }
}

// ── Projects ──────────────────────────────────────────────

export async function getProjects(): Promise<ProjectRow[]> {
  if (!hasSupabaseEnv) {
    return projectStore.getAll().map(p => {
      const c = customerStore.getById(p.customer_id)
      const contract = contractStore.getByProjectId(p.id)
      return {
        id: p.id,
        customer_id: p.customer_id,
        project_no: p.project_no,
        project_name: p.project_name,
        site_prefecture: p.site_prefecture,
        site_address: p.site_address,
        fit_period: p.fit_period,
        handover_date: p.handover_date,
        monitoring_system: p.monitoring_system,
        subcontractor: contract?.subcontractor ?? null,
        maintenance_start_date: contract?.maintenance_start_date ?? null,
        created_at: p.created_at,
        customer_name: c?.company_name ?? c?.name ?? '-',
        company_name: c?.company_name ?? null,
      }
    })
  }
  // Supabase stub
  const client = db()
  const { data, error } = await client
    .from('projects')
    .select('*, customers(name, company_name), contracts(subcontractor, maintenance_start_date)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => {
    const cust = row.customers as Record<string, unknown> | null
    const con = (Array.isArray(row.contracts) ? row.contracts[0] : row.contracts) as Record<string, unknown> | null
    return {
      id: row.id as number,
      customer_id: row.customer_id as number,
      project_no: row.project_no as string | null,
      project_name: row.project_name as string,
      site_prefecture: row.site_prefecture as string | null,
      site_address: row.site_address as string | null,
      fit_period: row.fit_period as number | null,
      handover_date: row.handover_date as string | null,
      monitoring_system: row.monitoring_system as string | null,
      subcontractor: (con?.subcontractor as string) ?? null,
      maintenance_start_date: (con?.maintenance_start_date as string) ?? null,
      created_at: row.created_at as string,
      customer_name: (cust?.company_name as string) ?? (cust?.name as string) ?? '-',
      company_name: (cust?.company_name as string) ?? null,
    }
  })
}

// ── Project Detail ────────────────────────────────────────

export async function getProjectDetail(projectId: number): Promise<ProjectDetail | null> {
  if (!hasSupabaseEnv) {
    const project = projectStore.getById(projectId)
    if (!project) return null
    const customer = customerStore.getById(project.customer_id)
    if (!customer) return null
    const contract = contractStore.getByProjectId(projectId)
    const annualRecords = contract ? annualRecordStore.getByContractId(contract.id) : []
    const maintenanceResponses = maintenanceResponseStore.getByProjectId(projectId)
    const periodic = periodicMaintenanceStore.getByProjectId(projectId)
    return { project, customer, contract, annualRecords, maintenanceResponses, periodicMaintenance: periodic }
  }
  // Supabase stub
  return null
}

// ── Maintenance Responses ─────────────────────────────────

export async function getMaintenanceResponses(): Promise<MaintenanceResponse[]> {
  if (!hasSupabaseEnv) return maintenanceResponseStore.getAll()
  const client = db()
  const { data, error } = await client
    .from('maintenance_responses')
    .select('*, projects(project_name, customers(name, company_name))')
    .order('inquiry_date', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => {
    const proj = row.projects as Record<string, unknown> | null
    const cust = proj?.customers as Record<string, unknown> | null
    return {
      ...(row as MaintenanceResponse),
      project_name: (proj?.project_name as string) ?? '不明',
      customer_name: (cust?.company_name as string) ?? (cust?.name as string) ?? '不明',
    }
  })
}

export async function getMaintenanceResponseById(id: number): Promise<MaintenanceResponse | null> {
  if (!hasSupabaseEnv) return maintenanceResponseStore.getById(id)
  const client = db()
  const { data } = await client.from('maintenance_responses').select('*').eq('id', id).single()
  return (data as MaintenanceResponse) ?? null
}

// ── Billing ───────────────────────────────────────────────

export async function getBillingRows(): Promise<BillingRow[]> {
  if (!hasSupabaseEnv) {
    const currentYear = new Date().getFullYear()
    return projectStore.getAll().map(p => {
      const c = customerStore.getById(p.customer_id)
      const contract = contractStore.getByProjectId(p.id)
      const records = contract ? annualRecordStore.getByContractId(contract.id) : []
      const currentYearRecord = records.find(r => r.year === currentYear) ?? null
      return {
        project_id: p.id,
        project_name: p.project_name,
        customer_name: c?.company_name ?? c?.name ?? '-',
        company_name: c?.company_name ?? null,
        contract: contract ?? null,
        currentYearRecord,
        currentYear,
      }
    })
  }
  // Supabase stub
  return []
}

export async function getBillingDetail(projectId: number): Promise<BillingDetail | null> {
  if (!hasSupabaseEnv) {
    const project = projectStore.getById(projectId)
    if (!project) return null
    const customer = customerStore.getById(project.customer_id)
    if (!customer) return null
    const contract = contractStore.getByProjectId(projectId)
    if (!contract) return null
    const annualRecords = annualRecordStore.getByContractId(contract.id)
      .sort((a, b) => b.year - a.year)
    return { project, customer, contract, annualRecords }
  }
  // Supabase stub
  return null
}
