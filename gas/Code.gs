/**
 * Ageful Customer Management System - Google Apps Script Backend
 * 
 * このスクリプトをGoogle Apps Scriptにコピーし、
 * Web App としてデプロイしてください。
 */

// ========================================
// 設定
// ========================================
const SPREADSHEET_ID = ''; // ← ここにスプレッドシートIDを入力

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ========================================
// スプレッドシート初期化 (最初に1回だけ実行)
// ========================================
function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  
  const sheets = {
    'users': ['id', 'email', 'password_hash', 'name', 'role', 'is_active', 'created_at', 'updated_at'],
    'customers': ['id', 'type', 'company_name', 'contact_name', 'email', 'phone', 'postal_code', 'address', 'billing_postal_code', 'billing_address', 'billing_contact_name', 'notes', 'created_by', 'created_at', 'updated_at'],
    'projects': ['id', 'customer_id', 'project_number', 'project_name', 'site_postal_code', 'site_address', 'map_coordinates', 'key_number', 'status', 'created_at', 'updated_at'],
    'power_plant_specs': ['id', 'project_id', 'panel_kw', 'panel_count', 'panel_manufacturer', 'panel_model', 'pcs_kw', 'pcs_count', 'pcs_manufacturer', 'pcs_model', 'updated_at'],
    'regulatory_info': ['id', 'project_id', 'meti_id', 'meti_certification_date', 'fit_rate', 'supply_start_date', 'power_reception_id', 'remote_monitoring_status', 'is_4g_compatible', 'monitoring_credentials', 'updated_at'],
    'maintenance_logs': ['id', 'project_id', 'user_id', 'inquiry_date', 'occurrence_date', 'work_type', 'target_area', 'situation', 'response', 'report', 'status', 'photo_url', 'created_at', 'updated_at'],
    'contracts': ['id', 'project_id', 'contract_type', 'business_owner', 'contractor', 'subcontractor', 'start_date', 'end_date', 'annual_maintenance_fee', 'land_rent', 'communication_fee', 'created_at', 'updated_at'],
    'invoices': ['id', 'contract_id', 'billing_period', 'issue_date', 'amount', 'status', 'payment_due_date', 'paid_at', 'pdf_url', 'created_at']
  };
  
  for (const [name, headers] of Object.entries(sheets)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    } else {
      sheet.clear();
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  // デフォルト管理者追加
  const usersSheet = ss.getSheetByName('users');
  const now = new Date().toISOString();
  // password: password123 → SHA256ハッシュ
  const passwordHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'password123')
    .map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
  usersSheet.appendRow([1, 'admin@ageful.jp', passwordHash, '管理者', 'admin', true, now, now]);
  
  // デフォルトシート（Sheet1）を削除
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('シート1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }
  
  Logger.log('初期化が完了しました！');
}

// ========================================
// HTTP ハンドラー
// ========================================
function doGet(e) {
  const action = e.parameter.action || '';
  let result;
  
  try {
    switch (action) {
      case 'getCustomers':
        result = getCustomers();
        break;
      case 'getCustomer':
        result = getCustomer(e.parameter.id);
        break;
      case 'getProjects':
        result = getProjects(e.parameter.customerId);
        break;
      case 'getProject':
        result = getProject(e.parameter.id);
        break;
      case 'getMaintenanceLogs':
        result = getMaintenanceLogs(e.parameter.projectId);
        break;
      case 'getAllMaintenanceLogs':
        result = getAllMaintenanceLogs();
        break;
      case 'getContracts':
        result = getContracts(e.parameter.projectId);
        break;
      case 'getInvoices':
        result = getInvoices(e.parameter.contractId);
        break;
      case 'getDashboard':
        result = getDashboard();
        break;
      case 'getPowerPlantSpecs':
        result = getPowerPlantSpecs(e.parameter.projectId);
        break;
      case 'getRegulatoryInfo':
        result = getRegulatoryInfo(e.parameter.projectId);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = body.action || '';
  let result;
  
  try {
    switch (action) {
      case 'login':
        result = login(body.email, body.password);
        break;
      case 'createCustomer':
        result = createCustomer(body.data);
        break;
      case 'updateCustomer':
        result = updateCustomer(body.id, body.data);
        break;
      case 'deleteCustomer':
        result = deleteCustomer(body.id);
        break;
      case 'createProject':
        result = createProject(body.data);
        break;
      case 'updateProject':
        result = updateProject(body.id, body.data);
        break;
      case 'createMaintenanceLog':
        result = createMaintenanceLog(body.data);
        break;
      case 'updateMaintenanceLog':
        result = updateMaintenanceLog(body.id, body.data);
        break;
      case 'deleteMaintenanceLog':
        result = deleteMaintenanceLog(body.id);
        break;
      case 'createContract':
        result = createContract(body.data);
        break;
      case 'createInvoice':
        result = createInvoice(body.data);
        break;
      case 'updateInvoiceStatus':
        result = updateInvoiceStatus(body.id, body.status);
        break;
      case 'updatePowerPlantSpecs':
        result = updatePowerPlantSpecs(body.projectId, body.data);
        break;
      case 'updateRegulatoryInfo':
        result = updateRegulatoryInfo(body.projectId, body.data);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// ヘルパー関数
// ========================================
function sheetToObjects(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] === '' ? null : row[i];
    });
    return obj;
  });
}

