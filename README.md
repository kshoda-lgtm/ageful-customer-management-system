# Ageful Manager — 太陽光発電 顧客管理システム

太陽光発電所の顧客・案件情報を一元管理するWebアプリケーション。
スプレッドシートによる管理からWebアプリへ移行し、情報の検索・更新・共有を効率化します。

---

## 機能

- **ダッシュボード** — 案件数・顧客数・FIT終了予定のサマリー
- **案件管理** — 発電所情報、FIT情報、販売情報の登録・編集
- **顧客管理** — 個人・法人の顧客情報管理
- **保守管理** — 保守記録のトラッキングとステータス管理
- **請求管理** — 契約・請求・入金状況の管理
- **CSVインポート** — 既存スプレッドシートデータの一括取り込み（旧形式自動判別）

## 技術スタック

| 区分 | 技術 |
|---|---|
| フロントエンド | React 19 + TypeScript |
| ビルドツール | Vite 6 |
| バックエンド/DB | Supabase（PostgreSQL） |
| デプロイ | Vercel / 静的ホスティング |

## セットアップ

```bash
npm install
```

`.env` を作成してSupabaseの接続情報を設定：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> `.env` が未設定の場合はインメモリのモックストアで動作します（開発・確認用）。

## データベース

`database/schema.sql` をSupabaseのSQL Editorで実行してテーブルを作成してください。

## 開発

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## 仕様書

詳細な仕様は [SPEC.md](./SPEC.md) を参照してください。
