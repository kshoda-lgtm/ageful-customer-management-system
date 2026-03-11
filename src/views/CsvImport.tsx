import { useRef, useState } from 'react'
import type { CsvImportRow } from '../types'
import { bulkImportProjects } from '../lib/actions'

type Props = {
  onReload: () => void
}

// CSV テンプレートの列定義（順序が重要）
const CSV_COLUMNS: { key: keyof CsvImportRow; label: string; required?: boolean }[] = [
  { key: 'customer_name',           label: '顧客名',             required: true },
  { key: 'company_name',            label: '会社名' },
  { key: 'email',                   label: 'メール' },
  { key: 'phone',                   label: '電話番号' },
  { key: 'postal_code',             label: '顧客郵便番号' },
  { key: 'customer_address',        label: '顧客住所' },
  { key: 'project_name',            label: '案件名',             required: true },
  { key: 'project_number',          label: '案件番号' },
  { key: 'key_number',              label: 'カギNo' },
  { key: 'site_address',            label: '設置住所' },
  { key: 'handover_date',           label: '引渡日' },
  { key: 'power_change_date',       label: '電力変更日' },
  { key: 'grid_id',                 label: '系統ID' },
  { key: 'grid_certified_at',       label: '系統認定日' },
  { key: 'fit_period',              label: 'FIT期間_年' },
  { key: 'power_supply_start_date', label: '給電開始日' },
  { key: 'fit_end_date',            label: 'FIT満了日' },
  { key: 'generation_point_id',     label: '発電地点特定番号' },
  { key: 'customer_number',         label: 'お客さま番号' },
  { key: 'sales_company',           label: '販売会社' },
  { key: 'referrer',                label: '紹介者' },
  { key: 'sales_price',             label: '販売価格' },
  { key: 'reference_price',         label: '価格参照' },
  { key: 'land_cost',               label: '土地代' },
  { key: 'amuras_member_no',        label: 'アムラス会員番号' },
  { key: 'monitoring_system',       label: '遠隔監視システム' },
  { key: 'notes',                   label: '備考' },
  { key: 'panel_kw',                label: 'パネルkW' },
  { key: 'panel_count',             label: 'パネル枚数' },
  { key: 'panel_manufacturer',      label: 'パネルメーカー' },
  { key: 'panel_model',             label: 'パネル型番' },
  { key: 'pcs_kw',                  label: 'パワコンkW' },
  { key: 'pcs_count',               label: 'パワコン台数' },
  { key: 'pcs_manufacturer',        label: 'パワコンメーカー' },
  { key: 'pcs_model',               label: 'パワコン型番' },
  { key: 'latitude',                label: '緯度' },
  { key: 'longitude',               label: '経度' },
]

const LABEL_TO_KEY: Record<string, keyof CsvImportRow> = Object.fromEntries(
  CSV_COLUMNS.map(c => [c.label, c.key])
)

// ── レガシー形式（エイジフル既存CSV）用ユーティリティ ─────────────────────────

function isCorporateName(name: string): boolean {
  return /[㈱㈲]|株式|有限|合同|\(株\)|\(有\)|（株）|（有）/.test(name)
}

function cleanNumStr(v: string): string {
  // " 28,000,000 " → "28000000"
  return v.replace(/[,\s¥￥]/g, '').replace(/[^\d.-]/g, '')
}

function parseCoords(v: string): { lat: string; lng: string } {
  const m = v.match(/([\d.]+)\s*,\s*([\d.]+)/)
  return m ? { lat: m[1], lng: m[2] } : { lat: '', lng: '' }
}

function parsePanelCount(desc: string): string {
  // "255w・180枚" → "180"
  const m = desc.match(/(\d+)\s*枚/)
  return m ? m[1] : ''
}

function parsePcsCount(desc: string): string {
  // "10.0kw・5台" → "5"
  const m = desc.match(/(\d+)\s*台/)
  return m ? m[1] : ''
}

function parseFitNum(v: string): string {
  // "36円" → "36", "21年" → "21"
  return v.replace(/[^\d.]/g, '')
}

/** レガシー形式（2行ヘッダー）を検出する */
function detectLegacyFormat(text: string): boolean {
  const rows = parseCsvToRows(text.replace(/^\uFEFF/, ''))
  const firstRow = rows[0] ?? []
  return firstRow[0]?.trim() === '案件名'
}

