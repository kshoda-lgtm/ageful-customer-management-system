# Ageful Customer Management System

エイジフル顧客管理システム - クライアント向け顧客管理ソリューション

## プロジェクト構成

```
ageful.customer-management-system/
├── frontend/          # React + Vite フロントエンド
├── backend/           # Node.js + Express バックエンド
├── database/          # PostgreSQL スキーマ・マイグレーション
└── README.md
```

## 技術スタック

- **フロントエンド**: React 18 + Vite + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL
- **認証**: JWT (JSON Web Token)

## セットアップ

### 必要条件

- Node.js 18+
- PostgreSQL 14+
- npm または yarn

### インストール

```bash
# バックエンドのセットアップ
cd backend
npm install

# フロントエンドのセットアップ
cd frontend
npm install
```

### 環境変数

`.env.example` を `.env` にコピーして、必要な環境変数を設定してください。

## 開発

```bash
# バックエンド起動
cd backend
npm run dev

# フロントエンド起動
cd frontend
npm run dev
```

## ライセンス

Proprietary - Ageful Inc.
