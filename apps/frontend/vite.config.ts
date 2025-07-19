/// <reference types="vitest" />
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
	const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

	return {
		plugins: [
			// React Routerプラグインはテスト環境では無効化
			!isTest && reactRouter(),
			tsconfigPaths(),
		].filter(Boolean),
		css: {
			postcss: "./postcss.config.js",
		},
		server: {
			port: 5173,
			host: true, // Allow external connections for development
		},
		// Configure for Cloudflare Workers
		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		},
		resolve: {
			alias: {
				"@": "/app",
				"~": "/app",
			},
			// Optimize for monorepo packages
			dedupe: ["react", "react-dom", "react-router"],
		},
		// Optimize build for Workers
		build: {
			target: "esnext",
			minify: true,
			rollupOptions: {
				external: (id) => {
					// Don't bundle Node.js built-ins
					return id.startsWith("node:");
				},
			},
		},
		// Workers-specific optimizations
		ssr: {
			target: "webworker",
			noExternal: ["@repo/shared", "@repo/db"],
		},
		optimizeDeps: {
			include: ["react", "react-dom", "react-router", "@repo/shared"],
			exclude: ["@repo/db"],
		},
		// Test configuration
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: ["./test-setup.ts"],
			include: ["app/**/*.test.{ts,tsx}"],
			exclude: ["node_modules", "build"],
		},
	};
});
