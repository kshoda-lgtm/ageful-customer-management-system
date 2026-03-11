import type { BillingDetail } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { updateAnnualRecordStatus } from '../lib/actions'

type Props = {
  detail: BillingDetail
  onBack: () => void
  onReload: () => void
  onViewProject: (projectId: number) => void
}

export function BillingDetailView({ detail, onBack, onReload, onViewProject }: Props) {
  const { project, customer, contract, annualRecords } = detail

  async function handleStatusChange(id: number, status: '未入金' | '請求済' | '入金済') {
    await updateAnnualRecordStatus(id, status)
    onReload()
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← 請求一覧に戻る</button>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>案件：</span>
        <button className="link-btn" onClick={() => onViewProject(project.id)}>
          {project.project_name}
        </button>
        <span style={{ marginLeft: 16, fontSize: 13, color: '#64748b' }}>
          顧客：{customer.company_name ?? customer.name}
        </span>
      </div>

      <div className="card">
        <h3 className="section-title">契約情報</h3>
        <div className="info-grid">
          <div className="info-field"><span>請求方法</span><b>{contract.billing_method ?? '-'}</b></div>
          <div className="info-field"><span>保守開始日</span><b>{contract.maintenance_start_date ?? '-'}</b></div>
          <div className="info-field"><span>年次保守料（税抜）</span><b>{contract.annual_maintenance_ex != null ? `¥${contract.annual_maintenance_ex.toLocaleString()}` : '-'}</b></div>
          <div className="info-field"><span>年次保守料（税込）</span><b>{contract.annual_maintenance_inc != null ? `¥${contract.annual_maintenance_inc.toLocaleString()}` : '-'}</b></div>
          <div className="info-field"><span>請求額（税抜）</span><b>{contract.billing_amount_ex != null ? `¥${contract.billing_amount_ex.toLocaleString()}` : '-'}</b></div>
          <div className="info-field"><span>請求額（税込）</span><b>{contract.billing_amount_inc != null ? `¥${contract.billing_amount_inc.toLocaleString()}` : '-'}</b></div>
          <div className="info-field"><span>委託先</span><b>{contract.subcontractor ?? '-'}</b></div>
          <div className="info-field"><span>委託料（税抜）</span><b>{contract.subcontract_fee_ex != null ? `¥${contract.subcontract_fee_ex.toLocaleString()}` : '-'}</b></div>
          {contract.notes && <div className="info-field" style={{ gridColumn: '1/-1' }}><span>備考</span><b>{contract.notes}</b></div>}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">年次記録</h3>
        <table>
          <thead>
            <tr>
              <th>年度</th><th>請求日</th><th>入金日</th>
              <th>保守記録</th><th>状態</th><th>変更</th>
            </tr>
          </thead>
          <tbody>
            {annualRecords.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">年次記録がありません</td></tr>
            )}
            {annualRecords.map(r => (
              <tr key={r.id}>
                <td><strong>{r.year}年</strong></td>
                <td>{r.billing_date ?? '-'}</td>
                <td>{r.received_date ?? '-'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.maintenance_record ?? '-'}
                </td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <select
                    className="status-select"
                    value={r.status}
                    onChange={e => handleStatusChange(r.id, e.target.value as '未入金' | '請求済' | '入金済')}
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
  )
}
