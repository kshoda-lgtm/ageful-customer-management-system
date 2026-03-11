# エイジフル 顧客管理システム 仕様書

バージョン: 1.0.0
最終更新: 2026-03-11

---

## 1. システム概要

### 目的
太陽光発電所の顧客・案件・保守・請求を一元管理するWebアプリケーション。
現在Googleスプレッドシートで管理している以下3つのシートを完全移行する。

| 既存シート | 役割 |
|---|---|
| 全体.csv | 案件マスター（顧客・発電所・契約・監視情報） |
| 保守.csv | 年度別の請求・入金・定期保守記録 |
| メンテ対応.csv | 保守対応記録（問い合わせ〜完了トラッキング） |

### 利用者
一人社長（1名のみ）

### 基本方針
- 情報を複数の角度から参照できる（案件視点・顧客視点・保守視点・請求視点）
- 画面をまたいでデータが連動する（案件 ↔ 顧客 ↔ 保守対応 ↔ 請求）
- 保守対応記録・請求記録を「完了」としてクローズできる

---

## 2. 技術スタック

| 区分 | 技術 |
|---|---|
| フロントエンド | React 19 + TypeScript |
| ビルドツール | Vite 6 |
| バックエンド/DB | Supabase（PostgreSQL + Storage） |
| スタイル | Tailwind CSS |
| 認証 | なし（1人利用のためRLSで全操作許可） |
| デプロイ | Vercel |
| モックモード | `.env` 未設定時はインメモリモックで動作 |

---

## 3. データモデル

### ER図

```
customers（顧客）
  ├── attachments（PDF添付ファイル）
  └── projects（案件）1:N
        ├── contracts（契約・請求情報）1:1
        │     └── annual_records（年度別入金・保守記録）1:N
        ├── maintenance_responses（保守対応記録）1:N
        └── periodic_maintenance（定期保守記録）1:N
```

---

### customers（顧客）

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT NOT NULL | 顧客名（個人名） |
| company_name | TEXT | 法人名（法人の場合） |
| is_corporate | BOOLEAN | 法人フラグ |
| email | TEXT | |
| phone | TEXT | |
| postal_code | TEXT | |
| address | TEXT | |
| created_at | TIMESTAMPTZ | |

**法人判定:** 名前に「㈱」「株式」「有限」「合同」「(株)」「(有)」等を含む場合に法人として登録。

---

### attachments（PDF添付ファイル）

顧客に紐づく書類（契約書・保証書・施工図面・点検報告書など）。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| customer_id | FK → customers | |
| file_name | TEXT NOT NULL | 表示用ファイル名 |
| file_url | TEXT NOT NULL | Supabase Storage URL |
| file_type | TEXT | `pdf` / `image` / `other` |
| description | TEXT | 説明・メモ |
| uploaded_at | TIMESTAMPTZ | |

---

### projects（案件）

太陽光発電所1基 = 1案件。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| customer_id | FK → customers | |
| project_no | TEXT | 案件No（任意） |
| project_name | TEXT NOT NULL | 案件名・発電所名（例：稲葉第二、吉野） |
| site_postal_code | TEXT | 発電所郵便番号 |
| site_prefecture | TEXT | 都道府県 |
| site_address | TEXT | 市区町村以降の住所 |
| latitude | NUMERIC(10,7) | 緯度 |
| longitude | NUMERIC(10,7) | 経度 |
| panel_kw | NUMERIC | パネル出力（kW） |
| panel_count | INTEGER | パネル枚数 |
| panel_maker | TEXT | パネルメーカー |
| panel_model | TEXT | パネル型番 |
| pcs_kw | NUMERIC | パワコン出力（kW） |
| pcs_count | INTEGER | パワコン台数 |
| pcs_maker | TEXT | パワコンメーカー |
| pcs_model | TEXT | パワコン型番 |
| grid_id | TEXT | 経産省 系統ID |
| grid_certified_at | DATE | 経産認定日 |
| fit_period | INTEGER | FIT年数 |
| power_supply_start_date | DATE | 需給開始日 |
| customer_number | TEXT | お客さま番号 |
| generation_point_id | TEXT | 受電地点特定番号 |
| meter_reading_day | TEXT | 検針日 |
| monitoring_system | TEXT | 遠隔監視システム名 |
| monitoring_id | TEXT | 監視システムID |
| monitoring_user | TEXT | 監視システムユーザー名 |
| monitoring_pw | TEXT | 監視システムPW |
| has_4g | BOOLEAN | 4G対応フラグ |
| key_number | TEXT | 鍵No |
| local_association | TEXT | 自治会 |
| old_owner | TEXT | 旧所有者 |
| sales_company | TEXT | 販売会社 |
| referrer | TEXT | 紹介者 |
| handover_date | DATE | 引渡日 |
| sales_price | BIGINT | 販売価格（税込・円） |
| reference_price | BIGINT | 価格備考（税込・円） |
| land_cost | BIGINT | 土地代（円） |
| amuras_member_no | TEXT | アプラス会員番号 |
| notes | TEXT | 備考 |
| created_at | TIMESTAMPTZ | |