/** 全体シート形式（エイジフル低圧一覧）を検出する */
function detectZentaiFormat(text: string): boolean {
  const rows = parseCsvToRows(text.replace(/^\uFEFF/, '')).slice(0, 30)
  for (const cols of rows) {
    const head = cols.map(c => c.trim())
    if (head[0]?.startsWith('顧客メイン')) return true
    // 列ヘッダー行: col0=案件No かつ col1=案件名 かつ col2=顧客名
    if (head[0] === '案件No' && head[1] === '案件名' && head[2] === '顧客名') return true
  }
  return false
}

/**
 * レガシー形式CSVパーサー
 * エイジフル既存データ（2行ヘッダー）に対応
 *
 * 列マッピング:
 *   0=案件名, 1=顧客名, 2=email, 3=電話, 4=顧客郵便番号, 5=顧客住所
 *   6=発電所名(省略可), 7=発電所郵便番号(無視), 8=都道府県, 9=市区町村以降
 *   10=座標, 11=パネルkW, 12=パネル説明(枚数パース), 13=パネルメーカー, 14=パネル型番
 *   15=パワコンkW, 16=パワコン説明(台数パース), 17=パワコンメーカー, 18=パワコン型番
 *   19=経産ID, 20=経産認定日, 21=FIT, 22=需給開始日, 23=お客さま番号, 24=受電地点番号
 *   25=遠隔監視, 31=販売会社, 32=紹介者, 34=引渡日
 *   36=販売価格, 37=価格備考, 38=土地代, 44=カギNo, 45=備考, 46=アプラス会員番号
 *   54-57=パネルkW/メーカー/パワコンkW/メーカー(col11が空の場合フォールバック)
 */
function parseLegacyCsv(text: string): { rows: CsvImportRow[]; errors: string[] } {
  const allRows = parseCsvToRows(text.replace(/^\uFEFF/, '')).filter(r => r.some(c => c.trim() !== ''))
  if (allRows.length < 3) return { rows: [], errors: ['データが不足しています（ヘッダー2行 + データ1行以上必要）'] }

  const errors: string[] = []
  const rows: CsvImportRow[] = []

  // 先頭2行はヘッダー（スキップ）
  for (let i = 2; i < allRows.length; i++) {
    const cols = allRows[i]

    const projectName = cols[0]?.trim() ?? ''
    const customerName = cols[1]?.trim() ?? ''

    // 座標パース
    const { lat, lng } = parseCoords(cols[10]?.trim() ?? '')

    // パネル/パワコンデータ（col11-18優先、空の場合はcol54-57フォールバック）
    let panelKw = cols[11]?.trim() ?? ''
    const panelDesc = cols[12]?.trim() ?? ''
    let panelMfr = cols[13]?.trim() ?? ''
    let panelModel = cols[14]?.trim() ?? ''
    let pcsKw = cols[15]?.trim() ?? ''
    const pcsDesc = cols[16]?.trim() ?? ''
    let pcsMfr = cols[17]?.trim() ?? ''
    const pcsModel = cols[18]?.trim() ?? ''

    // col11が空の場合、末尾パネル列（54〜57）を使う
    if (!panelKw && cols.length >= 55) {
      panelKw = cols[54]?.trim() ?? ''
      panelMfr = panelMfr || (cols[55]?.trim() ?? '')
      pcsKw = cols[56]?.trim() ?? ''
      pcsMfr = pcsMfr || (cols[57]?.trim() ?? '')
    }

    // 設置住所 = 都道府県 + 市区町村以降
    const prefecture = cols[8]?.trim() ?? ''
    const cityStreet = cols[9]?.trim() ?? ''
    const siteAddress = [prefecture, cityStreet].filter(Boolean).join('')

    const row: CsvImportRow = {
      customer_name: customerName,
      company_name: isCorporateName(customerName) ? customerName : '',
      email: cols[2]?.trim() ?? '',
      phone: cols[3]?.trim() ?? '',
      postal_code: cols[4]?.trim() ?? '',
      customer_address: cols[5]?.trim() ?? '',
      project_name: projectName,
      project_number: '',
      key_number: cols[44]?.trim() ?? '',
      site_address: siteAddress,
      grid_id: cols[19]?.trim() ?? '',
      grid_certified_at: cols[20]?.trim() ?? '',
      fit_period: parseFitNum(cols[21]?.trim() ?? ''),
      power_supply_start_date: cols[22]?.trim() ?? '',
      fit_end_date: '',
      generation_point_id: cols[24]?.trim() ?? '',
      customer_number: cols[23]?.trim() ?? '',
      handover_date: cols[34]?.trim() ?? '',
      sales_company: cols[31]?.trim() ?? '',
      referrer: cols[32]?.trim() ?? '',
      sales_price: cleanNumStr(cols[36]?.trim() ?? ''),
      reference_price: cleanNumStr(cols[37]?.trim() ?? ''),
      land_cost: cleanNumStr(cols[38]?.trim() ?? ''),
      amuras_member_no: cols[46]?.trim() ?? '',
      monitoring_system: cols[25]?.trim() ?? '',
      notes: cols[45]?.trim() ?? '',
      power_change_date: '',
      latitude: lat,
      longitude: lng,
      panel_kw: panelKw,
      panel_count: parsePanelCount(panelDesc),
      panel_manufacturer: panelMfr,
      panel_model: panelModel,
      pcs_kw: pcsKw,
      pcs_count: parsePcsCount(pcsDesc),
      pcs_manufacturer: pcsMfr,
      pcs_model: pcsModel,
    }

    rows.push(row)
  }

  return { rows, errors }
}

