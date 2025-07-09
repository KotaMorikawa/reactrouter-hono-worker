import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import {
	blockIp,
	checkIpRateLimit,
	checkLoginRateLimit,
	getRemainingLoginAttempts,
	isIpBlocked,
	recordFailedLogin,
	recordSuccessfulLogin,
} from "./rate-limit";

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

describe("Rate Limiting Utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Login Rate Limiting", () => {
		describe("checkLoginRateLimit", () => {
			it("should allow login when no previous attempts", async () => {
				const email = "test@example.com";

				// Mock KV get to return null (no previous attempts)
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

				const isLimited = await checkLoginRateLimit(email, mockEnv);

				expect(isLimited).toBe(false);
				expect(mockEnv.RATE_LIMIT_KV.get).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:")
				);
			});

			it("should block login after 5 failed attempts", async () => {
				const email = "test@example.com";
				const attemptData = {
					count: 5,
					firstAttempt: new Date().toISOString(),
					lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
				};

				// Mock KV get to return max attempts
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify(attemptData)
				);

				const isLimited = await checkLoginRateLimit(email, mockEnv);

				expect(isLimited).toBe(true);
			});

			it("should allow login after lockout period expires", async () => {
				const email = "test@example.com";
				const attemptData = {
					count: 5,
					firstAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
					lockedUntil: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
				};

				// Mock KV get to return expired lockout
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify(attemptData)
				);

				const isLimited = await checkLoginRateLimit(email, mockEnv);

				expect(isLimited).toBe(false);
				expect(mockEnv.RATE_LIMIT_KV.delete).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:")
				);
			});
		});

		describe("recordFailedLogin", () => {
			it("should record first failed attempt", async () => {
				const email = "test@example.com";

				// Mock KV get to return null (no previous attempts)
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

				await recordFailedLogin(email, mockEnv);

				expect(mockEnv.RATE_LIMIT_KV.put).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:"),
					expect.stringContaining('"count":1'),
					expect.objectContaining({
						expirationTtl: expect.any(Number),
					})
				);
			});

			it("should increment failed attempt count", async () => {
				const email = "test@example.com";
				const existingData = {
					count: 2,
					firstAttempt: new Date().toISOString(),
				};

				// Mock KV get to return existing attempts
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify(existingData)
				);

				await recordFailedLogin(email, mockEnv);

				expect(mockEnv.RATE_LIMIT_KV.put).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:"),
					expect.stringContaining('"count":3'),
					expect.objectContaining({
						expirationTtl: expect.any(Number),
					})
				);
			});

			it("should set lockout after 5 failed attempts", async () => {
				const email = "test@example.com";
				const existingData = {
					count: 4,
					firstAttempt: new Date().toISOString(),
				};

				// Mock KV get to return 4 previous attempts
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify(existingData)
				);

				await recordFailedLogin(email, mockEnv);

				expect(mockEnv.RATE_LIMIT_KV.put).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:"),
					expect.stringContaining("lockedUntil"),
					expect.objectContaining({
						expirationTtl: expect.any(Number),
					})
				);
			});
		});

		describe("recordSuccessfulLogin", () => {
			it("should clear failed attempts on successful login", async () => {
				const email = "test@example.com";

				await recordSuccessfulLogin(email, mockEnv);

				expect(mockEnv.RATE_LIMIT_KV.delete).toHaveBeenCalledWith(
					expect.stringContaining("login_attempts:")
				);
			});
		});

		describe("getRemainingLoginAttempts", () => {
			it("should return max attempts when no previous failures", async () => {
				const email = "test@example.com";

				// Mock KV get to return null
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

				const remaining = await getRemainingLoginAttempts(email, mockEnv);

				expect(remaining).toBe(5);
			});

			it("should return correct remaining attempts", async () => {
				const email = "test@example.com";
				const attemptData = {
					count: 3,
					firstAttempt: new Date().toISOString(),
				};

				// Mock KV get to return 3 attempts
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify(attemptData)
				);

				const remaining = await getRemainingLoginAttempts(email, mockEnv);

				expect(remaining).toBe(2);
			});
		});
	});

	describe("IP Rate Limiting", () => {
		describe("checkIpRateLimit", () => {
			it("should allow requests within rate limit", async () => {
				const ip = "192.168.1.1";

				// Mock KV get to return low request count
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify({ requests: 50, windowStart: new Date().toISOString() })
				);

				const isLimited = await checkIpRateLimit(ip, mockEnv);

				expect(isLimited).toBe(false);
			});

			it("should block requests exceeding rate limit", async () => {
				const ip = "192.168.1.1";

				// Mock KV get to return high request count
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify({ requests: 200, windowStart: new Date().toISOString() })
				);

				const isLimited = await checkIpRateLimit(ip, mockEnv);

				expect(isLimited).toBe(true);
			});
		});

		describe("isIpBlocked", () => {
			it("should return false for non-blocked IP", async () => {
				const ip = "192.168.1.1";

				// Mock KV get to return null
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

				const blocked = await isIpBlocked(ip, mockEnv);

				expect(blocked).toBe(false);
			});

			it("should return true for blocked IP", async () => {
				const ip = "192.168.1.1";

				// Mock KV get to return block data
				(mockEnv.RATE_LIMIT_KV.get as ReturnType<typeof vi.fn>).mockResolvedValue(
					JSON.stringify({ blocked: true, reason: "suspicious activity" })
				);

				const blocked = await isIpBlocked(ip, mockEnv);

				expect(blocked).toBe(true);
			});
		});

		describe("blockIp", () => {
			it("should block IP with reason", async () => {
				const ip = "192.168.1.1";
				const reason = "Multiple failed login attempts";

				await blockIp(ip, reason, mockEnv);

				expect(mockEnv.RATE_LIMIT_KV.put).toHaveBeenCalledWith(
					expect.stringContaining("ip_block:"),
					expect.stringContaining(reason),
					expect.objectContaining({
						expirationTtl: expect.any(Number),
					})
				);
			});
		});
	});
});
