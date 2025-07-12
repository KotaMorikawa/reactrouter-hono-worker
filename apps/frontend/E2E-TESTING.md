# E2E Testing Guide

このドキュメントでは、Playwrightを使用したE2Eテストの実行方法と設定について説明します。

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- npm
- ブラウザ（Playwright会自動的にChromium、Firefox、Safariをインストール）

### 初期セットアップ

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール（初回のみ）
npx playwright install
```

## 📋 利用可能なテストコマンド

### 基本的なテスト実行

```bash
# すべてのE2Eテストを実行（ヘッドレスモード）
npm run test:e2e

# ブラウザUIを表示してテスト実行
npm run test:e2e:headed

# インタラクティブUIモードでテスト実行
npm run test:e2e:ui

# 特定のブラウザでのみテスト実行
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### 特定のテストファイル実行

```bash
# 特定のテストファイルのみ実行
npm run test:e2e -- tests/e2e/login.spec.ts

# 特定のテストスイートのみ実行
npm run test:e2e -- --grep "ログインフロー"

# 特定のテストのみ実行
npm run test:e2e -- --grep "正常なログインフローが完了する"
```

### デバッグ・開発用コマンド

```bash
# デバッガーモードで実行
npm run test:e2e -- --debug

# テスト結果レポートを表示
npx playwright show-report

# テスト結果をJSONで出力
npm run test:e2e -- --reporter=json
```

## 🧪 テストスイート概要

実装されているE2Eテストは以下の主要ユーザーフローをカバーしています：

### 1. ユーザー登録フロー (`register.spec.ts`)
- 正常な登録フロー
- バリデーションエラーのテスト
- 既に認証済みユーザーのリダイレクト
- フォームの操作性とアクセシビリティ

### 2. ログインフロー (`login.spec.ts`)
- 正常なログインフロー
- 間違った認証情報のエラーハンドリング
- バリデーションエラーのテスト
- エラーメッセージの自動非表示
- キーボード操作のサポート

### 3. 保護されたルートのアクセス制御 (`protected-routes.spec.ts`)
- 未認証ユーザーのリダイレクト
- 認証済みユーザーのアクセス許可
- セッション無効化後の動作
- 複数タブでの認証状態同期

### 4. ログアウトフロー (`logout.spec.ts`)
- デスクトップ・モバイル両方でのログアウト
- ログアウト後のナビゲーション更新
- 複数タブでの状態同期
- エラー時のローカル状態クリア

### 5. 未認証時のリダイレクト (`auth-redirects.spec.ts`)
- 公開ページへのアクセス許可
- 保護されたページからの自動リダイレクト
- URLパラメータやハッシュフラグメント付きページの処理
- 無効・期限切れトークンの処理

## 🛠 テスト設定

### ブラウザ設定

テストは以下のブラウザで実行されます：

- **Chromium** (デスクトップ)
- **Firefox** (デスクトップ)
- **WebKit/Safari** (デスクトップ)
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

### タイムアウト設定

- **テスト全体**: 30秒
- **期待値**: 5秒
- **アクション**: 10秒
- **ナビゲーション**: 30秒

### 開発サーバー

テスト実行時は自動的に開発サーバー（`npm run dev`）が起動されます。
ベースURL: `http://localhost:5173`

## 📁 テストファイル構造

```
tests/e2e/
├── utils/
│   └── test-helpers.ts      # 共通ヘルパー関数
├── auth-redirects.spec.ts   # 認証リダイレクトテスト
├── login.spec.ts           # ログインフローテスト
├── logout.spec.ts          # ログアウトフローテスト
├── protected-routes.spec.ts # 保護ルートテスト
└── register.spec.ts        # ユーザー登録テスト
```

## 🔧 テスト開発ガイドライン

### ヘルパー関数の使用

`test-helpers.ts`には以下の便利な関数が用意されています：

```typescript
// ユーザー認証関連
await loginUser(page, email, password);
await registerUser(page, email, name, password);
await logoutUser(page);

// 状態管理
await clearAuth(page);
const hasToken = await hasAuthToken(page);

// 待機処理
await waitForPageLoad(page);
await waitForErrorMessage(page, "エラーメッセージ");
```

### セレクタの統一

共通のセレクタは `selectors` オブジェクトで管理されています：

```typescript
// 使用例
await page.click(selectors.loginButton);
await page.fill(selectors.emailInput, email);
await expect(page.locator(selectors.dashboardTitle)).toBeVisible();
```

### テストデータ

テスト用のユーザーデータは `testUsers` オブジェクトで定義されています：

```typescript
const { email, password } = testUsers.validUser;
const { email, password } = testUsers.invalidUser;
```

## 🚨 トラブルシューティング

### よくある問題

1. **テストが失敗する**
   - 開発サーバーが正しく起動しているか確認
   - ブラウザが最新版かチェック
   - `npx playwright install` でブラウザを再インストール

2. **タイムアウトエラー**
   - ネットワーク接続を確認
   - 開発サーバーの起動を待機
   - テストの `timeout` 設定を調整

3. **セレクタが見つからない**
   - ページが完全に読み込まれているか確認
   - `waitForPageLoad()` の使用を検討
   - セレクタが正しいかDevToolsで確認

### デバッグ方法

1. **ブラウザUIでの確認**
   ```bash
   npm run test:e2e:headed
   ```

2. **ステップ実行**
   ```bash
   npm run test:e2e -- --debug
   ```

3. **スクリーンショット確認**
   失敗時のスクリーンショットは `test-results/` フォルダに保存されます

## 📊 テスト結果とレポート

### HTMLレポート

テスト実行後、HTMLレポートが生成されます：

```bash
npx playwright show-report
```

### CI/CD統合

```bash
# CIモードでの実行（リトライ付き）
npm run test:e2e -- --reporter=line

# JUnit XML形式での出力
npm run test:e2e -- --reporter=junit
```

## 🔄 継続的な改善

### 新しいテストの追加

1. 適切なテストファイルを選択（または新規作成）
2. `test-helpers.ts` の共通関数を活用
3. `selectors` オブジェクトに必要なセレクタを追加
4. 各ブラウザでの動作を確認

### パフォーマンス考慮事項

- テストの並列実行（CIでは1ワーカー、ローカルでは自動）
- `beforeEach` での認証状態クリアによる独立性確保
- 適切な待機処理による安定性向上

---

このE2Eテストスイートにより、React Router v7 + Cloudflare Workers環境での主要な認証フローが包括的にテストされます。