// ── 全体シート形式パーサー ────────────────────────────────────────────────────
//
// 列マッピング（行インデックス11以降がデータ）:
//   0=案件No, 1=案件名, 2=顧客名, 3=E-mail, 4=電話番号, 5=郵便番号(顧客), 6=住所(顧客)
//   7=発電所名, 8=郵便番号(発電所), 9=都道府県, 10=住所(市区町村以降), 11=座標
//   12=パネルkW, 13=パネル説明, 14=パネルメーカー, 15=パネル型番
//   16=PCS kW, 17=PCS説明, 18=PCSメーカー, 19=PCS型番
//   20=経産ID, 21=経産認定日, 22=FIT, 23=需給開始日, 24=お客さま番号
//   25=受電地点特定番号, 26=検針日, 27=遠隔監視, 28=ID, 29=PW, 30=4G対応
//   31=備考, 32=カギNo, 33=自治会, 34=旧所有者, 35=販売会社, 36=紹介者
//   37=電力変更日, 38=引渡日, 39=販売価格（税込）, 40=土地代
//   49=アプラス会員番号
//   53=請求方法, 55=請求金額（税別）, 56=請求金額（税込）
//   57=年間保守料（税別）, 58=年間保守料（税込）
//   70=保守開始日, 71=保守委託先, 72=委託料（税別）, 73=委託料（税込）, 74=委託開始日

