# Ageful Customer Management System

Supabaseを活用したサーバーレス構成の顧客管理システム。

## 概要

以前はExpressバックエンドを使用していましたが、現在は **Supabase直接接続** に移行しました。
これにより、バックエンドサーバーのデプロイ（Render等）は不要となり、フロントエンド（Vercel）のみで動作します。

## 構成

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Frontend only)

## ローカル開発環境のセットアップ

1. **依存関係のインストール**
   ```bash
   cd frontend
   npm install
   ```

2. **環境変数の設定**
   `frontend` ディレクトリに `.env` ファイルを作成済みです。
   ```properties
   VITE_SUPABASE_URL=https://iurnhgpuabzwjhstbxdy.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **開発サーバーの起動**
   ```bash
   cd frontend
   npm run dev
   ```
   http://localhost:5173 にアクセスしてください。

4. **データベースのセットアップ**
   まだ行っていなければ、SupabaseのSQLエディタで `database/supabase_schema.sql` の内容を実行してテーブルとRLSポリシーを作成してください。

## デプロイ方法 (Vercel)

1. Vercelで「Add New Project」
2. `frontend` ディレクトリをRoot Directoryに指定
3. Environment Variablesを設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## ディレクトリ構成
- `frontend/`: メインのアプリケーションコード
- `backend/`: (旧) Expressサーバー。現在は参照用。使用しません。
- `database/`: SQLスキーマファイル
