/**
 * 開発環境用のHonoサーバー起動ファイル
 * Docker環境でwranglerの代わりに使用
 */
import { serve } from '@hono/node-server';
import app from './index';

// 環境変数のモック設定
const mockEnv = {
  // Mock KV namespaces for development
  AUTH_KV: {
    get: async (key: string) => null,
    put: async (key: string, value: string) => undefined,
    delete: async (key: string) => undefined,
  },
  RATE_LIMIT_KV: {
    get: async (key: string) => null,
    put: async (key: string, value: string) => undefined,
    delete: async (key: string) => undefined,
  },
  
  // Environment variables (use Docker env vars if available)
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_database',
};

const port = 8787;

console.log(`🚀 Starting Hono development server on port ${port}`);

serve({
  fetch: (request, env, ctx) => app.fetch(request, mockEnv, ctx),
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});