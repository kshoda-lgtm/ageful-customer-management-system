/**
 * GAS API Client
 * Google Apps Script Web App への通信レイヤー
 */

// GAS Web App URL（デプロイ後にここを書き換える）
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwkA4PPfSDRhe-aVCELPjnYkoJM953Xd2-t8kNg3FZs0HqmMPGFFEQ0jCySzRsiuNDa/exec';

// ========================================
// 共通 fetch ラッパー
// ========================================
async function gasGet(action: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function gasPost(action: string, data: Record<string, any> = {}): Promise<any> {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // GAS requires text/plain for CORS
        body: JSON.stringify({ action, ...data }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ========================================
// Auth API
// ========================================
export async function apiLogin(email: string, password: string) {
    return gasPost('login', { email, password });
}

// ========================================
// Customers API
// ========================================
export async function apiGetCustomers() {
    return gasGet('getCustomers');
}

export async function apiGetCustomer(id: number | string) {
    return gasGet('getCustomer', { id: String(id) });
}

export async function apiCreateCustomer(data: Record<string, any>) {
    return gasPost('createCustomer', { data });
}

export async function apiUpdateCustomer(id: number | string, data: Record<string, any>) {
    return gasPost('updateCustomer', { id: Number(id), data });
}

export async function apiDeleteCustomer(id: number | string) {
    return gasPost('deleteCustomer', { id: Number(id) });
}

// ========================================
// Projects API
// ========================================
export async function apiGetProjects(customerId?: number | string) {
    const params: Record<string, string> = {};
    if (customerId) params.customerId = String(customerId);
    return gasGet('getProjects', params);
}

export async function apiGetProject(id: number | string) {
    return gasGet('getProject', { id: String(id) });
}

export async function apiCreateProject(data: Record<string, any>) {
    return gasPost('createProject', { data });
}

export async function apiUpdateProject(id: number | string, data: Record<string, any>) {
    return gasPost('updateProject', { id: Number(id), data });
}

// ========================================
// Maintenance Logs API
// ========================================
export async function apiGetMaintenanceLogs(projectId: number | string) {
    return gasGet('getMaintenanceLogs', { projectId: String(projectId) });
}

export async function apiGetAllMaintenanceLogs() {
    return gasGet('getAllMaintenanceLogs');
}

export async function apiCreateMaintenanceLog(data: Record<string, any>) {
    return gasPost('createMaintenanceLog', { data });
}

export async function apiUpdateMaintenanceLog(id: number | string, data: Record<string, any>) {
    return gasPost('updateMaintenanceLog', { id: Number(id), data });
}

export async function apiDeleteMaintenanceLog(id: number | string) {
    return gasPost('deleteMaintenanceLog', { id: Number(id) });
}

// ========================================
// Contracts API
// ========================================
export async function apiGetContracts(projectId: number | string) {
    return gasGet('getContracts', { projectId: String(projectId) });
}

export async function apiCreateContract(data: Record<string, any>) {
    return gasPost('createContract', { data });
}

// ========================================
// Invoices API
// ========================================
export async function apiGetInvoices(contractId: number | string) {
    return gasGet('getInvoices', { contractId: String(contractId) });
}

export async function apiCreateInvoice(data: Record<string, any>) {
    return gasPost('createInvoice', { data });
}

export async function apiUpdateInvoiceStatus(id: number | string, status: string) {
    return gasPost('updateInvoiceStatus', { id: Number(id), status });
}

// ========================================
// Power Plant Specs API
// ========================================
export async function apiGetPowerPlantSpecs(projectId: number | string) {
    return gasGet('getPowerPlantSpecs', { projectId: String(projectId) });
}

export async function apiUpdatePowerPlantSpecs(projectId: number | string, data: Record<string, any>) {
    return gasPost('updatePowerPlantSpecs', { projectId: Number(projectId), data });
}

// ========================================
// Regulatory Info API
// ========================================
export async function apiGetRegulatoryInfo(projectId: number | string) {
    return gasGet('getRegulatoryInfo', { projectId: String(projectId) });
}

export async function apiUpdateRegulatoryInfo(projectId: number | string, data: Record<string, any>) {
    return gasPost('updateRegulatoryInfo', { projectId: Number(projectId), data });
}

// ========================================
// Dashboard API
// ========================================
export async function apiGetDashboard() {
    return gasGet('getDashboard');
}
