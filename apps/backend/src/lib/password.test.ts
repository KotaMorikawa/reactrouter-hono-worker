import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Hashing Utilities", () => {
	describe("hashPassword", () => {
		it("should hash a password", async () => {
			const password = "mySecurePassword123!";
			const hash = await hashPassword(password);

			expect(hash).toBeTruthy();
			expect(typeof hash).toBe("string");
			expect(hash).not.toBe(password);
			expect(hash.length).toBeGreaterThan(50); // Should be a long hash
		});

		it("should generate different hashes for the same password", async () => {
			const password = "mySecurePassword123!";
			const hash1 = await hashPassword(password);
			const hash2 = await hashPassword(password);

			expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
		});

		it("should handle empty password", async () => {
			await expect(hashPassword("")).rejects.toThrow("Password cannot be empty");
		});

		it("should handle very long passwords", async () => {
			const longPassword = "a".repeat(1000);
			const hash = await hashPassword(longPassword);

			expect(hash).toBeTruthy();
			expect(typeof hash).toBe("string");
		});
	});

	describe("verifyPassword", () => {
		it("should verify correct password", async () => {
			const password = "mySecurePassword123!";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(password, hash);
			expect(isValid).toBe(true);
		});

		it("should reject incorrect password", async () => {
			const password = "mySecurePassword123!";
			const wrongPassword = "wrongPassword123!";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(wrongPassword, hash);
			expect(isValid).toBe(false);
		});

		it("should handle empty password verification", async () => {
			const password = "mySecurePassword123!";
			const hash = await hashPassword(password);

			await expect(verifyPassword("", hash)).rejects.toThrow("Password cannot be empty");
		});

		it("should handle invalid hash format", async () => {
			const password = "mySecurePassword123!";
			const invalidHash = "invalid-hash-format";

			await expect(verifyPassword(password, invalidHash)).rejects.toThrow("Invalid hash format");
		});

		it("should handle case sensitivity", async () => {
			const password = "MySecurePassword123!";
			const hash = await hashPassword(password);

			const isValidLower = await verifyPassword("mysecurepassword123!", hash);
			const isValidUpper = await verifyPassword("MYSECUREPASSWORD123!", hash);

			expect(isValidLower).toBe(false);
			expect(isValidUpper).toBe(false);
		});
	});

	describe("password strength", () => {
		it("should work with Unicode characters", async () => {
			const password = "パスワード123!🔐";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(password, hash);
			expect(isValid).toBe(true);
		});

		it("should work with special characters", async () => {
			const password = "P@$$w0rd!#%&*()[]{}";
			const hash = await hashPassword(password);

			const isValid = await verifyPassword(password, hash);
			expect(isValid).toBe(true);
		});
	});
});