function parseZentaiCsv(text: string): { rows: CsvImportRow[]; errors: string[] } {
  const allRows = parseCsvToRows(text.replace(/^\uFEFF/, ''))

  // 「案件No」「案件名」「顧客名」が並ぶ列ヘッダー行を探し、その次からデータ
  let headerRowIndex = -1
  for (let i = 0; i < Math.min(allRows.length, 30); i++) {
    const head = allRows[i].map(c => c.trim())
    if (head[0] === '案件No' && head[1] === '案件名' && head[2] === '顧客名') {
      headerRowIndex = i
      break
    }
    // 最初の5列に「案件No」か「案件名」か「顧客名」が含まれていればヘッダー行
    if (head.slice(0, 5).some(c => c === '案件No' || c === '案件名' || c === '顧客名')) {
      headerRowIndex = i
      break
    }
  }

  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 11
  const dataRows = allRows.slice(startIndex).filter(r => r.some(c => c.trim() !== ''))
  if (dataRows.length === 0) return { rows: [], errors: ['データ行がありません（ヘッダー行スキップ後）'] }

  const errors: string[] = []
  const rows: CsvImportRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i]

    const projectName = cols[1]?.trim() ?? ''
    const customerName = cols[2]?.trim() ?? ''

    // 座標パース
    const { lat, lng } = parseCoords(cols[11]?.trim() ?? '')

    // 発電所住所 = 都道府県 + 市区町村以降
    const prefecture = cols[9]?.trim() ?? ''
    const cityStreet = cols[10]?.trim() ?? ''
    const siteAddress = [prefecture, cityStreet].filter(Boolean).join('')

    const row: CsvImportRow = {
      customer_name: customerName,
      company_name: isCorporateName(customerName) ? customerName : '',
      email: cols[3]?.trim() ?? '',
      phone: cols[4]?.trim() ?? '',
      postal_code: cols[5]?.trim() ?? '',
      customer_address: cols[6]?.trim() ?? '',
      project_name: projectName,
      project_number: cols[0]?.trim() ?? '',
      plant_name: cols[7]?.trim() ?? '',
      key_number: cols[32]?.trim() ?? '',
      site_address: siteAddress,
      grid_id: cols[20]?.trim() ?? '',
      grid_certified_at: cols[21]?.trim() ?? '',
      fit_period: parseFitNum(cols[22]?.trim() ?? ''),
      power_supply_start_date: cols[23]?.trim() ?? '',
      fit_end_date: '',
      generation_point_id: cols[25]?.trim() ?? '',
      customer_number: cols[24]?.trim() ?? '',
      handover_date: cols[38]?.trim() ?? '',
      power_change_date: cols[37]?.trim() ?? '',
      sales_company: cols[35]?.trim() ?? '',
      referrer: cols[36]?.trim() ?? '',
      sales_price: cleanNumStr(cols[39]?.trim() ?? ''),
      reference_price: cleanNumStr(cols[41]?.trim() ?? ''),
      land_cost: cleanNumStr(cols[40]?.trim() ?? ''),
      amuras_member_no: cols[49]?.trim() ?? '',
      monitoring_system: cols[27]?.trim() ?? '',
      // col31=備考, col76=（案件の）備考 → 両方あれば改行で連結
      notes: [cols[31]?.trim(), cols[76]?.trim()].filter(Boolean).join('\n'),
      latitude: lat,
      longitude: lng,
      panel_kw: cols[12]?.trim() ?? '',
      panel_count: parsePanelCount(cols[13]?.trim() ?? ''),
      panel_manufacturer: cols[14]?.trim() ?? '',
      panel_model: cols[15]?.trim() ?? '',
      pcs_kw: cols[16]?.trim() ?? '',
      pcs_count: parsePcsCount(cols[17]?.trim() ?? ''),
      pcs_manufacturer: cols[18]?.trim() ?? '',
      pcs_model: cols[19]?.trim() ?? '',
      // 追加フィールド（案件詳細）
      site_postal_code: cols[8]?.trim() ?? '',
      meter_reading_day: cols[26]?.trim() ?? '',
      monitoring_id: cols[28]?.trim() ?? '',
      monitoring_pw: cols[29]?.trim() ?? '',
      has_4g_str: cols[30]?.trim() ?? '',
      local_association: cols[33]?.trim() ?? '',
      old_owner: cols[34]?.trim() ?? '',
      // 契約フィールド
      billing_method: cols[53]?.trim() ?? '',
      billing_due_day: cols[54]?.trim() ?? '',
      billing_amount_ex: cleanNumStr(cols[55]?.trim() ?? ''),
      billing_amount_inc: cleanNumStr(cols[56]?.trim() ?? ''),
      annual_maintenance_ex: cleanNumStr(cols[57]?.trim() ?? ''),
      annual_maintenance_inc: cleanNumStr(cols[58]?.trim() ?? ''),
      land_cost_monthly: cleanNumStr(cols[59]?.trim() ?? ''),
      insurance_fee: cleanNumStr(cols[60]?.trim() ?? ''),
      other_fee: cleanNumStr(cols[61]?.trim() ?? ''),
      // col63=契約備考, col75=保守の備考 → 両方あれば改行で連結
      contract_notes: [cols[63]?.trim(), cols[75]?.trim()].filter(Boolean).join('\n'),
      maintenance_start_date: cols[70]?.trim() ?? '',
      subcontractor: cols[71]?.trim() ?? '',
      subcontract_fee_ex: cleanNumStr(cols[72]?.trim() ?? ''),
      subcontract_fee_inc: cleanNumStr(cols[73]?.trim() ?? ''),
      subcontract_start_date: cols[74]?.trim() ?? '',
    }

    rows.push(row)
  }

  return { rows, errors }
}