function getNextId(sheetName) {
  const objects = sheetToObjects(sheetName);
  if (objects.length === 0) return 1;
  const maxId = Math.max(...objects.map(o => Number(o.id) || 0));
  return maxId + 1;
}

function findRowById(sheetName, id) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idNum = Number(id);
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === idNum) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

function getHeaders(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function appendRow(sheetName, dataObj) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = getHeaders(sheetName);
  const row = headers.map(h => dataObj[h] !== undefined ? dataObj[h] : '');
  sheet.appendRow(row);
  return dataObj;
}

function updateRow(sheetName, rowNum, dataObj) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  const headers = getHeaders(sheetName);
  const currentRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  const newRow = headers.map((h, i) => dataObj[h] !== undefined ? dataObj[h] : currentRow[i]);
  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);
}

// ========================================
// 認証
// ========================================
function login(email, password) {
  if (!email || !password) {
    return { success: false, error: 'メールアドレスとパスワードを入力してください' };
  }
  
  const users = sheetToObjects('users');
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }
  
  const inputHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
  
  if (inputHash !== user.password_hash) {
    return { success: false, error: 'パスワードが間違っています' };
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

// ========================================
// 顧客 CRUD
// ========================================
function getCustomers() {
  const customers = sheetToObjects('customers');
  const projects = sheetToObjects('projects');
  
  return customers.map(c => ({
    ...c,
    projects: projects.filter(p => Number(p.customer_id) === Number(c.id))
  }));
}

function getCustomer(id) {
  const customers = sheetToObjects('customers');
  const customer = customers.find(c => Number(c.id) === Number(id));
  if (!customer) return { error: '顧客が見つかりません' };
  
  const projects = sheetToObjects('projects');
  customer.projects = projects.filter(p => Number(p.customer_id) === Number(id));
  
  return customer;
}

function createCustomer(data) {
  const now = new Date().toISOString();
  const newCustomer = {
    id: getNextId('customers'),
    type: data.type || 'individual',
    company_name: data.company_name || '',
    contact_name: data.contact_name || '',
    email: data.email || '',
    phone: data.phone || '',
    postal_code: data.postal_code || '',
    address: data.address || '',
    billing_postal_code: data.billing_postal_code || '',
    billing_address: data.billing_address || '',
    billing_contact_name: data.billing_contact_name || '',
    notes: data.notes || '',
    created_by: data.created_by || '',
    created_at: now,
    updated_at: now
  };
  appendRow('customers', newCustomer);
  return { success: true, data: newCustomer };
}

function updateCustomer(id, data) {
  const rowNum = findRowById('customers', id);
  if (rowNum === -1) return { error: '顧客が見つかりません' };
  
  data.updated_at = new Date().toISOString();
  updateRow('customers', rowNum, data);
  return { success: true };
}

function deleteCustomer(id) {
  const sheet = getSpreadsheet().getSheetByName('customers');
  const rowNum = findRowById('customers', id);
  if (rowNum === -1) return { error: '顧客が見つかりません' };
  sheet.deleteRow(rowNum);
  return { success: true };
}

// ========================================
// 案件 CRUD
// ========================================
function getProjects(customerId) {
  const projects = sheetToObjects('projects');
  if (customerId) {
    return projects.filter(p => Number(p.customer_id) === Number(customerId));
  }
  
  // 全案件（顧客情報付き）
  const customers = sheetToObjects('customers');
  return projects.map(p => {
    const customer = customers.find(c => Number(c.id) === Number(p.customer_id));
    return {
      ...p,
      customers: customer || null
    };
  });
}

function getProject(id) {
  const projects = sheetToObjects('projects');
  const project = projects.find(p => Number(p.id) === Number(id));
  if (!project) return { error: '案件が見つかりません' };
  
  // 関連データを取得
  const customers = sheetToObjects('customers');
  const contracts = sheetToObjects('contracts');
  const invoices = sheetToObjects('invoices');
  const maintenanceLogs = sheetToObjects('maintenance_logs');
  const specs = sheetToObjects('power_plant_specs');
  const regulatory = sheetToObjects('regulatory_info');
  
  project.customers = customers.find(c => Number(c.id) === Number(project.customer_id)) || null;
  
  const projectContracts = contracts.filter(c => Number(c.project_id) === Number(id));
  project.contracts = projectContracts.map(c => ({
    ...c,
    invoices: invoices.filter(inv => Number(inv.contract_id) === Number(c.id))
  }));
  
  project.maintenance_logs = maintenanceLogs
    .filter(m => Number(m.project_id) === Number(id))
    .sort((a, b) => (b.occurrence_date || '').localeCompare(a.occurrence_date || ''));
  
  project.power_plant_specs = specs.find(s => Number(s.project_id) === Number(id)) || null;
  project.regulatory_info = regulatory.find(r => Number(r.project_id) === Number(id)) || null;
  
  return project;
}

function createProject(data) {
  const now = new Date().toISOString();
  const newProject = {
    id: getNextId('projects'),
    customer_id: data.customer_id,
    project_number: data.project_number || '',
    project_name: data.project_name || '',
    site_postal_code: data.site_postal_code || '',
    site_address: data.site_address || data.address || '',
    map_coordinates: data.map_coordinates || '',
    key_number: data.key_number || '',
    status: data.status || 'active',
    created_at: now,
    updated_at: now
  };
  appendRow('projects', newProject);
  return { success: true, data: newProject };
}

function updateProject(id, data) {
  const rowNum = findRowById('projects', id);
  if (rowNum === -1) return { error: '案件が見つかりません' };
  
  data.updated_at = new Date().toISOString();
  updateRow('projects', rowNum, data);
  return { success: true };
}

// ========================================
// 保守記録
// ========================================
function getMaintenanceLogs(projectId) {
  const logs = sheetToObjects('maintenance_logs');
  return logs
    .filter(l => Number(l.project_id) === Number(projectId))
    .sort((a, b) => (b.occurrence_date || '').localeCompare(a.occurrence_date || ''));
}

function getAllMaintenanceLogs() {
  const logs = sheetToObjects('maintenance_logs');
  const projects = sheetToObjects('projects');
  const customers = sheetToObjects('customers');
  
  return logs.map(log => {
    const project = projects.find(p => Number(p.id) === Number(log.project_id));
    const customer = project ? customers.find(c => Number(c.id) === Number(project.customer_id)) : null;
    return {
      ...log,
      projects: project ? {
        ...project,
        customers: customer || null
      } : null
    };
  }).sort((a, b) => (b.occurrence_date || '').localeCompare(a.occurrence_date || ''));
}

function createMaintenanceLog(data) {
  const now = new Date().toISOString();
  const newLog = {
    id: getNextId('maintenance_logs'),
    project_id: data.project_id,
    user_id: data.user_id || '',
    inquiry_date: data.inquiry_date || '',
    occurrence_date: data.occurrence_date || '',
    work_type: data.work_type || '',
    target_area: data.target_area || '',
    situation: data.situation || '',
    response: data.response || '',
    report: data.report || '',
    status: data.status || 'pending',
    photo_url: data.photo_url || '',
    created_at: now,
    updated_at: now
  };
  appendRow('maintenance_logs', newLog);
  return { success: true, data: newLog };
}

function updateMaintenanceLog(id, data) {
  const rowNum = findRowById('maintenance_logs', id);
  if (rowNum === -1) return { error: '保守記録が見つかりません' };
  
  data.updated_at = new Date().toISOString();
  updateRow('maintenance_logs', rowNum, data);
  return { success: true };
}

function deleteMaintenanceLog(id) {
  const sheet = getSpreadsheet().getSheetByName('maintenance_logs');
  const rowNum = findRowById('maintenance_logs', id);
  if (rowNum === -1) return { error: '保守記録が見つかりません' };
  sheet.deleteRow(rowNum);
  return { success: true };
}

// ========================================
// 契約
// ========================================
function getContracts(projectId) {
  const contracts = sheetToObjects('contracts');
  const invoices = sheetToObjects('invoices');
  
  const filtered = contracts.filter(c => Number(c.project_id) === Number(projectId));
  return filtered.map(c => ({
    ...c,
    invoices: invoices.filter(inv => Number(inv.contract_id) === Number(c.id))
  }));
}

function createContract(data) {
  const now = new Date().toISOString();
  const newContract = {
    id: getNextId('contracts'),
    project_id: data.project_id,
    contract_type: data.contract_type || 'maintenance',
    business_owner: data.business_owner || '',
    contractor: data.contractor || '',
    subcontractor: data.subcontractor || '',
    start_date: data.start_date || '',
    end_date: data.end_date || '',
    annual_maintenance_fee: data.annual_maintenance_fee || 0,
    land_rent: data.land_rent || 0,
    communication_fee: data.communication_fee || 0,
    created_at: now,
    updated_at: now
  };
  appendRow('contracts', newContract);
  return { success: true, data: newContract };
}

// ========================================
// 請求
// ========================================
function getInvoices(contractId) {
  const invoices = sheetToObjects('invoices');
  return invoices.filter(inv => Number(inv.contract_id) === Number(contractId));
}

function createInvoice(data) {
  const now = new Date().toISOString();
  const newInvoice = {
    id: getNextId('invoices'),
    contract_id: data.contract_id,
    billing_period: data.billing_period || '',
    issue_date: data.issue_date || now.split('T')[0],
    amount: data.amount || 0,
    status: data.status || 'unbilled',
    payment_due_date: data.payment_due_date || '',
    paid_at: data.paid_at || '',
    pdf_url: data.pdf_url || '',
    created_at: now
  };
  appendRow('invoices', newInvoice);
  return { success: true, data: newInvoice };
}

function updateInvoiceStatus(id, status) {
  const rowNum = findRowById('invoices', id);
  if (rowNum === -1) return { error: '請求が見つかりません' };
  
  const updateData = { status: status };
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString().split('T')[0];
  }
  updateRow('invoices', rowNum, updateData);
  return { success: true };
}

