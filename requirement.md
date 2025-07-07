# モノレポ認証アプリケーション要件書

## 1. 基本構成

### 技術スタック
- **モノレポツール**: Turborepo
- **フロントエンド**: React Router v7 on Cloudflare Workers
- **バックエンド**: Hono + Hono RPC on Cloudflare Workers
- **バックグラウンドジョブ**: Trigger.dev
- **パッケージマネージャー**: npm
- **テスト**: Vitest
- **Linter/Formatter**: Biome

### ディレクトリ構造
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
docker-compose.yml # 開発環境
turbo.json
biome.json
package.json
```

## 2. インフラ構成

### Cloudflareサービス
- **ランタイム**: Cloudflare Workers（FE/BE両方）
- **データベース**: PostgreSQL (Neon/Supabase) via Hyperdrive
- **KVストア**: Workers KV（セッション管理）
- **ファイルストレージ**: R2
- **通信**: Service Bindings（本番）/ HTTP（開発）

### 開発環境
- **DB**: Docker PostgreSQL
- **Redis**: Docker Redis（開発時のみ）
- **ローカルサーバー**: 
  - Frontend: Vite (port 3000)
  - Backend: Wrangler (port 8787)

## 3. 認証・認可

### 認証方式
- **方式**: JWT (HTTPOnly Cookie + Secure + SameSite)
- **Access Token**: 15分（メモリ保持）
- **Refresh Token**: 7日（KV保存）
- **CSRF対策**: Double Submit Cookie
- **パスワード**: Argon2でハッシュ化
- **ログイン試行制限**: 5回失敗で15分ロック（KV管理）

### 認可
- **ロール**: admin, editor, viewer, guest
- **権限管理**: リソース×アクション単位
  - 例: `posts.create`, `users.delete`
- **ミドルウェア**: Honoミドルウェアでチェック
- **フロントエンド**: ルートローダーで事前検証

## 4. API設計

### Hono RPC
```typescript
// backend/src/routes/user.ts
const userRoute = new Hono()
  .get('/:id', async (c) => {
    const user = await getUser(c.req.param('id'))
    return c.json(user)
  })
  .post('/', zValidator('json', createUserSchema), async (c) => {
    const data = c.req.valid('json')
    const user = await createUser(data)
    return c.json(user)
  })

export type UserRoute = typeof userRoute
```

### フロントエンド連携
```typescript
// frontend/app/lib/api.ts
import { hc } from 'hono/client'
import type { AppType } from '@repo/backend'

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

## 5. Workers設定

### Frontend (wrangler.toml)
```toml
name = "frontend"
main = "worker.ts"
compatibility_date = "2024-01-01"

[[services]]
binding = "API"
service = "backend"
environment = "production"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "frontend-assets"

[vars]
API_URL = "http://localhost:8787"
```

### Backend (wrangler.toml)
```toml
name = "backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SESSION"
id = "xxx"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "xxx"

[[hyperdrive]]
binding = "DB"
id = "xxx"

[[r2_buckets]]
binding = "FILES"
bucket_name = "uploads"

[vars]
TRIGGER_DEV_API_URL = "https://api.trigger.dev"
```

## 6. データベース設計

### Drizzle ORM設定
```typescript
// packages/db/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'viewer', 'guest'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  refreshToken: text('refresh_token').unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})
```

## 7. バックグラウンドジョブ

### Trigger.dev設定
```typescript
// apps/jobs/src/index.ts
export const llmProcessing = client.defineJob({
  id: 'llm-processing',
  name: 'LLM Processing',
  version: '1.0.0',
  trigger: eventTrigger({
    name: 'llm.process'
  }),
  run: async (payload, io) => {
    // 長時間処理
    const result = await io.runTask('generate', async () => {
      return await openai.chat.completions.create({
        messages: payload.messages,
        model: 'gpt-4'
      })
    })
    
    // 結果をKVに保存
    await io.runTask('save-result', async () => {
      await env.KV.put(`result:${payload.jobId}`, JSON.stringify(result))
    })
    
    return { jobId: payload.jobId, status: 'completed' }
  }
})
```

## 8. キャッシュ戦略

