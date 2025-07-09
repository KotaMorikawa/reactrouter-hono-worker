import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import {
	cleanupExpiredTokens,
	generatePasswordResetToken,
	verifyPasswordResetToken,
} from "./password-reset";

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

describe("Password Reset Utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generatePasswordResetToken", () => {
		it("should generate a password reset token", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			const token = await generatePasswordResetToken(userId, email, mockEnv);

			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");
			expect(token.length).toBeGreaterThan(20);
		});

		it("should store reset token in KV with expiration", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			await generatePasswordResetToken(userId, email, mockEnv);

			expect(mockEnv.AUTH_KV.put).toHaveBeenCalledWith(
				expect.stringContaining("reset_token:"),
				expect.stringContaining(userId),
				expect.objectContaining({
					expirationTtl: expect.any(Number),
				})
			);
		});

		it("should generate different tokens for multiple calls", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			const token1 = await generatePasswordResetToken(userId, email, mockEnv);
			const token2 = await generatePasswordResetToken(userId, email, mockEnv);

			expect(token1).not.toBe(token2);
		});
	});

	describe("verifyPasswordResetToken", () => {
		it("should verify valid reset token", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			const token = await generatePasswordResetToken(userId, email, mockEnv);

			// Mock KV get to return user data
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
				JSON.stringify({ userId, email })
			);

			const result = await verifyPasswordResetToken(token, mockEnv);

			expect(result).toEqual({ userId, email });
			expect(mockEnv.AUTH_KV.get).toHaveBeenCalledWith(expect.stringContaining("reset_token:"));
		});

		it("should reject invalid token", async () => {
			const invalidToken = "invalid-token";

			// Mock KV get to return null for invalid token
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			await expect(verifyPasswordResetToken(invalidToken, mockEnv)).rejects.toThrow(
				"Reset token expired or invalid"
			);
		});

		it("should reject expired token", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			const token = await generatePasswordResetToken(userId, email, mockEnv);

			// Clear previous mock calls
			vi.clearAllMocks();

			// Mock KV get to return null (expired)
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			await expect(verifyPasswordResetToken(token, mockEnv)).rejects.toThrow(
				"Reset token expired or invalid"
			);
		});

		it("should delete token after successful verification", async () => {
			const userId = "user-123";
			const email = "test@example.com";

			const token = await generatePasswordResetToken(userId, email, mockEnv);

			// Mock KV get to return user data
			(mockEnv.AUTH_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
				JSON.stringify({ userId, email })
			);

			await verifyPasswordResetToken(token, mockEnv);

			expect(mockEnv.AUTH_KV.delete).toHaveBeenCalledWith(expect.stringContaining("reset_token:"));
		});
	});

	describe("cleanupExpiredTokens", () => {
		it("should clean up expired reset tokens", async () => {
			const mockTokens = [
				{ name: "reset_token:token1", metadata: { userId: "user1" } },
				{ name: "reset_token:token2", metadata: { userId: "user2" } },
			];

			// Mock KV list to return tokens
			(mockEnv.AUTH_KV.list as ReturnType<typeof vi.fn>).mockResolvedValue({
				keys: mockTokens,
			});

			const cleanedCount = await cleanupExpiredTokens(mockEnv);

			expect(cleanedCount).toBe(2);
			expect(mockEnv.AUTH_KV.list).toHaveBeenCalledWith({
				prefix: "reset_token:",
			});
			expect(mockEnv.AUTH_KV.delete).toHaveBeenCalledTimes(2);
		});

		it("should handle empty token list", async () => {
			// Mock KV list to return empty
			(mockEnv.AUTH_KV.list as ReturnType<typeof vi.fn>).mockResolvedValue({
				keys: [],
			});

			const cleanedCount = await cleanupExpiredTokens(mockEnv);

			expect(cleanedCount).toBe(0);
			expect(mockEnv.AUTH_KV.delete).not.toHaveBeenCalled();
		});
	});
});
