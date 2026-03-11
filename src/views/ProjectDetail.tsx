import { useState } from 'react'
import type { ProjectDetail, AnnualRecordInput, PeriodicMaintenanceInput, MaintenanceResponseInput } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import {
  createMaintenanceResponse, deleteMaintenanceResponse,
  createPeriodicMaintenance, deletePeriodicMaintenance,
  upsertAnnualRecord, updateAnnualRecordStatus, updateContract, updateProject,
} from '../lib/actions'

type Tab = '基本情報' | '保守対応' | '定期保守' | '請求'

type Props = {
  detail: ProjectDetail
  onBack: () => void
  onReload: () => void
  onViewCustomer: (customerId: number) => void
  onViewMaintenance: (id: number) => void
}

const WORK_TYPES = ['点検', '除草', '巡回', 'その他']

export function ProjectDetailView({ detail, onBack, onReload, onViewCustomer, onViewMaintenance }: Props) {
  const { project, customer, contract, annualRecords, maintenanceResponses, periodicMaintenance } = detail
  const [tab, setTab] = useState<Tab>('基本情報')

  // 保守対応フォーム
  const [mrModal, setMrModal] = useState(false)
  const [mrForm, setMrForm] = useState<Omit<MaintenanceResponseInput, 'project_id'>>({
    response_no: '', inquiry_date: '', occurrence_date: '',
    target_area: '', situation: '', response_content: '', report: '',
  })

  // 定期保守フォーム
  const [pmModal, setPmModal] = useState(false)
  const [pmForm, setPmForm] = useState<Omit<PeriodicMaintenanceInput, 'project_id'>>({
    record_date: '', work_type: '点検', content: '',
  })

  // 年次記録フォーム
  const currentYear = new Date().getFullYear()
  const [arModal, setArModal] = useState(false)
  const [arForm, setArForm] = useState<Omit<AnnualRecordInput, 'contract_id'>>({
    year: currentYear,
    billing_date: '',
    received_date: '',
    maintenance_record: '',
    escort_record: '',
    status: '未入金',
  })

  // 案件基本情報編集フォーム
  const [projModal, setProjModal] = useState(false)
  const [projForm, setProjForm] = useState({
    project_no: project.project_no ?? '',
    project_name: project.project_name,
    plant_name: project.plant_name ?? '',
    site_postal_code: project.site_postal_code ?? '',
    site_prefecture: project.site_prefecture ?? '',
    site_address: project.site_address ?? '',
    latitude: project.latitude != null ? String(project.latitude) : '',
    longitude: project.longitude != null ? String(project.longitude) : '',
    panel_kw: project.panel_kw != null ? String(project.panel_kw) : '',
    panel_count: project.panel_count != null ? String(project.panel_count) : '',
    panel_maker: project.panel_maker ?? '',
    panel_model: project.panel_model ?? '',
    pcs_kw: project.pcs_kw != null ? String(project.pcs_kw) : '',
    pcs_count: project.pcs_count != null ? String(project.pcs_count) : '',
    pcs_maker: project.pcs_maker ?? '',
    pcs_model: project.pcs_model ?? '',
    grid_id: project.grid_id ?? '',
    grid_certified_at: project.grid_certified_at ?? '',
    fit_period: project.fit_period != null ? String(project.fit_period) : '',
    power_supply_start_date: project.power_supply_start_date ?? '',
    customer_number: project.customer_number ?? '',
    generation_point_id: project.generation_point_id ?? '',
    meter_reading_day: project.meter_reading_day ?? '',
    monitoring_system: project.monitoring_system ?? '',
    monitoring_id: project.monitoring_id ?? '',
    monitoring_user: project.monitoring_user ?? '',
    monitoring_pw: project.monitoring_pw ?? '',
    has_4g: project.has_4g == null ? '' : project.has_4g ? 'true' : 'false',
    key_number: project.key_number ?? '',
    local_association: project.local_association ?? '',
    old_owner: project.old_owner ?? '',
    sales_company: project.sales_company ?? '',
    referrer: project.referrer ?? '',
    power_change_date: project.power_change_date ?? '',
    handover_date: project.handover_date ?? '',
    sales_price: project.sales_price != null ? String(project.sales_price) : '',
    reference_price: project.reference_price != null ? String(project.reference_price) : '',
    land_cost: project.land_cost != null ? String(project.land_cost) : '',
    amuras_member_no: project.amuras_member_no ?? '',
    notes: project.notes ?? '',
  })

  // 契約フォーム
  const [contractModal, setContractModal] = useState(false)
  const [contractForm, setContractForm] = useState({
    billing_method: contract?.billing_method ?? '',
    billing_amount_ex: contract?.billing_amount_ex != null ? String(contract.billing_amount_ex) : '',
    billing_amount_inc: contract?.billing_amount_inc != null ? String(contract.billing_amount_inc) : '',
    annual_maintenance_ex: contract?.annual_maintenance_ex != null ? String(contract.annual_maintenance_ex) : '',
    annual_maintenance_inc: contract?.annual_maintenance_inc != null ? String(contract.annual_maintenance_inc) : '',
    subcontractor: contract?.subcontractor ?? '',
    subcontract_fee_ex: contract?.subcontract_fee_ex != null ? String(contract.subcontract_fee_ex) : '',
    maintenance_start_date: contract?.maintenance_start_date ?? '',
    notes: contract?.notes ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // ── 保守対応 ─────────────────────────────────────────────

  // ── 案件基本情報編集 ──────────────────────────────────────

  async function handleSaveProject() {
    if (!projForm.project_name.trim()) { setErr('案件名は必須です'); return }
    setSaving(true); setErr('')
    try {
      await updateProject(project.id, {
        ...projForm,
        has_4g: projForm.has_4g === 'true' ? true : projForm.has_4g === 'false' ? false : (null as unknown as boolean),
        monitoring_user: projForm.monitoring_user,
      })
      setProjModal(false)
      onReload()
    } catch (e) { setErr(String(e)) } finally { setSaving(false) }
  }

  function openProjEdit() {
    setProjForm({
      project_no: project.project_no ?? '',
      project_name: project.project_name,
      plant_name: project.plant_name ?? '',
      site_postal_code: project.site_postal_code ?? '',
      site_prefecture: project.site_prefecture ?? '',
      site_address: project.site_address ?? '',
      latitude: project.latitude != null ? String(project.latitude) : '',
      longitude: project.longitude != null ? String(project.longitude) : '',
      panel_kw: project.panel_kw != null ? String(project.panel_kw) : '',
      panel_count: project.panel_count != null ? String(project.panel_count) : '',
      panel_maker: project.panel_maker ?? '',
      panel_model: project.panel_model ?? '',
      pcs_kw: project.pcs_kw != null ? String(project.pcs_kw) : '',
      pcs_count: project.pcs_count != null ? String(project.pcs_count) : '',
      pcs_maker: project.pcs_maker ?? '',
      pcs_model: project.pcs_model ?? '',
      grid_id: project.grid_id ?? '',
      grid_certified_at: project.grid_certified_at ?? '',
      fit_period: project.fit_period != null ? String(project.fit_period) : '',
      power_supply_start_date: project.power_supply_start_date ?? '',
      customer_number: project.customer_number ?? '',
      generation_point_id: project.generation_point_id ?? '',
      meter_reading_day: project.meter_reading_day ?? '',
      monitoring_system: project.monitoring_system ?? '',
      monitoring_id: project.monitoring_id ?? '',
      monitoring_user: project.monitoring_user ?? '',
      monitoring_pw: project.monitoring_pw ?? '',
      has_4g: project.has_4g == null ? '' : project.has_4g ? 'true' : 'false',
      key_number: project.key_number ?? '',
      local_association: project.local_association ?? '',
      old_owner: project.old_owner ?? '',
      sales_company: project.sales_company ?? '',
      referrer: project.referrer ?? '',
      power_change_date: project.power_change_date ?? '',
      handover_date: project.handover_date ?? '',
      sales_price: project.sales_price != null ? String(project.sales_price) : '',
      reference_price: project.reference_price != null ? String(project.reference_price) : '',
      land_cost: project.land_cost != null ? String(project.land_cost) : '',
      amuras_member_no: project.amuras_member_no ?? '',
      notes: project.notes ?? '',
    })
    setErr('')
    setProjModal(true)
  }

  // ── 保守対応 ─────────────────────────────────────────────

  async function handleCreateMR() {
    setSaving(true); setErr('')
    try {
      await createMaintenanceResponse({ ...mrForm, project_id: project.id })
      setMrModal(false)
      onReload()
    } catch (e) { setErr(String(e)) } finally { setSaving(false) }
  }

  async function handleDeleteMR(id: number) {
    if (!confirm('この保守対応記録を削除しますか？')) return
    await deleteMaintenanceResponse(id)
    onReload()
  }

  // ── 定期保守 ─────────────────────────────────────────────

  async function handleCreatePM() {
    if (!pmForm.record_date) { setErr('記録日は必須です'); return }
    setSaving(true); setErr('')
    try {
      await createPeriodicMaintenance({ ...pmForm, project_id: project.id })
      setPmModal(false)
      onReload()
    } catch (e) { setErr(String(e)) } finally { setSaving(false) }
  }

  async function handleDeletePM(id: number) {
    if (!confirm('この定期保守記録を削除しますか？')) return
    await deletePeriodicMaintenance(id)
    onReload()
  }

  // ── 年次記録 ─────────────────────────────────────────────

  function openArModal(year?: number) {
    const existing = annualRecords.find(r => r.year === (year ?? currentYear))
    setArForm({
      year: year ?? currentYear,
      billing_date: existing?.billing_date ?? '',
      received_date: existing?.received_date ?? '',
      maintenance_record: existing?.maintenance_record ?? '',
      escort_record: existing?.escort_record ?? '',
      status: existing?.status ?? '未入金',
    })
    setArModal(true)
    setErr('')
  }

  async function handleUpsertAR() {
    if (!contract) return
    setSaving(true); setErr('')
    try {
      await upsertAnnualRecord({ ...arForm, contract_id: contract.id })
      setArModal(false)
      onReload()
    } catch (e) { setErr(String(e)) } finally { setSaving(false) }
  }

  async function handleARStatusChange(id: number, status: '未入金' | '請求済' | '入金済') {
    await updateAnnualRecordStatus(id, status)
    onReload()
  }

  // ── 契約 ─────────────────────────────────────────────────

  async function handleSaveContract() {
    if (!contract) return
    setSaving(true); setErr('')
    try {
      const toNum = (v: string) => v ? parseInt(v.replace(/,/g, ''), 10) : null
      await updateContract(contract.id, {
        billing_method: contractForm.billing_method || null,
        billing_amount_ex: toNum(contractForm.billing_amount_ex),
        billing_amount_inc: toNum(contractForm.billing_amount_inc),
        annual_maintenance_ex: toNum(contractForm.annual_maintenance_ex),
        annual_maintenance_inc: toNum(contractForm.annual_maintenance_inc),
        subcontractor: contractForm.subcontractor || null,
        subcontract_fee_ex: toNum(contractForm.subcontract_fee_ex),
        maintenance_start_date: contractForm.maintenance_start_date || null,
        notes: contractForm.notes || null,
      })
      setContractModal(false)
      onReload()
    } catch (e) { setErr(String(e)) } finally { setSaving(false) }
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← 案件一覧に戻る</button>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>顧客：</span>
        <button
          className="link-btn"
          onClick={() => onViewCustomer(project.customer_id)}
        >
          {customer.company_name ?? customer.name}
        </button>
      </div>

      {/* タブ */}
      <div className="tab-bar">
        {(['基本情報', '保守対応', '定期保守', '請求'] as Tab[]).map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === '保守対応' && maintenanceResponses.filter(m => m.status === '対応中').length > 0 && (
              <span className="tab-badge">{maintenanceResponses.filter(m => m.status === '対応中').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── 基本情報 ── */}
      {tab === '基本情報' && (
        <div className="card">
          <div className="card-header-row">
            <h3 className="section-title" style={{ margin: 0 }}>案件情報</h3>
            <button className="btn btn-sub btn-sm" onClick={openProjEdit}>編集</button>
          </div>
          <div className="info-grid">
            <div className="info-field"><span>案件番号</span><b>{project.project_no ?? '-'}</b></div>
            <div className="info-field"><span>発電所名</span><b>{project.plant_name ?? '-'}</b></div>
            <div className="info-field"><span>都道府県</span><b>{project.site_prefecture ?? '-'}</b></div>
            <div className="info-field" style={{ gridColumn: '1/-1' }}><span>設置住所</span><b>{project.site_address ?? '-'}</b></div>
            <div className="info-field"><span>系統ID</span><b>{project.grid_id ?? '-'}</b></div>
            <div className="info-field"><span>系統認定日</span><b>{project.grid_certified_at ?? '-'}</b></div>
            <div className="info-field"><span>FIT期間</span><b>{project.fit_period != null ? `${project.fit_period}年` : '-'}</b></div>
            <div className="info-field"><span>給電開始日</span><b>{project.power_supply_start_date ?? '-'}</b></div>
            <div className="info-field"><span>お客さま番号</span><b>{project.customer_number ?? '-'}</b></div>
            <div className="info-field"><span>発電地点特定番号</span><b>{project.generation_point_id ?? '-'}</b></div>
            <div className="info-field"><span>パネル</span><b>{project.panel_kw != null ? `${project.panel_kw}kW` : '-'} / {project.panel_count != null ? `${project.panel_count}枚` : '-'}</b></div>
            <div className="info-field"><span>パネルメーカー</span><b>{project.panel_maker ?? '-'} {project.panel_model ?? ''}</b></div>
            <div className="info-field"><span>PCS</span><b>{project.pcs_kw != null ? `${project.pcs_kw}kW` : '-'} / {project.pcs_count != null ? `${project.pcs_count}台` : '-'}</b></div>
            <div className="info-field"><span>PCSメーカー</span><b>{project.pcs_maker ?? '-'} {project.pcs_model ?? ''}</b></div>
            <div className="info-field"><span>監視システム</span><b>{project.monitoring_system ?? '-'}</b></div>
            <div className="info-field"><span>監視ID</span><b>{project.monitoring_id ?? '-'}</b></div>
            <div className="info-field"><span>4G</span><b>{project.has_4g == null ? '-' : project.has_4g ? 'あり' : 'なし'}</b></div>
            <div className="info-field"><span>キー番号</span><b>{project.key_number ?? '-'}</b></div>
            <div className="info-field"><span>旧所有者</span><b>{project.old_owner ?? '-'}</b></div>
            <div className="info-field"><span>販売会社</span><b>{project.sales_company ?? '-'}</b></div>
            <div className="info-field"><span>紹介者</span><b>{project.referrer ?? '-'}</b></div>
            <div className="info-field"><span>電力変更日</span><b>{project.power_change_date ?? '-'}</b></div>
            <div className="info-field"><span>引渡日</span><b>{project.handover_date ?? '-'}</b></div>
            <div className="info-field"><span>販売価格（税込）</span><b>{project.sales_price != null ? `¥${project.sales_price.toLocaleString()}` : '-'}</b></div>
            <div className="info-field"><span>土地代</span><b>{project.land_cost != null ? `¥${project.land_cost.toLocaleString()}` : '-'}</b></div>
            <div className="info-field"><span>アムラス会員番号</span><b>{project.amuras_member_no ?? '-'}</b></div>
            <div className="info-field" style={{ gridColumn: '1/-1' }}><span>備考</span><b style={{ whiteSpace: 'pre-wrap' }}>{project.notes || '-'}</b></div>
          </div>
        </div>
      )}

      {/* ── 保守対応 ── */}
      {tab === '保守対応' && (
        <div className="card">
          <div className="card-header-row">
            <h3 className="section-title" style={{ margin: 0 }}>保守対応記録</h3>
            <button className="btn btn-main btn-sm" onClick={() => { setMrForm({ response_no: '', inquiry_date: '', occurrence_date: '', target_area: '', situation: '', response_content: '', report: '' }); setErr(''); setMrModal(true) }}>
              ＋ 追加
            </button>
          </div>
          <table>
            <thead>
              <tr><th>管理番号</th><th>問合日</th><th>発生日</th><th>対象箇所</th><th>状態</th><th>操作</th></tr>
            </thead>
            <tbody>
              {maintenanceResponses.length === 0 && (
                <tr><td colSpan={6} className="empty-cell">保守対応記録がありません</td></tr>
              )}
              {maintenanceResponses.map(m => (
                <tr key={m.id} className="clickable-row" onClick={() => onViewMaintenance(m.id)}>
                  <td>{m.response_no ?? '-'}</td>
                  <td>{m.inquiry_date ?? '-'}</td>
                  <td>{m.occurrence_date ?? '-'}</td>
                  <td>{m.target_area ?? '-'}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" title="削除" onClick={() => handleDeleteMR(m.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 定期保守 ── */}
      {tab === '定期保守' && (
        <div className="card">
          <div className="card-header-row">
            <h3 className="section-title" style={{ margin: 0 }}>定期保守記録</h3>
            <button className="btn btn-main btn-sm" onClick={() => { setPmForm({ record_date: '', work_type: '点検', content: '' }); setErr(''); setPmModal(true) }}>
              ＋ 追加
            </button>
          </div>
          <table>
            <thead>
              <tr><th>記録日</th><th>作業種別</th><th>内容</th><th>操作</th></tr>
            </thead>
            <tbody>
              {periodicMaintenance.length === 0 && (
                <tr><td colSpan={4} className="empty-cell">定期保守記録がありません</td></tr>
              )}
              {periodicMaintenance.map(m => (
                <tr key={m.id}>
                  <td>{m.record_date}</td>
                  <td>{m.work_type ?? '-'}</td>
                  <td>{m.content ?? '-'}</td>
                  <td>
                    <button className="btn-icon" title="削除" onClick={() => handleDeletePM(m.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 請求 ── */}
      {tab === '請求' && (
        <>
          <div className="card">
            <div className="card-header-row">
              <h3 className="section-title" style={{ margin: 0 }}>契約情報</h3>
              {contract && (
                <button className="btn btn-sub btn-sm" onClick={() => { setContractForm({
                  billing_method: contract.billing_method ?? '',
                  billing_amount_ex: contract.billing_amount_ex != null ? String(contract.billing_amount_ex) : '',
                  billing_amount_inc: contract.billing_amount_inc != null ? String(contract.billing_amount_inc) : '',
                  annual_maintenance_ex: contract.annual_maintenance_ex != null ? String(contract.annual_maintenance_ex) : '',
                  annual_maintenance_inc: contract.annual_maintenance_inc != null ? String(contract.annual_maintenance_inc) : '',
                  subcontractor: contract.subcontractor ?? '',
                  subcontract_fee_ex: contract.subcontract_fee_ex != null ? String(contract.subcontract_fee_ex) : '',
                  maintenance_start_date: contract.maintenance_start_date ?? '',
                  notes: contract.notes ?? '',
                }); setErr(''); setContractModal(true) }}>
                  編集
                </button>
              )}
            </div>
            {!contract ? (
              <p className="empty-cell">契約情報がありません</p>
            ) : (
              <div className="info-grid">
                <div className="info-field"><span>請求方法</span><b>{contract.billing_method ?? '-'}</b></div>
                <div className="info-field"><span>年次保守料（税抜）</span><b>{contract.annual_maintenance_ex != null ? `¥${contract.annual_maintenance_ex.toLocaleString()}` : '-'}</b></div>
                <div className="info-field"><span>年次保守料（税込）</span><b>{contract.annual_maintenance_inc != null ? `¥${contract.annual_maintenance_inc.toLocaleString()}` : '-'}</b></div>
                <div className="info-field"><span>請求額（税抜）</span><b>{contract.billing_amount_ex != null ? `¥${contract.billing_amount_ex.toLocaleString()}` : '-'}</b></div>
                <div className="info-field"><span>請求額（税込）</span><b>{contract.billing_amount_inc != null ? `¥${contract.billing_amount_inc.toLocaleString()}` : '-'}</b></div>
                <div className="info-field"><span>委託先</span><b>{contract.subcontractor ?? '-'}</b></div>
                <div className="info-field"><span>委託料（税抜）</span><b>{contract.subcontract_fee_ex != null ? `¥${contract.subcontract_fee_ex.toLocaleString()}` : '-'}</b></div>
                <div className="info-field"><span>保守開始日</span><b>{contract.maintenance_start_date ?? '-'}</b></div>
                {contract.notes && <div className="info-field" style={{ gridColumn: '1/-1' }}><span>備考</span><b>{contract.notes}</b></div>}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header-row">
              <h3 className="section-title" style={{ margin: 0 }}>年次記録</h3>
              <button className="btn btn-main btn-sm" onClick={() => { openArModal(); }}>
                ＋ 追加 / 編集
              </button>
            </div>
            <table>
              <thead>
                <tr><th>年度</th><th>請求日</th><th>入金日</th><th>状態</th><th>変更</th></tr>
              </thead>
              <tbody>
                {annualRecords.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">年次記録がありません</td></tr>
                )}
                {annualRecords.sort((a, b) => b.year - a.year).map(r => (
                  <tr key={r.id}>
                    <td><button className="link-btn" onClick={() => openArModal(r.year)}>{r.year}年</button></td>
                    <td>{r.billing_date ?? '-'}</td>
                    <td>{r.received_date ?? '-'}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <select
                        className="status-select"
                        value={r.status}
                        onChange={e => handleARStatusChange(r.id, e.target.value as '未入金' | '請求済' | '入金済')}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="未入金">未入金</option>
                        <option value="請求済">請求済</option>
                        <option value="入金済">入金済</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 保守対応モーダル */}
      {mrModal && (
        <Modal title="保守対応記録を追加" onClose={() => setMrModal(false)}>
          {err && <div className="form-error">{err}</div>}
          <div className="form-grid">
            <label className="form-label">
              管理番号
              <input className="form-input" value={mrForm.response_no} onChange={e => setMrForm(f => ({ ...f, response_no: e.target.value }))} />
            </label>
            <label className="form-label">
              問合日
              <input className="form-input" type="date" value={mrForm.inquiry_date} onChange={e => setMrForm(f => ({ ...f, inquiry_date: e.target.value }))} />
            </label>
            <label className="form-label">
              発生日
              <input className="form-input" type="date" value={mrForm.occurrence_date} onChange={e => setMrForm(f => ({ ...f, occurrence_date: e.target.value }))} />
            </label>
            <label className="form-label">
              対象箇所
              <input className="form-input" value={mrForm.target_area} onChange={e => setMrForm(f => ({ ...f, target_area: e.target.value }))} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              状況
              <textarea className="form-input" rows={3} value={mrForm.situation} onChange={e => setMrForm(f => ({ ...f, situation: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              対応
              <textarea className="form-input" rows={3} value={mrForm.response_content} onChange={e => setMrForm(f => ({ ...f, response_content: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              報告
              <textarea className="form-input" rows={3} value={mrForm.report} onChange={e => setMrForm(f => ({ ...f, report: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sub" onClick={() => setMrModal(false)}>キャンセル</button>
            <button className="btn btn-main" onClick={handleCreateMR} disabled={saving}>{saving ? '保存中...' : '追加する'}</button>
          </div>
        </Modal>
      )}

      {/* 定期保守モーダル */}
      {pmModal && (
        <Modal title="定期保守記録を追加" onClose={() => setPmModal(false)}>
          {err && <div className="form-error">{err}</div>}
          <div className="form-grid">
            <label className="form-label required">
              記録日
              <input className="form-input" type="date" value={pmForm.record_date} onChange={e => setPmForm(f => ({ ...f, record_date: e.target.value }))} />
            </label>
            <label className="form-label">
              作業種別
              <select className="form-select" value={pmForm.work_type} onChange={e => setPmForm(f => ({ ...f, work_type: e.target.value }))}>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              内容
              <textarea className="form-input" rows={4} value={pmForm.content} onChange={e => setPmForm(f => ({ ...f, content: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sub" onClick={() => setPmModal(false)}>キャンセル</button>
            <button className="btn btn-main" onClick={handleCreatePM} disabled={saving}>{saving ? '保存中...' : '追加する'}</button>
          </div>
        </Modal>
      )}

      {/* 年次記録モーダル */}
      {arModal && (
        <Modal title={`${arForm.year}年度 年次記録`} onClose={() => setArModal(false)}>
          {err && <div className="form-error">{err}</div>}
          <div className="form-grid">
            <label className="form-label">
              年度
              <input className="form-input" type="number" value={arForm.year} onChange={e => setArForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
            </label>
            <label className="form-label">
              状態
              <select className="form-select" value={arForm.status} onChange={e => setArForm(f => ({ ...f, status: e.target.value as '未入金' | '請求済' | '入金済' }))}>
                <option value="未入金">未入金</option>
                <option value="請求済">請求済</option>
                <option value="入金済">入金済</option>
              </select>
            </label>
            <label className="form-label">
              請求日
              <input className="form-input" type="date" value={arForm.billing_date} onChange={e => setArForm(f => ({ ...f, billing_date: e.target.value }))} />
            </label>
            <label className="form-label">
              入金日
              <input className="form-input" type="date" value={arForm.received_date} onChange={e => setArForm(f => ({ ...f, received_date: e.target.value }))} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              保守記録メモ
              <textarea className="form-input" rows={3} value={arForm.maintenance_record} onChange={e => setArForm(f => ({ ...f, maintenance_record: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              駆付記録
              <textarea className="form-input" rows={3} value={arForm.escort_record} onChange={e => setArForm(f => ({ ...f, escort_record: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sub" onClick={() => setArModal(false)}>キャンセル</button>
            <button className="btn btn-main" onClick={handleUpsertAR} disabled={saving}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        </Modal>
      )}

      {/* 契約編集モーダル */}
      {contractModal && (
        <Modal title="契約情報を編集" onClose={() => setContractModal(false)}>
          {err && <div className="form-error">{err}</div>}
          <div className="form-grid">
            <label className="form-label">
              請求方法
              <select className="form-select" value={contractForm.billing_method} onChange={e => setContractForm(f => ({ ...f, billing_method: e.target.value }))}>
                <option value="">-</option>
                <option value="請求書">請求書</option>
                <option value="ROBOT">ROBOT</option>
              </select>
            </label>
            <label className="form-label">
              保守開始日
              <input className="form-input" type="date" value={contractForm.maintenance_start_date} onChange={e => setContractForm(f => ({ ...f, maintenance_start_date: e.target.value }))} />
            </label>
            <label className="form-label">
              年次保守料（税抜）
              <input className="form-input" type="number" value={contractForm.annual_maintenance_ex} onChange={e => setContractForm(f => ({ ...f, annual_maintenance_ex: e.target.value }))} />
            </label>
            <label className="form-label">
              年次保守料（税込）
              <input className="form-input" type="number" value={contractForm.annual_maintenance_inc} onChange={e => setContractForm(f => ({ ...f, annual_maintenance_inc: e.target.value }))} />
            </label>
            <label className="form-label">
              請求額（税抜）
              <input className="form-input" type="number" value={contractForm.billing_amount_ex} onChange={e => setContractForm(f => ({ ...f, billing_amount_ex: e.target.value }))} />
            </label>
            <label className="form-label">
              請求額（税込）
              <input className="form-input" type="number" value={contractForm.billing_amount_inc} onChange={e => setContractForm(f => ({ ...f, billing_amount_inc: e.target.value }))} />
            </label>
            <label className="form-label">
              委託先
              <input className="form-input" value={contractForm.subcontractor} onChange={e => setContractForm(f => ({ ...f, subcontractor: e.target.value }))} />
            </label>
            <label className="form-label">
              委託料（税抜）
              <input className="form-input" type="number" value={contractForm.subcontract_fee_ex} onChange={e => setContractForm(f => ({ ...f, subcontract_fee_ex: e.target.value }))} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              備考
              <textarea className="form-input" rows={3} value={contractForm.notes} onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sub" onClick={() => setContractModal(false)}>キャンセル</button>
            <button className="btn btn-main" onClick={handleSaveContract} disabled={saving}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        </Modal>
      )}

      {/* 案件基本情報編集モーダル */}
      {projModal && (
        <Modal title="案件情報を編集" onClose={() => setProjModal(false)}>
          {err && <div className="form-error">{err}</div>}
          <div className="form-grid">
            <label className="form-label required" style={{ gridColumn: '1/-1' }}>
              案件名
              <input className="form-input" value={projForm.project_name} onChange={e => setProjForm(f => ({ ...f, project_name: e.target.value }))} />
            </label>
            <label className="form-label">
              案件番号
              <input className="form-input" value={projForm.project_no} onChange={e => setProjForm(f => ({ ...f, project_no: e.target.value }))} />
            </label>
            <label className="form-label">
              発電所名
              <input className="form-input" value={projForm.plant_name} onChange={e => setProjForm(f => ({ ...f, plant_name: e.target.value }))} />
            </label>
            <label className="form-label">
              郵便番号（発電所）
              <input className="form-input" value={projForm.site_postal_code} onChange={e => setProjForm(f => ({ ...f, site_postal_code: e.target.value }))} />
            </label>
            <label className="form-label">
              都道府県
              <input className="form-input" value={projForm.site_prefecture} onChange={e => setProjForm(f => ({ ...f, site_prefecture: e.target.value }))} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              設置住所
              <input className="form-input" value={projForm.site_address} onChange={e => setProjForm(f => ({ ...f, site_address: e.target.value }))} />
            </label>
            <label className="form-label">
              緯度
              <input className="form-input" value={projForm.latitude} onChange={e => setProjForm(f => ({ ...f, latitude: e.target.value }))} />
            </label>
            <label className="form-label">
              経度
              <input className="form-input" value={projForm.longitude} onChange={e => setProjForm(f => ({ ...f, longitude: e.target.value }))} />
            </label>
            <label className="form-label">
              パネルkW
              <input className="form-input" type="number" value={projForm.panel_kw} onChange={e => setProjForm(f => ({ ...f, panel_kw: e.target.value }))} />
            </label>
            <label className="form-label">
              パネル枚数
              <input className="form-input" type="number" value={projForm.panel_count} onChange={e => setProjForm(f => ({ ...f, panel_count: e.target.value }))} />
            </label>
            <label className="form-label">
              パネルメーカー
              <input className="form-input" value={projForm.panel_maker} onChange={e => setProjForm(f => ({ ...f, panel_maker: e.target.value }))} />
            </label>
            <label className="form-label">
              パネル型番
              <input className="form-input" value={projForm.panel_model} onChange={e => setProjForm(f => ({ ...f, panel_model: e.target.value }))} />
            </label>
            <label className="form-label">
              パワコンkW
              <input className="form-input" type="number" value={projForm.pcs_kw} onChange={e => setProjForm(f => ({ ...f, pcs_kw: e.target.value }))} />
            </label>
            <label className="form-label">
              パワコン台数
              <input className="form-input" type="number" value={projForm.pcs_count} onChange={e => setProjForm(f => ({ ...f, pcs_count: e.target.value }))} />
            </label>
            <label className="form-label">
              パワコンメーカー
              <input className="form-input" value={projForm.pcs_maker} onChange={e => setProjForm(f => ({ ...f, pcs_maker: e.target.value }))} />
            </label>
            <label className="form-label">
              パワコン型番
              <input className="form-input" value={projForm.pcs_model} onChange={e => setProjForm(f => ({ ...f, pcs_model: e.target.value }))} />
            </label>
            <label className="form-label">
              経産ID
              <input className="form-input" value={projForm.grid_id} onChange={e => setProjForm(f => ({ ...f, grid_id: e.target.value }))} />
            </label>
            <label className="form-label">
              経産認定日
              <input className="form-input" type="date" value={projForm.grid_certified_at} onChange={e => setProjForm(f => ({ ...f, grid_certified_at: e.target.value }))} />
            </label>
            <label className="form-label">
              FIT期間（年）
              <input className="form-input" type="number" value={projForm.fit_period} onChange={e => setProjForm(f => ({ ...f, fit_period: e.target.value }))} />
            </label>
            <label className="form-label">
              需給開始日
              <input className="form-input" type="date" value={projForm.power_supply_start_date} onChange={e => setProjForm(f => ({ ...f, power_supply_start_date: e.target.value }))} />
            </label>
            <label className="form-label">
              お客さま番号
              <input className="form-input" value={projForm.customer_number} onChange={e => setProjForm(f => ({ ...f, customer_number: e.target.value }))} />
            </label>
            <label className="form-label">
              発電地点特定番号
              <input className="form-input" value={projForm.generation_point_id} onChange={e => setProjForm(f => ({ ...f, generation_point_id: e.target.value }))} />
            </label>
            <label className="form-label">
              検針日
              <input className="form-input" value={projForm.meter_reading_day} onChange={e => setProjForm(f => ({ ...f, meter_reading_day: e.target.value }))} />
            </label>
            <label className="form-label">
              遠隔監視
              <input className="form-input" value={projForm.monitoring_system} onChange={e => setProjForm(f => ({ ...f, monitoring_system: e.target.value }))} />
            </label>
            <label className="form-label">
              監視ID
              <input className="form-input" value={projForm.monitoring_id} onChange={e => setProjForm(f => ({ ...f, monitoring_id: e.target.value }))} />
            </label>
            <label className="form-label">
              監視PW
              <input className="form-input" value={projForm.monitoring_pw} onChange={e => setProjForm(f => ({ ...f, monitoring_pw: e.target.value }))} />
            </label>
            <label className="form-label">
              4G対応
              <select className="form-input" value={projForm.has_4g} onChange={e => setProjForm(f => ({ ...f, has_4g: e.target.value }))}>
                <option value="">-</option>
                <option value="true">あり</option>
                <option value="false">なし</option>
              </select>
            </label>
            <label className="form-label">
              カギ番号
              <input className="form-input" value={projForm.key_number} onChange={e => setProjForm(f => ({ ...f, key_number: e.target.value }))} />
            </label>
            <label className="form-label">
              自治会
              <input className="form-input" value={projForm.local_association} onChange={e => setProjForm(f => ({ ...f, local_association: e.target.value }))} />
            </label>
            <label className="form-label">
              旧所有者
              <input className="form-input" value={projForm.old_owner} onChange={e => setProjForm(f => ({ ...f, old_owner: e.target.value }))} />
            </label>
            <label className="form-label">
              販売会社
              <input className="form-input" value={projForm.sales_company} onChange={e => setProjForm(f => ({ ...f, sales_company: e.target.value }))} />
            </label>
            <label className="form-label">
              紹介者
              <input className="form-input" value={projForm.referrer} onChange={e => setProjForm(f => ({ ...f, referrer: e.target.value }))} />
            </label>
            <label className="form-label">
              電力変更日
              <input className="form-input" type="date" value={projForm.power_change_date} onChange={e => setProjForm(f => ({ ...f, power_change_date: e.target.value }))} />
            </label>
            <label className="form-label">
              引渡日
              <input className="form-input" type="date" value={projForm.handover_date} onChange={e => setProjForm(f => ({ ...f, handover_date: e.target.value }))} />
            </label>
            <label className="form-label">
              販売価格（税込）
              <input className="form-input" type="number" value={projForm.sales_price} onChange={e => setProjForm(f => ({ ...f, sales_price: e.target.value }))} />
            </label>
            <label className="form-label">
              土地代
              <input className="form-input" type="number" value={projForm.land_cost} onChange={e => setProjForm(f => ({ ...f, land_cost: e.target.value }))} />
            </label>
            <label className="form-label">
              アムラス会員番号
              <input className="form-input" value={projForm.amuras_member_no} onChange={e => setProjForm(f => ({ ...f, amuras_member_no: e.target.value }))} />
            </label>
            <label className="form-label" style={{ gridColumn: '1/-1' }}>
              備考
              <textarea className="form-input" rows={4} value={projForm.notes} onChange={e => setProjForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </label>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sub" onClick={() => setProjModal(false)}>キャンセル</button>
            <button className="btn btn-main" onClick={handleSaveProject} disabled={saving}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        </Modal>
      )}
    </>
  )
}
