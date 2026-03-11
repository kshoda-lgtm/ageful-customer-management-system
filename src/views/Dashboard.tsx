import type { DashboardStats, MaintenanceResponse, BillingRow } from '../types'
import { StatusBadge } from '../components/StatusBadge'

type Props = {
  stats: DashboardStats
  maintenanceList: MaintenanceResponse[]
  billingRows: BillingRow[]
  onNavigate: (view: string) => void
  onViewMaintenance: (id: number) => void
  onViewBilling: (projectId: number) => void
}

export function Dashboard({ stats, maintenanceList, billingRows, onNavigate, onViewMaintenance, onViewBilling }: Props) {
  const activeList = maintenanceList.filter(m => m.status === '対応中')
  const pendingBilling = billingRows.filter(r => r.currentYearRecord?.status !== '入金済')

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">顧客数</div>
          <div className="kpi-value">{stats.totalCustomers}</div>
          <button className="kpi-link" onClick={() => onNavigate('customers')}>一覧を見る →</button>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">案件数</div>
          <div className="kpi-value">{stats.totalProjects}</div>
          <button className="kpi-link" onClick={() => onNavigate('projects')}>一覧を見る →</button>
        </div>
        <div className="kpi-card kpi-card--warn">
          <div className="kpi-label">対応中の保守</div>
          <div className="kpi-value warn">{stats.activeMaintenanceCount}</div>
          <button className="kpi-link" onClick={() => onNavigate('maintenance-responses')}>確認する →</button>
        </div>
        <div className="kpi-card kpi-card--info">
          <div className="kpi-label">未入金（今年度）</div>
          <div className="kpi-value">{stats.pendingBillingCount}</div>
          <button className="kpi-link" onClick={() => onNavigate('billing')}>確認する →</button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-header-row">
            <h3 className="section-title" style={{ margin: 0 }}>対応中の保守</h3>
            <button className="kpi-link" style={{ fontSize: 12 }} onClick={() => onNavigate('maintenance-responses')}>すべて見る →</button>
          </div>
          <table>
            <thead>
              <tr><th>発電所</th><th>顧客</th><th>問合日</th><th>状況</th><th>状態</th></tr>
            </thead>
            <tbody>
              {activeList.length === 0 && (
                <tr><td colSpan={5} className="empty-cell">対応中の保守はありません</td></tr>
              )}
              {activeList.map(m => (
                <tr key={m.id} className="clickable-row" onClick={() => onViewMaintenance(m.id)}>
                  <td><strong>{m.project_name ?? '-'}</strong></td>
                  <td>{m.customer_name ?? '-'}</td>
                  <td>{m.inquiry_date ?? '-'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.situation ?? '-'}</td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header-row">
            <h3 className="section-title" style={{ margin: 0 }}>未入金（今年度）</h3>
            <button className="kpi-link" style={{ fontSize: 12 }} onClick={() => onNavigate('billing')}>すべて見る →</button>
          </div>
          <table>
            <thead>
              <tr><th>案件</th><th>顧客</th><th>請求金額（税込）</th><th>状態</th></tr>
            </thead>
            <tbody>
              {pendingBilling.length === 0 && (
                <tr><td colSpan={4} className="empty-cell">未入金の請求はありません</td></tr>
              )}
              {pendingBilling.slice(0, 8).map(r => (
                <tr key={r.project_id} className="clickable-row" onClick={() => onViewBilling(r.project_id)}>
                  <td><strong>{r.project_name}</strong></td>
                  <td>{r.customer_name}</td>
                  <td className="amount">
                    {r.contract?.billing_amount_inc != null
                      ? `¥${r.contract.billing_amount_inc.toLocaleString()}`
                      : '-'
                    }
                  </td>
                  <td><StatusBadge status={r.currentYearRecord?.status ?? '未入金'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
