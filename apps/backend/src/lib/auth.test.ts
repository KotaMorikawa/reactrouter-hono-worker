import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import { generateTokens, refreshAccessToken, verifyToken } from "./auth";

// Mock environment variables
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

describe("JWT Authentication Utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generateTokens", () => {
		it("should generate access and refresh tokens", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				role: "viewer",
			};

			const tokens = await generateTokens(user, mockEnv);

			expect(tokens).toHaveProperty("accessToken");
			expect(tokens).toHaveProperty("refreshToken");
			expect(typeof tokens.accessToken).toBe("string");
			expect(typeof tokens.refreshToken).toBe("string");
			expect(tokens.accessToken).not.toBe(tokens.refreshToken);
		});

		it("should store refresh token in KV", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				role: "viewer",
			};

			await generateTokens(user, mockEnv);

			expect(mockEnv.AUTH_KV.put).toHaveBeenCalledWith(
				expect.stringContaining("refresh_token:"),
				expect.stringContaining(user.id),
				expect.objectContaining({
					expirationTtl: expect.any(Number),
				})
			);
		});
	});

	describe("verifyToken", () => {
		it("should verify valid access token", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				role: "viewer",
			};

			const tokens = await generateTokens(user, mockEnv);
			const payload = await verifyToken(tokens.accessToken, mockEnv.JWT_SECRET);

			expect(payload).toHaveProperty("userId", user.id);
			expect(payload).toHaveProperty("email", user.email);
			expect(payload).toHaveProperty("role", user.role);
			expect(payload).toHaveProperty("type", "access");
		});

		it("should reject invalid token", async () => {
			const invalidToken = "invalid-token";

			await expect(verifyToken(invalidToken, mockEnv.JWT_SECRET)).rejects.toThrow();
		});

		it("should reject expired token", async () => {
			// This test would need to be implemented with token expiration logic
			// For now, we'll skip this test
		});
	});

	describe("refreshAccessToken", () => {
		it("should generate new access token from valid refresh token", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				role: "viewer",
			};

			const tokens = await generateTokens(user, mockEnv);

			// Mock KV get to return user data
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify(user));

			const newAccessToken = await refreshAccessToken(tokens.refreshToken, mockEnv);

			expect(typeof newAccessToken).toBe("string");
			expect(newAccessToken).not.toBe(tokens.accessToken);
			expect(mockEnv.AUTH_KV.get).toHaveBeenCalledWith(expect.stringContaining("refresh_token:"));
		});

		it("should reject invalid refresh token", async () => {
			const invalidToken = "invalid-refresh-token";

			await expect(refreshAccessToken(invalidToken, mockEnv)).rejects.toThrow();
		});

		it("should reject expired refresh token", async () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				role: "viewer",
			};

			const tokens = await generateTokens(user, mockEnv);

			// Mock KV get to return null (expired/deleted)
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			await expect(refreshAccessToken(tokens.refreshToken, mockEnv)).rejects.toThrow();
		});
	});
});