---

### contracts（契約・請求情報）

案件1つにつき1レコード。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| project_id | FK → projects UNIQUE | |
| billing_method | TEXT | 請求方法（`請求書` / `ROBOT`） |
| billing_due_day | TEXT | 請求予定日（例：`12月1日`） |
| billing_amount_ex | BIGINT | 請求額（税抜・円） |
| billing_amount_inc | BIGINT | 請求額（税込・円） |
| annual_maintenance_ex | BIGINT | 年間保守費（税抜・円） |
| annual_maintenance_inc | BIGINT | 年間保守費（税込・円） |
| land_cost_monthly | BIGINT | 地代（円） |
| insurance_fee | BIGINT | 保険料（円） |
| other_fee | BIGINT | その他費用（円） |
| transfer_account | BIGINT | 振替口座（税込・円） |
| subcontractor | TEXT | 委託先 |
| subcontract_fee_ex | BIGINT | 委託費（税抜・円） |
| subcontract_fee_inc | BIGINT | 委託費（税込・円） |
| subcontract_billing_day | TEXT | 委託毎月日 |
| subcontract_start_date | DATE | 委託開始日 |
| maintenance_start_date | DATE | 保守開始日 |
| notes | TEXT | 備考 |

---

### annual_records（年度別入金・保守記録）

保守.csvの「年度別」データ（2023/2024/2025/2026年ごとの入金日・請求日・保守記録メモ）。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| contract_id | FK → contracts | |
| year | INTEGER | 対象年度（例：2025） |
| billing_date | DATE | 請求日 |
| received_date | DATE | 入金日 |
| maintenance_record | TEXT | 保守記録メモ（例：「2025.09.08除草・報告書」） |
| escort_record | TEXT | 駆付記録 |
| status | TEXT | `未入金` / `請求済` / `入金済` |

---

### maintenance_responses（保守対応記録）

メンテ対応.csvのデータ。問い合わせ起点のトラブル・作業対応。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| response_no | TEXT | 管理番号（例：`25001`） |
| project_id | FK → projects | |
| status | TEXT | `対応中` / `完了` |
| inquiry_date | DATE | 問合日 |
| occurrence_date | DATE | 発生日 |
| target_area | TEXT | 対象箇所（例：パワコン、遠隔、除草） |
| situation | TEXT | 状況（フリーテキスト） |
| response_content | TEXT | 対応内容（フリーテキスト） |
| report | TEXT | 報告（フリーテキスト） |
| created_at | TIMESTAMPTZ | |

---

### periodic_maintenance（定期保守記録）

事後報告型。「やったので記録する」シンプルなログ。

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL PK | |
| project_id | FK → projects | |
| record_date | DATE NOT NULL | 実施日 |
| work_type | TEXT | 種別（例：点検、除草、巡回） |
| content | TEXT | 内容・メモ |
| created_at | TIMESTAMPTZ | |

---

## 4. 画面構成（10画面）

```
ダッシュボード
案件一覧 → 案件詳細
顧客一覧 → 顧客詳細
保守対応一覧 → 保守対応詳細
請求一覧 → 請求詳細
CSVインポート
```

---

### 画面①：ダッシュボード

**目的:** 毎日の業務開始時に全体状況をひと目で把握する。

**表示内容:**
- KPIカード（4つ）
  - 案件総数
  - 顧客総数
  - 対応中の保守対応件数（クリック → 保守対応一覧）
  - 今月入金予定件数（クリック → 請求一覧）
- 対応中の保守対応リスト（最新10件）
  - 案件名・問合日・対象箇所・経過日数
- 今月の請求予定リスト
  - 案件名・請求予定日・金額・ステータス

---

### 画面②：案件一覧

**目的:** 全発電所案件を検索・管理する。

**表示内容:**
- 案件一覧テーブル
  - 案件名、顧客名、FIT（年数・満了年）、委託先、保守開始日
  - FIT満了アラート（満了済：赤、1年以内：オレンジ）

**操作:**
- テキスト検索（案件名・顧客名）
- 委託先フィルター
- 行クリック → 案件詳細へ遷移
- 新規案件登録（モーダル）

---

### 画面③：案件詳細

**目的:** 1案件のすべての情報を確認・編集する。他の画面へのハブ。

