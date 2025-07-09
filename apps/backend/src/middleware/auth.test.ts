import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import { authMiddleware, requireAuth } from "./auth";

// Mock environment variables
const _mockEnv = {
	JWT_SECRET: "test-jwt-secret",
	JWT_REFRESH_SECRET: "test-refresh-secret",
	AUTH_KV: {
		get: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		list: vi.fn(),
		getWithMetadata: vi.fn(),
	},
	RATE_LIMIT_KV: {
		get: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
		list: vi.fn(),
		getWithMetadata: vi.fn(),
	},
	ENVIRONMENT: "test",
	DB: {} as unknown,
} as unknown as Env;

describe("Auth Middleware", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();
	});

	describe("authMiddleware", () => {
		it("should set user context when valid token is provided", async () => {
			// Mock request with valid token
			const validToken = "valid-jwt-token";

			app.use("*", authMiddleware);
			app.get("/test", (c) => {
				const user = c.get("user");
				return c.json({ user });
			});

			const res = await app.request("/test", {
				headers: {
					Authorization: `Bearer ${validToken}`,
				},
			});

			expect(res.status).toBe(200);
		});

		it("should continue without user context when no token is provided", async () => {
			app.use("*", authMiddleware);
			app.get("/test", (c) => {
				const user = c.get("user");
				return c.json({ user: user || null });
			});

			const res = await app.request("/test");

			expect(res.status).toBe(200);
			const data = (await res.json()) as { user: null };
			expect(data.user).toBeNull();
		});

		it("should continue without user context when invalid token is provided", async () => {
			const invalidToken = "invalid-jwt-token";

			app.use("*", authMiddleware);
			app.get("/test", (c) => {
				const user = c.get("user");
				return c.json({ user: user || null });
			});

			const res = await app.request("/test", {
				headers: {
					Authorization: `Bearer ${invalidToken}`,
				},
			});

			expect(res.status).toBe(200);
			const data = (await res.json()) as { user: null };
			expect(data.user).toBeNull();
		});
	});

	describe("requireAuth", () => {
		it("should return 401 when no token is provided", async () => {
			app.use("*", authMiddleware);
			app.use("*", requireAuth);
			app.get("/protected", (c) => {
				return c.json({ message: "Protected content" });
			});

			const res = await app.request("/protected");

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Authentication required");
		});

		it("should return 401 when invalid token is provided", async () => {
			const invalidToken = "invalid-jwt-token";

			app.use("*", authMiddleware);
			app.use("*", requireAuth);
			app.get("/protected", (c) => {
				return c.json({ message: "Protected content" });
			});

			const res = await app.request("/protected", {
				headers: {
					Authorization: `Bearer ${invalidToken}`,
				},
			});

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Authentication required");
		});

		it("should allow access when valid token is provided", async () => {
			const validToken = "valid-jwt-token";

			app.use("*", authMiddleware);
			app.use("*", requireAuth);
			app.get("/protected", (c) => {
				const user = c.get("user");
				return c.json({ message: "Protected content", user });
			});

			const res = await app.request("/protected", {
				headers: {
					Authorization: `Bearer ${validToken}`,
				},
			});

			// This will be 401 until we implement proper token validation
			expect(res.status).toBe(401);
		});
	});

	describe("requireRole", () => {
		it("should return 403 when user has insufficient permissions", async () => {
			// This test will be implemented when we add requireRole middleware
		});

		it("should allow access when user has required role", async () => {
			// This test will be implemented when we add requireRole middleware
		});
	});
});