// ========================================
// 発電所スペック
// ========================================
function getPowerPlantSpecs(projectId) {
  const specs = sheetToObjects('power_plant_specs');
  return specs.find(s => Number(s.project_id) === Number(projectId)) || null;
}

function updatePowerPlantSpecs(projectId, data) {
  const specs = sheetToObjects('power_plant_specs');
  const existing = specs.find(s => Number(s.project_id) === Number(projectId));
  
  if (existing) {
    const rowNum = findRowById('power_plant_specs', existing.id);
    data.updated_at = new Date().toISOString();
    updateRow('power_plant_specs', rowNum, data);
  } else {
    const now = new Date().toISOString();
    const newSpec = {
      id: getNextId('power_plant_specs'),
      project_id: projectId,
      ...data,
      updated_at: now
    };
    appendRow('power_plant_specs', newSpec);
  }
  return { success: true };
}

// ========================================
// 制度情報
// ========================================
function getRegulatoryInfo(projectId) {
  const info = sheetToObjects('regulatory_info');
  return info.find(r => Number(r.project_id) === Number(projectId)) || null;
}

function updateRegulatoryInfo(projectId, data) {
  const info = sheetToObjects('regulatory_info');
  const existing = info.find(r => Number(r.project_id) === Number(projectId));
  
  if (existing) {
    const rowNum = findRowById('regulatory_info', existing.id);
    data.updated_at = new Date().toISOString();
    updateRow('regulatory_info', rowNum, data);
  } else {
    const now = new Date().toISOString();
    const newInfo = {
      id: getNextId('regulatory_info'),
      project_id: projectId,
      ...data,
      updated_at: now
    };
    appendRow('regulatory_info', newInfo);
  }
  return { success: true };
}

