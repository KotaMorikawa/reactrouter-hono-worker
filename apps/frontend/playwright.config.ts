import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストファイルのパス
  testDir: './tests/e2e',
  
  // 全テストでグローバルセットアップを実行するかどうか
  fullyParallel: true,
  
  // CIでテストが失敗した場合の再実行回数
  retries: process.env.CI ? 2 : 0,
  
  // 並列実行するワーカー数
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['line']
  ],
  
  // 全テストで共通の設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:5173',
    
    // ブラウザコンテキスト設定
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Cloudflare Workersの開発環境に適した設定
    ignoreHTTPSErrors: true,
    
    // タイムアウト設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // テストプロジェクト（ブラウザ）設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // テスト出力ディレクトリ
  outputDir: 'test-results/',
  
  // テストタイムアウト
  timeout: 30 * 1000,
  
  // 期待値タイムアウト
  expect: {
    timeout: 5000,
  },
});