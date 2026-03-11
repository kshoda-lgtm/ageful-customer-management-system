import { useState } from 'react'
import type { BillingRow } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { updateAnnualRecordStatus } from '../lib/actions'

type Props = {
  rows: BillingRow[]
  onReload: () => void
  onViewDetail: (projectId: number) => void
}

type Filter = 'all' | '未入金' | '請求済' | '入金済'

export function Billing({ rows, onReload, onViewDetail }: Props) {
  const [filter, setFilter] = useState<Filter>('未入金')
  const [search, setSearch] = useState('')

  const currentYear = new Date().getFullYear()

  const filtered = rows.filter(r => {
    if (filter !== 'all') {
      const status = r.currentYearRecord?.status ?? '未入金'
      if (status !== filter) return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.project_name.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q)
    )
  })

  const counts = {
    未入金: rows.filter(r => (r.currentYearRecord?.status ?? '未入金') === '未入金').length,
    請求済: rows.filter(r => r.currentYearRecord?.status === '請求済').length,
    入金済: rows.filter(r => r.currentYearRecord?.status === '入金済').length,
  }

  async function handleStatusChange(row: BillingRow, status: '未入金' | '請求済' | '入金済') {
    if (!row.currentYearRecord) return
    await updateAnnualRecordStatus(row.currentYearRecord.id, status)
    onReload()
  }

  return (
    <>
      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="案件名・顧客名で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {([
            { key: '未入金' as Filter, label: `未入金 (${counts.未入金})` },
            { key: '請求済' as Filter, label: `請求済 (${counts.請求済})` },
            { key: '入金済' as Filter, label: `入金済 (${counts.入金済})` },
            { key: 'all' as Filter, label: `すべて (${rows.length})` },
          ]).map(f => (
            <button
              key={f.key}
              className={`filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-meta">{currentYear}年度 — {filtered.length} 件</div>
        <table>
          <thead>
            <tr>
              <th>案件</th><th>顧客</th><th>請求額（税込）</th><th>請求日</th><th>入金日</th><th>状態</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="empty-cell">該当するデータがありません</td></tr>
            )}
            {filtered.map(r => {
              const status = r.currentYearRecord?.status ?? '未入金'
              return (
                <tr key={r.project_id} className="clickable-row" onClick={() => onViewDetail(r.project_id)}>
                  <td><strong>{r.project_name}</strong></td>
                  <td>{r.customer_name}</td>
                  <td className="amount">
                    {r.contract?.billing_amount_inc != null
                      ? `¥${r.contract.billing_amount_inc.toLocaleString()}`
                      : r.contract ? '-' : <span style={{ color: '#94a3b8', fontSize: 12 }}>契約なし</span>
                    }
                  </td>
                  <td>{r.currentYearRecord?.billing_date ?? '-'}</td>
                  <td>{r.currentYearRecord?.received_date ?? '-'}</td>
                  <td><StatusBadge status={status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    {r.currentYearRecord && (
                      <select
                        className="status-select"
                        value={status}
                        onChange={e => handleStatusChange(r, e.target.value as '未入金' | '請求済' | '入金済')}
                      >
                        <option value="未入金">未入金</option>
                        <option value="請求済">請求済</option>
                        <option value="入金済">入金済</option>
                      </select>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
