# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Cloudflare Workers上で動作するモノレポ認証アプリケーション。React Router v7（フロントエンド）とHono（バックエンド）を使用。

## 技術スタック

- **モノレポ**: Turborepo
- **フロントエンド**: React Router v7 on Cloudflare Workers  
- **バックエンド**: Hono + Hono RPC on Cloudflare Workers
- **データベース**: PostgreSQL (Neon/Supabase) via Hyperdrive
- **ORM**: Drizzle ORM
- **バックグラウンドジョブ**: Trigger.dev
- **セッション管理**: Workers KV
- **ファイルストレージ**: R2
- **テスト**: Vitest
- **Linter/Formatter**: Biome
- **パッケージマネージャー**: npm

## ディレクトリ構造

```
apps/
  frontend/         # React Router v7 (Workers)
    ├── app/        # React Routerアプリ
    ├── public/     # 静的ファイル
    └── worker.ts   # Workersエントリー
  backend/          # Hono API (Workers)
    ├── src/        # APIルート
    └── index.ts    # Workersエントリー
  jobs/             # Trigger.dev ジョブ
packages/
  db/              # Drizzle schema & migrations
  shared/          # 共有型定義、Zodスキーマ
```

## 開発コマンド

```bash
# 環境起動（Docker: PostgreSQL, Redis）
docker-compose up -d

# 開発サーバー起動（全サービス並列起動）
npm run dev

# データベース操作
npm run db:migrate    # マイグレーション実行
npm run db:seed       # 開発用データ投入

# テスト実行
npm run test         # Vitest
npm run test:e2e     # Playwright

# 品質チェック
npm run lint         # Biome
npm run typecheck    # TypeScript
npm run build        # ビルド

# デプロイ
wrangler deploy --env preview-{PR番号}   # プレビュー
wrangler deploy --env staging             # ステージング
wrangler deploy --env production          # 本番
```

## アーキテクチャ概要

### 認証・認可システム

- **JWT認証**: HTTPOnly Cookie + Secure + SameSite
- **トークン**: Access Token (15分) + Refresh Token (7日、KV保存)
- **パスワード**: Argon2でハッシュ化
- **ロール**: admin, editor, viewer, guest
- **権限**: リソース×アクション単位（例: `posts.create`）

### Workers間通信

本番環境ではService Bindingsを使用した高速内部通信。開発環境ではHTTP通信。

```typescript
// frontend/app/lib/api.ts
export function createApiClient(env: Env) {
  if (env.API) {
    // Service Binding (本番)
    return hc<AppType>('/', {
      fetch: (input, init) => env.API.fetch(input, init)
    })
  }
  // HTTP (開発)
  return hc<AppType>(env.API_URL || 'http://localhost:8787')
}
```

### Hono RPC型共有

バックエンドのAPI型定義が自動的にフロントエンドで利用可能。

```typescript
// backend/src/routes/user.ts
export type UserRoute = typeof userRoute

// frontend側で型安全にAPIを呼び出し
import type { AppType } from '@repo/backend'
```

## 開発時の注意事項

1. **ブランチ戦略**: feature/* → develop → main
2. **コミット**: 論理的に分離（feat, fix, refactor等）
3. **型安全性**: TypeScript strict modeを維持
4. **Service Bindings**: 開発時はHTTP、本番はBindings
5. **環境変数**: Workers Secretsで管理
6. **セッション**: KVストアに保存（Redisは開発環境のみ）

## パフォーマンス目標

- TTFB: 50ms以内（エッジ）
- API応答: 10ms以内（Service Binding）
- SSR: 100ms以内
- 可用性: 99.9%