**表示内容（タブ構成）:**

**基本情報タブ**
- 発電所名・住所・座標（地図リンク）
- パネル情報（kW・枚数・メーカー・型番）
- パワコン情報（kW・台数・メーカー・型番）
- 経産情報（系統ID・認定日・FIT・需給開始日）
- 監視情報（システム名・ID・PW・4G対応）
- 顧客情報（リンク付き → 顧客詳細へ）
- 販売情報（販売会社・紹介者・引渡日・価格）

**保守対応タブ**
- この案件の保守対応記録一覧
  - 管理No・問合日・対象箇所・ステータス
  - 行クリック → 保守対応詳細へ
  - 新規保守対応作成ボタン

**定期保守タブ**
- この案件の定期保守記録一覧
  - 実施日・種別・内容
  - 新規定期保守記録追加ボタン（実施日・種別・内容を入力）

**請求タブ**
- この案件の契約・請求情報（リンク付き → 請求詳細へ）
- 年度別入金状況サマリー

**操作:**
- 基本情報の編集（インライン or モーダル）
- 「戻る」→ 案件一覧

---

### 画面④：顧客一覧

**目的:** 全顧客を検索・管理する。

**表示内容:**
- 顧客一覧テーブル
  - 顧客名・電話・メール・保有案件数

**操作:**
- テキスト検索（顧客名・電話・メール）
- 行クリック → 顧客詳細へ遷移
- 新規顧客登録（モーダル）

---

### 画面⑤：顧客詳細

**目的:** 1顧客の全情報と添付書類を管理する。

**表示内容:**
- 顧客基本情報（名前・連絡先・住所）
- 保有案件一覧（クリック → 案件詳細へ）
  - 案件名・FIT・委託先・保守開始日
- PDF添付ファイル
  - ファイル名・説明・アップロード日
  - PDFプレビュー or ダウンロード
  - 複数ファイル管理可能

**操作:**
- 顧客情報の編集
- PDF添付ファイルのアップロード（ドラッグ&ドロップ対応）
- PDF削除

---

### 画面⑥：保守対応一覧

**目的:** すべての保守対応案件をステータス管理する。

**表示内容:**
- 保守対応一覧テーブル
  - 管理No・発電所名（案件リンク）・事業者名・問合日・発生日・対象箇所・ステータス

**操作:**
- ステータスフィルター（全件 / 対応中 / 完了）
- テキスト検索（発電所名・対象箇所）
- 行クリック → 保守対応詳細へ
- 新規保守対応作成（モーダル）
- ステータスをここから直接変更可（完了ボタン）

---

### 画面⑦：保守対応詳細

**目的:** 1件の保守対応の詳細確認・編集・完了クローズ。

**表示内容:**
- 管理No（例：25001）
- 発電所名（案件詳細へのリンク）・事業者名
- 問合日・発生日
- 対象箇所・状況・対応内容・報告
- ステータス（対応中 / 完了）

**操作:**
- 全フィールド編集
- 「完了にする」ボタン（確認ダイアログあり）
- 「戻る」→ 保守対応一覧

---

### 画面⑧：請求一覧

**目的:** 全案件の請求状況を一覧管理する。

**表示内容:**
- 請求一覧テーブル
  - 事業主・案件名・請求方法・請求予定日・年間保守費（税込）・委託先
  - 当年度の入金ステータス（未入金 / 請求済 / 入金済）

**操作:**
- ステータスフィルター
- テキスト検索（事業主・案件名）
- 行クリック → 請求詳細へ

---

### 画面⑨：請求詳細

**目的:** 1案件の請求情報と年度別の入金・保守記録を管理する。

**表示内容:**

**契約情報セクション**
- 請求方法・請求予定日
- 請求額（税抜/税込）・年間保守費（税抜/税込）
- 地代・保険料・その他費用・振替口座
- 委託先・委託費・委託開始日
- 保守開始日

**年度別記録セクション（タブまたは縦並び）**
- 年度（2023・2024・2025・2026・...）ごとに表示
- 各年度の：入金日・請求日・ステータス・保守記録メモ・駆付記録
- ステータス変更ボタン

**操作:**
- 契約情報の編集
- 年度別記録の追加・編集
- ステータスの変更（未入金 → 請求済 → 入金済）

---

### 画面⑩：CSVインポート

**目的:** 既存スプレッドシートデータを一括取り込む。

**対応フォーマット（自動判別）:**
1. **レガシー形式（全体.csv）** — 先頭行のcol0が「案件名」なら自動判別
2. **保守形式（保守.csv）** — 契約・年度別記録をインポート
3. **メンテ対応形式（メンテ対応.csv）** — 保守対応記録をインポート