// ── テンプレート形式パーサー ───────────────────────────────────────────────────

function parseCsv(text: string): { rows: CsvImportRow[]; errors: string[] } {
  const allRows = parseCsvToRows(text.replace(/^\uFEFF/, '')).filter(r => r.some(c => c.trim() !== ''))
  if (allRows.length < 2) return { rows: [], errors: ['データが空です（ヘッダー行 + 1行以上必要）'] }

  const headers = allRows[0].map(h => h.trim())
  const errors: string[] = []
  const rows: CsvImportRow[] = []

  for (let i = 1; i < allRows.length; i++) {
    const values = allRows[i]
    const obj: Partial<CsvImportRow> = {}

    headers.forEach((h, idx) => {
      const key = LABEL_TO_KEY[h]
      if (key) obj[key] = (values[idx] ?? '').trim()
    })

    const row = obj as CsvImportRow
    rows.push(row)
  }

  return { rows, errors }
}

/**
 * CSV テキスト全体を一括パースし、行×列の2D配列を返す。
 * Excel の「セル内改行」（Shift+Enter でクォート囲みになる）を正しく処理する。
 */
function parseCsvToRows(text: string): string[][] {
  const result: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(cur); cur = ''
    } else if (ch === '\r' && !inQuote) {
      if (text[i + 1] === '\n') i++ // \r\n → skip \r
      row.push(cur); cur = ''
      result.push(row); row = []
    } else if (ch === '\n' && !inQuote) {
      row.push(cur); cur = ''
      result.push(row); row = []
    } else {
      cur += ch
    }
  }

  // 末尾の行
  if (cur || row.length > 0) {
    row.push(cur)
    result.push(row)
  }

  return result
}

