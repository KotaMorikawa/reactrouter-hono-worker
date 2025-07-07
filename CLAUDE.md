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

### 基本コマンド（全パッケージ一斉実行）
```bash
# 環境起動（Docker: PostgreSQL, Redis）
docker-compose up -d

# 開発サーバー起動（全サービス並列起動）
npm run dev

# 品質チェック
npm run lint         # Biome
npm run typecheck    # TypeScript
npm run build        # ビルド
npm run test         # Vitest

# データベース操作
npm run db:migrate    # マイグレーション実行
npm run db:seed       # 開発用データ投入

# テスト実行
npm run test:e2e     # Playwright

# デプロイ
wrangler deploy --env preview-{PR番号}   # プレビュー
wrangler deploy --env staging             # ステージング
wrangler deploy --env production          # 本番
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

## Claude Task Masterを使用した開発方法

このプロジェクトでは、Claude Task Master MCPツールを活用してAI駆動の体系的な開発を推進します。

### Claude Task Masterとは

Claude Task Masterは、自然言語でタスク管理を行うMCPサーバーで、PRD（製品要求仕様書）からタスクを生成し、依存関係を考慮した実装順序の提案、進捗追跡、最新のベストプラクティス調査などを支援します。

### 初期セットアップ

1. **プロジェクト初期化**
```bash
npx task-master-ai init
```

2. **PRDの作成**: `.taskmaster/docs/prd.txt`に製品要求仕様を記載

3. **Claude Codeでの利用**
```
私は今Claude Task Masterでプロジェクトを初期化しました。
.taskmaster/docs/prd.txtにPRDがあります。
これを解析して初期タスクを設定してください。
```

### タスク管理の基本コマンド

#### タスクの確認と選択
```
# 次に取り組むべきタスクを確認
次に取り組むべきタスクは何ですか？依存関係と優先度を考慮してください。

# 特定タスクの詳細確認
タスク4を実装したいです。何をする必要があるか、どうアプローチすべきか教えてください。
```

#### タスクの完了と進捗管理
```
# タスク完了の報告
タスク2で説明されている認証システムの実装が完了しました。
すべてのテストがパスしています。
完了として記録し、次に取り組むべきタスクを教えてください。
```

#### 調査とベストプラクティス
```
# 実装前の調査
タスク5（認証）を実装する前に、最新のJWTセキュリティ推奨事項を調査してください。

# 特定技術の調査
Node.jsアプリケーションでJWT認証を実装する最新のベストプラクティスを調査してください。
```

### タスクファイル構造

```
.taskmaster/
├── config.json          # AI設定とモデル選択
├── tasks/              
│   ├── tasks.json      # メインタスクデータベース
│   ├── task-1.md       # 個別タスク詳細
│   └── task-2.md
├── docs/              
│   └── prd.txt         # 製品要求仕様書
└── reports/           
    └── task-complexity-report.json  # 複雑度分析レポート
```

### タスクオブジェクトの構造

```json
{
  "id": "1.2",
  "title": "ユーザー認証の実装",
  "description": "JWT ベースの認証システムをセットアップ",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "bcryptでハッシュ化、JWTでトークン管理...",
  "testStrategy": "認証関数のユニットテスト、ログインフローの統合テスト",
  "subtasks": []
}
```

### 開発ワークフローの例

#### 1. PRDからタスク生成
```
PRDを解析して、実装タスクに分解してください。
依存関係と優先度も考慮してください。
```

#### 2. 次タスクの選択
```
次に取り組むべきタスクは何ですか？
現在の進捗と依存関係を考慮してください。
```

#### 3. タスク実装サポート
```
タスク3の実装を手伝ってください。
必要な手順とコード例を提供してください。
```

#### 4. 調査と最新情報
```
タスク15はAPI最適化に関わります。
現在の実装に対する最新のベストプラクティスを調査してください。
```

### 品質保証との統合

各タスク完了前に必ず実行:
- `npm run lint` - コード品質チェック
- `npm run typecheck` - 型安全性の確認
- `npm run test` - すべてのテストがパス
- `npm run build` - ビルド成功の確認

### 高度な使用法

#### サブタスクの管理
```
タスク2.3を、最新のセキュリティ調査結果で更新してください。
```

#### 複雑度レポートの確認
```
タスクの複雑度レポートを、読みやすい形式で表示してください。
```

#### コンテキストを含む調査
```
タスク15（API最適化）に取り組んでいます。
src/api.jsを考慮して、現在のベストプラクティスを調査してください。
```

### 注意事項

- Claude Task Masterは自然言語でのやり取りを前提としています
- タスクIDは階層構造（例: 1.2.3）で管理されます
- 依存関係は自動的に考慮され、適切な実装順序が提案されます
- すべてのタスクはmarkdown形式で詳細が記録されます