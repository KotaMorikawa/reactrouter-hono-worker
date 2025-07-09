import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import { createCSRFMiddleware, generateCSRFToken, verifyCSRFToken } from "./csrf";

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

describe("CSRF Protection Utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generateCSRFToken", () => {
		it("should generate a CSRF token", () => {
			const token = generateCSRFToken();

			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");
			expect(token.length).toBeGreaterThan(20);
		});

		it("should generate different tokens", () => {
			const token1 = generateCSRFToken();
			const token2 = generateCSRFToken();

			expect(token1).not.toBe(token2);
		});
	});

	describe("verifyCSRFToken", () => {
		it("should verify matching tokens", () => {
			const token = generateCSRFToken();

			const isValid = verifyCSRFToken(token, token);

			expect(isValid).toBe(true);
		});

		it("should reject non-matching tokens", () => {
			const token1 = generateCSRFToken();
			const token2 = generateCSRFToken();

			const isValid = verifyCSRFToken(token1, token2);

			expect(isValid).toBe(false);
		});

		it("should reject empty tokens", () => {
			const token = generateCSRFToken();

			const isValid1 = verifyCSRFToken("", token);
			const isValid2 = verifyCSRFToken(token, "");

			expect(isValid1).toBe(false);
			expect(isValid2).toBe(false);
		});

		it("should handle malformed tokens", () => {
			const validToken = generateCSRFToken();
			const malformedToken = "not-a-real-token";

			const isValid = verifyCSRFToken(malformedToken, validToken);

			expect(isValid).toBe(false);
		});
	});

	describe("createCSRFMiddleware", () => {
		it("should be a function", () => {
			const middleware = createCSRFMiddleware();

			expect(typeof middleware).toBe("function");
		});
	});
});