function downloadTemplate() {
  const header = CSV_COLUMNS.map(c => c.label).join(',')
  const example = CSV_COLUMNS.map(c => {
    if (c.key === 'customer_name') return '田中 太郎'
    if (c.key === 'project_name') return '○○市 太陽光案件'
    if (c.key === 'fit_period') return '20'
    if (c.key === 'handover_date') return '2024/04/01'
    if (c.key === 'fit_end_date') return '2044/04/01'
    if (c.key === 'sales_price') return '15000000'
    if (c.key === 'panel_kw') return '49.5'
    if (c.key === 'panel_count') return '132'
    if (c.key === 'pcs_kw') return '49.5'
    if (c.key === 'pcs_count') return '2'
    return ''
  }).join(',')

  // BOM付きUTF-8（Excelで文字化けしないよう）
  const bom = '\uFEFF'
  const csv = bom + header + '\n' + example + '\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ageful_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── エンコーディング自動検出（UTF-8 → Shift-JIS フォールバック）───────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = ev => {
      const buf = ev.target?.result as ArrayBuffer
      // UTF-8 BOM付きはそのまま
      const bytes = new Uint8Array(buf)
      if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        resolve(new TextDecoder('utf-8').decode(buf))
        return
      }
      // UTF-8 (fatal) で試みる
      try {
        resolve(new TextDecoder('utf-8', { fatal: true }).decode(buf))
      } catch {
        // Shift-JIS にフォールバック
        try {
          resolve(new TextDecoder('shift-jis').decode(buf))
        } catch (e) {
          reject(e)
        }
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

type ImportState = 'idle' | 'preview' | 'importing' | 'done'

type FormatType = 'template' | 'legacy' | 'zentai'

function parseAuto(text: string): { rows: CsvImportRow[]; errors: string[]; isLegacy: boolean; format: FormatType } {
  if (detectZentaiFormat(text)) {
    const result = parseZentaiCsv(text)
    return { ...result, isLegacy: false, format: 'zentai' }
  }
  const isLegacy = detectLegacyFormat(text)
  const result = isLegacy ? parseLegacyCsv(text) : parseCsv(text)
  return { ...result, isLegacy, format: isLegacy ? 'legacy' : 'template' }
}

export function CsvImport({ onReload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImportState>('idle')
  const [rows, setRows] = useState<CsvImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [csvFormat, setCsvFormat] = useState<FormatType>('template')

  function processFile(file: File) {
    readFileAsText(file).then(text => {
      const { rows: parsed, errors, format } = parseAuto(text)
      setRows(parsed)
      setParseErrors(errors)
      setCsvFormat(format)
      setState('preview')
    }).catch(err => {
      setParseErrors([`ファイルの読み込みに失敗しました: ${String(err)}`])
      setState('preview')
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  async function handleImport() {
    if (rows.length === 0) return
    setState('importing')
    const result = await bulkImportProjects(rows)
    setImportResult(result)
    setState('done')
    if (result.success > 0) onReload()
  }

  function reset() {
    setRows([])
    setParseErrors([])
    setImportResult(null)
    setCsvFormat('template')
    setState('idle')
  }

  return (
    <div>
      {/* テンプレートDL + ファイル選択 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-sub" onClick={downloadTemplate}>
            📥 CSVテンプレートをダウンロード
          </button>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            テンプレートに記入後、CSVファイルを選択してアップロードしてください。
          </span>
        </div>
      </div>

      {state === 'idle' && (
        <div
          className="card import-dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (!file) return
            processFile(file)
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>CSVファイルを選択</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>クリックまたはドラッグ＆ドロップ</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {state === 'preview' && (
        <>
          {parseErrors.length > 0 && (
            <div className="card" style={{ background: '#fff7ed', borderLeft: '4px solid #ea580c', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#ea580c', marginBottom: 4 }}>読み込み時の警告</div>
              {parseErrors.map((e, i) => <div key={i} style={{ fontSize: 13, color: '#c2410c' }}>{e}</div>)}
            </div>
          )}

          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <strong>{rows.length} 件</strong>をインポートします
                {parseErrors.length > 0 && <span style={{ color: '#ea580c', marginLeft: 8 }}>（{parseErrors.length}件スキップ）</span>}
                <span style={{
                  marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                  background: csvFormat === 'zentai' ? '#dcfce7' : csvFormat === 'legacy' ? '#fef3c7' : '#dbeafe',
                  color: csvFormat === 'zentai' ? '#166534' : csvFormat === 'legacy' ? '#92400e' : '#1e40af',
                }}>
                  {csvFormat === 'zentai' ? '全体シート形式' : csvFormat === 'legacy' ? '既存データ形式' : 'テンプレート形式'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sub" onClick={reset}>やり直す</button>
                <button className="btn btn-main" onClick={handleImport} disabled={rows.length === 0}>
                  {rows.length}件をインポート
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>顧客名</th>
                    <th>案件名</th>
                    <th>設置住所</th>
                    <th>{csvFormat === 'template' ? 'FIT満了日' : '需給開始日'}</th>
                    <th>販売価格</th>
                    <th>パネルkW</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{i + 1}</td>
                      <td>{row.customer_name}{row.company_name && <><br /><span style={{ fontSize: 11, color: '#64748b' }}>{row.company_name}</span></>}</td>
                      <td><strong>{row.project_name}</strong></td>
                      <td>{row.site_address || '-'}</td>
                      <td>{csvFormat === 'template' ? (row.fit_end_date || '-') : (row.power_supply_start_date || '-')}</td>
                      <td>{row.sales_price ? `¥${Number(row.sales_price.replace(/,/g, '')).toLocaleString()}` : '-'}</td>
                      <td>{row.panel_kw ? `${row.panel_kw} kW` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {state === 'importing' && (
        <div className="card loading-card">インポート中...</div>
      )}

      {state === 'done' && importResult && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {importResult.failed === 0 ? '✅' : '⚠️'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            インポート完了
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>成功: {importResult.success}件</span>
            {importResult.failed > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 16 }}>失敗: {importResult.failed}件</span>
            )}
          </div>
          {importResult.errors.length > 0 && (
            <div style={{ textAlign: 'left', background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              {importResult.errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: '#dc2626' }}>{e}</div>)}
            </div>
          )}
          <button className="btn btn-main" onClick={reset}>続けてインポートする</button>
        </div>
      )}

      {/* 列の説明 */}
      {state === 'idle' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>CSVの列一覧</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px 16px' }}>
            {CSV_COLUMNS.map(c => (
              <div key={c.key} style={{ fontSize: 13, color: c.required ? '#0f172a' : '#64748b' }}>
                {c.required && <span style={{ color: '#dc2626', marginRight: 4 }}>*</span>}
                {c.label}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>* 必須項目</div>
        </div>
      )}
    </div>
  )
}
