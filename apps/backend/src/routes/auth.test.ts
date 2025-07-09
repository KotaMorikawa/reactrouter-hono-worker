import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import authRouter from "./auth";

// Mock environment with KV stores
const mockEnv = {
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

const app = new Hono<{ Bindings: Env }>();
app.route("/auth", authRouter);

describe("Auth Routes", () => {
	describe("POST /auth/register", () => {
		it("should return success for valid registration", async () => {
			const res = await app.request(
				"/auth/register",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "newuser@example.com", // Different email to avoid conflicts
						password: "password123",
						name: "New User",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = (await res.json()) as {
				message: string;
				user: { id: string; email: string; name: string; role: string };
				tokens: { accessToken: string; refreshToken: string };
			};
			expect(data.message).toBe("User registered successfully");
			expect(data.tokens).toHaveProperty("accessToken");
			expect(data.tokens).toHaveProperty("refreshToken");
		});
	});

	describe("POST /auth/login", () => {
		it("should return error for invalid login", async () => {
			const res = await app.request(
				"/auth/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "test@example.com",
						password: "wrongpassword",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Invalid credentials");
		});
	});

	describe("POST /auth/logout", () => {
		it("should require authentication", async () => {
			const res = await app.request(
				"/auth/logout",
				{
					method: "POST",
				},
				mockEnv
			);

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Authentication required");
		});
	});

	describe("GET /auth/me", () => {
		it("should require authentication", async () => {
			const res = await app.request(
				"/auth/me",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Authentication required");
		});
	});

	describe("POST /auth/refresh", () => {
		it("should require refresh token", async () => {
			const res = await app.request(
				"/auth/refresh",
				{
					method: "POST",
				},
				mockEnv
			);

			expect(res.status).toBe(401);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Refresh token not provided");
		});
	});

	describe("POST /auth/reset-password", () => {
		it("should return success message for any email", async () => {
			const res = await app.request(
				"/auth/reset-password",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "test@example.com",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = (await res.json()) as { message: string };
			expect(data.message).toBe("If the email exists, a reset link has been sent");
		});

		it("should require email field", async () => {
			const res = await app.request(
				"/auth/reset-password",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockEnv
			);

			expect(res.status).toBe(400);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Email is required");
		});
	});

	describe("POST /auth/reset-password/:token", () => {
		it("should require valid token", async () => {
			const res = await app.request(
				"/auth/reset-password/invalid-token",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						newPassword: "newPassword123",
					}),
				},
				mockEnv
			);

			expect(res.status).toBe(400);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("Invalid or expired reset token");
		});

		it("should require new password", async () => {
			const res = await app.request(
				"/auth/reset-password/valid-token",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockEnv
			);

			expect(res.status).toBe(400);
			const data = (await res.json()) as { error: string };
			expect(data.error).toBe("New password is required");
		});
	});

	describe("GET /auth/reset-attempts/:userId", () => {
		it("should return remaining attempts", async () => {
			const res = await app.request(
				"/auth/reset-attempts/user-123",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = (await res.json()) as { remainingAttempts: number };
			expect(data.remainingAttempts).toBe(3);
		});
	});

	describe("GET /auth/csrf-token", () => {
		it("should return CSRF token", async () => {
			const res = await app.request(
				"/auth/csrf-token",
				{
					method: "GET",
				},
				mockEnv
			);

			expect(res.status).toBe(200);
			const data = (await res.json()) as { csrfToken: string };
			expect(data.csrfToken).toBeTruthy();
			expect(typeof data.csrfToken).toBe("string");
		});
	});
});