### フロントエンド
- SSR/SSG with React Router
- 自動revalidation via actions
- SWR/React Query（リアルタイムデータのみ）

### バックエンド
- CDNヘッダー（静的コンテンツ）
- KV（重い集計処理のみ）
- Service Bindings（キャッシュなし）

## 9. セキュリティ

### 標準対策
- **DDoS対策**: Cloudflare標準機能
- **WAF**: Cloudflare WAF Rules
- **Bot対策**: Turnstile
- **Rate Limiting**: KVベース実装

### アプリケーション
- **入力検証**: Zodによる厳密な型チェック
- **セキュリティヘッダー**: Honoミドルウェア
- **秘密情報**: Workers Secrets
- **監査ログ**: R2に保存

## 10. CI/CD

### ブランチ戦略
- `main` → production
- `develop` → staging
- `feature/*` → preview

### GitHub Actions
1. **PR Check**: Lint, Test, Build, Preview Deploy
2. **Staging Deploy**: 自動デプロイ + E2E
3. **Production Deploy**: 手動承認 + Blue-Green

### デプロイフロー
```bash
# Preview (PR)
wrangler deploy --env preview-{PR番号}

# Staging
wrangler deploy --env staging

# Production (Blue-Green)
wrangler deploy --env production-blue
# ヘルスチェック後切り替え
wrangler deploy --env production
```

## 11. 監視・運用

### モニタリング
- **APM**: Cloudflare Analytics
- **エラー追跡**: Sentry
- **ログ**: Cloudflare Logpush → S3/BigQuery
- **アラート**: PagerDuty/Slack

### パフォーマンス目標
- **TTFB**: 50ms以内（エッジ）
- **API応答**: 10ms以内（Service Binding）
- **SSR**: 100ms以内
- **可用性**: 99.9%

## 12. CI/CD・開発フロー

### 開発効率化
1. **モノレポによる統合管理**
   - 単一リポジトリで全コンポーネント管理
   - 型定義の自動共有（Hono RPC）
   - 依存関係の一元管理
   - 共通設定の統一（Biome、TypeScript）

2. **インテリジェントなビルドシステム**
   - Turborepoによる変更影響範囲の自動検出
   - 増分ビルド・リモートキャッシュ活用
   - 不要なビルド・デプロイの自動スキップ
   - 並列実行による高速化

3. **環境別デプロイ自動化**
   - PR: プレビュー環境自動作成・破棄
   - develop: ステージング自動デプロイ
   - main: 本番デプロイ（承認フロー付き）

### デプロイインテリジェンス
- **変更検知と戦略決定**
  - フロントエンドのみ → フロントエンドデプロイ
  - バックエンドのみ → バックエンドデプロイ  
  - 共有パッケージ → 影響範囲を解析し必要箇所デプロイ
  - DBスキーマ → マイグレーション後、順次デプロイ

- **安全なデプロイプロセス**
  - データベース変更時の自動バックアップ
  - Blue-Greenデプロイによる無停止更新
  - ヘルスチェック自動実行
  - 異常検知時の自動ロールバック

- **Service Bindingsの活用**
  - Workers間の内部高速通信
  - ダウンタイムゼロでの更新
  - 本番環境での安定性向上

### ローカル開発環境
```bash
# 環境起動（Docker: PostgreSQL, Redis）
docker-compose up -d

# 開発サーバー起動
npm run dev  # Turborepoが全サービス並列起動

# データベース操作
npm run db:migrate    # マイグレーション実行
npm run db:seed       # 開発用データ投入
```

### 品質管理プロセス
1. **開発時**
   - リアルタイムの型チェック（TypeScript strict mode）
   - 自動フォーマット（Biome）
   - Git hooks（コミット時の品質チェック）

2. **PR作成時**
   - 自動テスト実行（Vitest）
   - カバレッジレポート
   - プレビュー環境での動作確認

3. **デプロイ時**
   - E2Eテスト（Playwright）
   - パフォーマンス計測
   - セキュリティスキャン

### 開発者体験の最適化
- ホットリロード対応（Vite、Wrangler）
- 統一されたスクリプト命令
- エラーの早期発見（型システム）
- 高速なフィードバックループ