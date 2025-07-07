# モノレポ認証アプリケーション

Cloudflare Workers上で動作する、モダンな認証システムを備えたフルスタックモノレポアプリケーション。

## 🚀 特徴

- **エッジファースト**: Cloudflare Workersで高速レスポンス
- **型安全**: Hono RPCによるエンドツーエンドの型共有
- **モノレポ**: Turborepoによる効率的な開発体験
- **セキュア**: JWT認証、CSRF対策、Rate Limiting実装
- **スケーラブル**: Service Bindingsによる高速内部通信
- **バックグラウンド処理**: Trigger.devによる非同期タスク管理
- **AIタスク管理**: Taskmasterによるプロジェクトタスクの自動管理

## 📋 技術スタック

### コア技術
- **モノレポ管理**: [Turborepo](https://turbo.build/)
- **フロントエンド**: [React Router v7](https://reactrouter.com/) on Cloudflare Workers
- **バックエンド**: [Hono](https://hono.dev/) + Hono RPC on Cloudflare Workers
- **データベース**: PostgreSQL ([Neon](https://neon.tech/)/[Supabase](https://supabase.com/)) via Hyperdrive
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)

### 開発ツール
- **パッケージマネージャー**: npm workspaces
- **テスト**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **Linter/Formatter**: [Biome](https://biomejs.dev/)
- **バックグラウンドジョブ**: [Trigger.dev](https://trigger.dev/)
- **AIタスク管理**: Taskmaster（プロジェクトタスクの自動追跡・管理）

### Cloudflareサービス
- **Workers KV**: セッション管理、Rate Limiting
- **R2**: ファイルストレージ
- **Service Bindings**: Workers間通信
- **Hyperdrive**: PostgreSQL接続プール

## 🏗️ プロジェクト構造

```
.
├── apps/
│   ├── frontend/         # React Router v7 アプリケーション
│   │   ├── app/          # アプリケーションコード
│   │   ├── public/       # 静的ファイル
│   │   └── worker.ts     # Workers エントリーポイント
│   ├── backend/          # Hono API サーバー
│   │   ├── src/          # APIルート
│   │   └── index.ts      # Workers エントリーポイント
│   └── jobs/             # Trigger.dev バックグラウンドジョブ
├── packages/
│   ├── db/               # Drizzle スキーマ & マイグレーション
│   └── shared/           # 共有型定義、Zodスキーマ
├── .taskmaster/          # AIタスク管理システム
│   ├── config.json       # AI設定
│   ├── tasks/            # タスク定義
│   ├── docs/             # ドキュメント
│   └── reports/          # レポート
├── docker-compose.yml    # 開発環境（PostgreSQL, Redis）
├── turbo.json            # Turborepo設定
├── biome.json            # Biome設定
└── package.json          # ルートパッケージ設定
```

## 🚀 クイックスタート

### 必要な環境
- Node.js 20+
- Docker & Docker Compose
- Cloudflare アカウント（デプロイ時）

### セットアップ

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd monorepo-auth-app
```

2. **依存関係のインストール**
```bash
npm install
```

3. **開発環境の起動**
```bash
# Docker環境起動（PostgreSQL, Redis）
docker-compose up -d

# 開発サーバー起動（全サービス並列起動）
npm run dev
```

4. **アクセス**
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8787

## 📝 開発コマンド

### 基本コマンド（全パッケージ一斉実行）
```bash
npm run dev          # 開発サーバー起動（全サービス並列）
npm run build        # プロダクションビルド（全パッケージ）
npm run test         # テスト実行（全パッケージ）
npm run lint         # Linter実行（全パッケージ）
npm run typecheck    # 型チェック（全パッケージ）
npm run clean        # ビルド成果物クリーン
```

### Turborepoによる高度なコマンド実行

#### 個別パッケージ実行
```bash
# 特定のパッケージのみ実行
npx turbo build --filter=frontend
npx turbo test --filter=backend
npx turbo lint --filter=@repo/db
npx turbo typecheck --filter=@repo/shared
npx turbo dev --filter=jobs

# 複数パッケージ指定
npx turbo build --filter=backend --filter=@repo/shared
npx turbo lint --filter=frontend --filter=backend
```

#### パッケージ依存関係の活用
```bash
# 特定パッケージとその依存関係
npx turbo build --filter=frontend...

# 特定パッケージに依存するパッケージ
npx turbo test --filter=...@repo/shared

# 変更されたファイルに関連するパッケージのみ
npx turbo lint --filter=[HEAD^1]
```

#### キャッシュとパフォーマンス
```bash
# キャッシュ状態を確認
npx turbo build --dry-run

# 並列実行（最大パフォーマンス）
npx turbo dev --parallel

# キャッシュクリア
npx turbo clean
```

### パッケージ構成
- **apps/frontend**: React Router v7フロントエンド
- **apps/backend**: Hono APIバックエンド
- **apps/jobs**: Trigger.devバックグラウンドジョブ
- **packages/db**: Drizzle ORM データベース層（`@repo/db`）
- **packages/shared**: 共有型定義とZodスキーマ（`@repo/shared`）

### データベース操作
```bash
npm run db:migrate   # マイグレーション実行
npm run db:seed      # 開発用データ投入
npm run db:studio    # Drizzle Studio起動
```

### デプロイ
```bash
# プレビュー環境（PR毎）
wrangler deploy --env preview-{PR番号}

# ステージング環境
wrangler deploy --env staging

# 本番環境
wrangler deploy --env production
```

### バックグラウンドジョブ
```bash
npm run jobs:dev     # Trigger.dev開発サーバー
npm run jobs:deploy  # ジョブのデプロイ
```

## 🔐 認証・認可

### 認証方式
- **JWT認証**: HTTPOnly Cookie + Secure + SameSite
- **トークン管理**:
  - Access Token: 15分
  - Refresh Token: 7日（KV保存）
- **セキュリティ**:
  - パスワード: Argon2ハッシュ化
  - CSRF対策: Double Submit Cookie
  - Rate Limiting: 5回失敗で15分ロック

### ロールベースアクセス制御
- `admin`: 全権限
- `editor`: 編集権限
- `viewer`: 閲覧権限
- `guest`: 限定アクセス

## 🏗️ アーキテクチャ

### Workers間通信
本番環境ではService Bindingsによる高速内部通信、開発環境ではHTTP通信を使用。

```typescript
// Service Binding設定例
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

### 型安全なAPI
Hono RPCにより、バックエンドの型定義が自動的にフロントエンドで利用可能。

```typescript
// バックエンド
export type UserRoute = typeof userRoute

// フロントエンド
import type { AppType } from '@repo/backend'
```

### バックグラウンドタスク管理
Trigger.devを使用した非同期処理とタスク管理システム。

```typescript
// LLM処理などの重い処理を非同期で実行
export const llmProcessing = client.defineJob({
  id: 'llm-processing',
  name: 'LLM Processing',
  version: '1.0.0',
  trigger: eventTrigger({
    name: 'llm.process'
  }),
  run: async (payload, io) => {
    // 長時間処理の実行
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

#### 主な用途
- **メール送信**: ユーザー登録確認、パスワードリセット
- **データ処理**: 大量データの集計、レポート生成
- **外部API連携**: LLM処理、画像処理、動画変換
- **定期タスク**: データバックアップ、クリーンアップ処理
- **Webhook処理**: 外部サービスからのWebhook受信と処理

## 🤖 AIタスク管理システム（Taskmaster）

プロジェクトのタスク管理をAIが自動的に追跡・管理するシステム。

### 主な機能
- **タスク自動生成**: プロジェクト要件からタスクを自動生成
- **依存関係管理**: タスク間の依存関係を自動解析
- **進捗追跡**: 各タスクの状態をリアルタイムで管理
- **優先度設定**: high/medium/lowの優先度でタスクを分類
- **サブタスク管理**: 大きなタスクを細かいサブタスクに分割

### 設定ファイル構造
```
.taskmaster/
├── config.json      # AI設定（モデル、パラメータ）
├── tasks/           # タスク定義JSON
│   └── tasks.json   # メインタスクリスト
├── docs/            # 生成されたドキュメント
├── reports/         # 進捗レポート
└── state.json       # 現在の状態
```

### 利用方法
```bash
# タスクリスト確認
taskmaster list

# タスク進捗更新
taskmaster update --task-id 1 --status completed

# レポート生成
taskmaster report --format markdown
```

## 📊 パフォーマンス目標

- **TTFB**: 50ms以内（エッジ）
- **API応答**: 10ms以内（Service Binding）
- **SSR**: 100ms以内
- **可用性**: 99.9%以上

## 🔄 CI/CD

### ブランチ戦略
- `main` → 本番環境
- `develop` → ステージング環境
- `feature/*` → プレビュー環境

### デプロイフロー
1. PR作成 → プレビュー環境自動作成
2. developマージ → ステージング自動デプロイ
3. mainマージ → 本番デプロイ（承認フロー付き）

## 🤝 コントリビューション

1. Featureブランチを作成 (`git checkout -b feature/amazing-feature`)
2. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
3. ブランチをプッシュ (`git push origin feature/amazing-feature`)
4. Pull Requestを作成

### コミットメッセージ規約
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` その他

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

問題や質問がある場合は、[Issues](https://github.com/your-org/your-repo/issues)でお知らせください。