// ========================================
// ダッシュボード
// ========================================
function getDashboard() {
  const customers = sheetToObjects('customers');
  const projects = sheetToObjects('projects');
  const maintenanceLogs = sheetToObjects('maintenance_logs');
  const invoices = sheetToObjects('invoices');
  const contracts = sheetToObjects('contracts');
  
  // 今月の請求
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const thisMonthInvoices = invoices.filter(inv => (inv.billing_period || '').startsWith(thisMonth));
  
  // 未対応メンテナンス
  const pendingMaintenance = maintenanceLogs.filter(m => m.status === 'pending' || m.status === '未対応');
  
  // 未請求の請求書
  const unbilledInvoices = invoices.filter(inv => inv.status === 'unbilled' || inv.status === '未請求');
  
  // 最近のメンテナンス
  const recentMaintenance = maintenanceLogs
    .sort((a, b) => (b.occurrence_date || '').localeCompare(a.occurrence_date || ''))
    .slice(0, 5)
    .map(log => {
      const project = projects.find(p => Number(p.id) === Number(log.project_id));
      const customer = project ? customers.find(c => Number(c.id) === Number(project.customer_id)) : null;
      return {
        ...log,
        projects: project ? { ...project, customers: customer } : null
      };
    });
  
  return {
    totalCustomers: customers.length,
    totalProjects: projects.length,
    pendingMaintenanceCount: pendingMaintenance.length,
    unbilledInvoiceCount: unbilledInvoices.length,
    thisMonthRevenue: thisMonthInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
    totalContracts: contracts.length,
    recentMaintenance: recentMaintenance
  };
}