**処理フロー:**
1. CSVファイルをアップロード（クリック or ドラッグ&ドロップ）
2. フォーマット自動判別 → プレビュー表示（件数・エラー一覧）
3. 「インポート実行」で確定
4. 顧客名寄せ（同名の顧客が存在すれば既存IDを使用）
5. 結果表示（成功件数・失敗件数・エラー詳細）

**全体.csvの列マッピング（列インデックスは0始まり）:**

| 列 | 内容 | マッピング先 |
|---|---|---|
| 0 | 案件名 | project_name |
| 1 | 顧客名 | customer.name |
| 2 | E-mail | customer.email |
| 3 | 電話番号 | customer.phone |
| 4 | 顧客郵便番号 | customer.postal_code |
| 5 | 顧客住所 | customer.address |
| 7 | 発電所郵便番号 | site_postal_code |
| 8 | 都道府県 | site_prefecture |
| 9 | 市区町村以降 | site_address |
| 10 | Google Map座標 | latitude / longitude |
| 11 | パネルkW | panel_kw |
| 12 | パネル説明（枚数パース） | panel_count |
| 13 | パネルメーカー | panel_maker |
| 14 | パネル型番 | panel_model |
| 15 | パワコンkW | pcs_kw |
| 16 | パワコン説明（台数パース） | pcs_count |
| 17 | パワコンメーカー | pcs_maker |
| 18 | パワコン型番 | pcs_model |
| 19 | 経産ID | grid_id |
| 20 | 経産認定日 | grid_certified_at |
| 21 | FIT | fit_period |
| 22 | 需給開始日 | power_supply_start_date |
| 23 | お客さま番号 | customer_number |
| 24 | 受電地点特定番号 | generation_point_id |
| 25 | 遠隔監視システム | monitoring_system |
| 31 | 販売会社 | sales_company |
| 32 | 紹介者 | referrer |
| 34 | 引渡日 | handover_date |
| 36 | 販売価格 | sales_price |
| 37 | 価格備考 | reference_price |
| 38 | 土地代 | land_cost |
| 44 | 鍵No | key_number |
| 45 | 備考 | notes |
| 46 | アプラス会員番号 | amuras_member_no |
| 54-57 | パネル/パワコン情報（col11空の場合フォールバック） | - |

---

## 5. 画面間の連動

| 起点画面 | 操作 | 遷移先 |
|---|---|---|
| ダッシュボード | 保守対応リスト行クリック | 保守対応詳細 |
| ダッシュボード | 請求リスト行クリック | 請求詳細 |
| 案件一覧 | 行クリック | 案件詳細 |
| 案件詳細 | 顧客名クリック | 顧客詳細 |
| 案件詳細（保守対応タブ） | 行クリック | 保守対応詳細 |
| 案件詳細（請求タブ） | リンククリック | 請求詳細 |
| 顧客一覧 | 行クリック | 顧客詳細 |
| 顧客詳細 | 案件行クリック | 案件詳細 |
| 保守対応一覧 | 行クリック | 保守対応詳細 |
| 保守対応詳細 | 発電所名クリック | 案件詳細 |
| 請求一覧 | 行クリック | 請求詳細 |
| 請求詳細 | 案件名クリック | 案件詳細 |

---

## 6. ディレクトリ構成

```
src/
├── App.tsx                    # ルート・ナビゲーション
├── main.tsx
├── types.ts                   # 全型定義
├── styles.css
├── views/
│   ├── Dashboard.tsx          # ①ダッシュボード
│   ├── Projects.tsx           # ②案件一覧
│   ├── ProjectDetail.tsx      # ③案件詳細
│   ├── Customers.tsx          # ④顧客一覧
│   ├── CustomerDetail.tsx     # ⑤顧客詳細
│   ├── MaintenanceResponses.tsx   # ⑥保守対応一覧
│   ├── MaintenanceResponseDetail.tsx  # ⑦保守対応詳細
│   ├── Billing.tsx            # ⑧請求一覧
│   ├── BillingDetail.tsx      # ⑨請求詳細
│   └── CsvImport.tsx          # ⑩CSVインポート
├── components/
│   ├── Modal.tsx
│   ├── Confirm.tsx
│   ├── StatusBadge.tsx
│   └── FileUpload.tsx         # PDF添付用
└── lib/
    ├── supabase.ts
    ├── data.ts                # データ取得
    ├── actions.ts             # データ更新
    └── mock-store.ts          # オフライン用モック
```

---

## 7. 今後の拡張候補

- 地図表示（座標データを使った発電所マップ）
- 保守報告書PDF出力
- FIT満了アラートメール通知
- スマホ対応（現地からの入力）
