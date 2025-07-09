/**
 * Password reset utilities using Web Crypto API
 * Compatible with Cloudflare Workers environment
 */

import type { Env } from "../index";

// Configuration
const RESET_TOKEN_LENGTH = 32; // 256 bits
const RESET_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds

/**
 * Generate a secure random password reset token
 * @returns Base64 encoded random token
 */
function generateSecureToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(RESET_TOKEN_LENGTH));
	return btoa(String.fromCharCode(...bytes));
}

/**
 * Generate a password reset token and store it in KV
 * @param userId - User ID
 * @param email - User email for verification
 * @param env - Cloudflare environment variables
 * @returns Password reset token
 */
export async function generatePasswordResetToken(
	userId: string,
	email: string,
	env: Env
): Promise<string> {
	if (!userId || !email) {
		throw new Error("User ID and email are required");
	}

	// Generate secure token
	const token = generateSecureToken();
	const tokenKey = `reset_token:${token}`;

	// Store token data in KV with expiration
	const tokenData = {
		userId,
		email,
		createdAt: new Date().toISOString(),
	};

	await env.AUTH_KV.put(tokenKey, JSON.stringify(tokenData), {
		expirationTtl: RESET_TOKEN_EXPIRY,
	});

	return token;
}

/**
 * Verify a password reset token and return user data
 * @param token - Password reset token
 * @param env - Cloudflare environment variables
 * @returns User data if token is valid
 */
export async function verifyPasswordResetToken(
	token: string,
	env: Env
): Promise<{ userId: string; email: string }> {
	if (!token) {
		throw new Error("Reset token is required");
	}

	const tokenKey = `reset_token:${token}`;

	// Retrieve token data from KV
	const tokenDataStr = await env.AUTH_KV.get(tokenKey);

	if (!tokenDataStr) {
		throw new Error("Reset token expired or invalid");
	}

	try {
		const tokenData = JSON.parse(tokenDataStr) as {
			userId: string;
			email: string;
			createdAt: string;
		};

		// Delete the token immediately after verification (single use)
		await env.AUTH_KV.delete(tokenKey);

		return {
			userId: tokenData.userId,
			email: tokenData.email,
		};
	} catch (_error) {
		throw new Error("Invalid reset token");
	}
}

/**
 * Clean up expired reset tokens (for maintenance)
 * @param env - Cloudflare environment variables
 * @returns Number of tokens cleaned up
 */
export async function cleanupExpiredTokens(env: Env): Promise<number> {
	try {
		// List all reset tokens
		const { keys } = await env.AUTH_KV.list({
			prefix: "reset_token:",
		});

		// Delete all found tokens (KV will handle expired ones automatically)
		const deletePromises = keys.map((key) => env.AUTH_KV.delete(key.name));

		await Promise.all(deletePromises);

		return keys.length;
	} catch (error) {
		console.error("Error cleaning up expired tokens:", error);
		return 0;
	}
}

/**
 * Check if a user has too many reset attempts
 * @param userId - User ID
 * @param env - Cloudflare environment variables
 * @returns Whether user has exceeded reset attempts
 */
export async function checkResetRateLimit(userId: string, env: Env): Promise<boolean> {
	const rateLimitKey = `reset_rate_limit:${userId}`;
	const maxAttempts = 3;
	const windowMinutes = 60;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(rateLimitKey);

		if (!attemptDataStr) {
			return false; // No previous attempts
		}

		const attemptData = JSON.parse(attemptDataStr) as {
			count: number;
			firstAttempt: string;
		};

		const firstAttemptTime = new Date(attemptData.firstAttempt);
		const now = new Date();
		const timeDiff = now.getTime() - firstAttemptTime.getTime();
		const minutesDiff = timeDiff / (1000 * 60);

		// Reset counter if window has passed
		if (minutesDiff > windowMinutes) {
			await env.RATE_LIMIT_KV.delete(rateLimitKey);
			return false;
		}

		// Check if limit exceeded
		return attemptData.count >= maxAttempts;
	} catch (error) {
		console.error("Error checking reset rate limit:", error);
		return false;
	}
}

/**
 * Record a reset attempt for rate limiting
 * @param userId - User ID
 * @param env - Cloudflare environment variables
 */
export async function recordResetAttempt(userId: string, env: Env): Promise<void> {
	const rateLimitKey = `reset_rate_limit:${userId}`;
	const windowMinutes = 60;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(rateLimitKey);

		if (!attemptDataStr) {
			// First attempt
			const attemptData = {
				count: 1,
				firstAttempt: new Date().toISOString(),
			};

			await env.RATE_LIMIT_KV.put(rateLimitKey, JSON.stringify(attemptData), {
				expirationTtl: windowMinutes * 60,
			});
		} else {
			// Increment counter
			const attemptData = JSON.parse(attemptDataStr) as {
				count: number;
				firstAttempt: string;
			};

			attemptData.count++;

			await env.RATE_LIMIT_KV.put(rateLimitKey, JSON.stringify(attemptData), {
				expirationTtl: windowMinutes * 60,
			});
		}
	} catch (error) {
		console.error("Error recording reset attempt:", error);
	}
}

/**
 * Get remaining reset attempts for a user
 * @param userId - User ID
 * @param env - Cloudflare environment variables
 * @returns Number of remaining attempts
 */
export async function getRemainingResetAttempts(userId: string, env: Env): Promise<number> {
	const rateLimitKey = `reset_rate_limit:${userId}`;
	const maxAttempts = 3;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(rateLimitKey);

		if (!attemptDataStr) {
			return maxAttempts;
		}

		const attemptData = JSON.parse(attemptDataStr) as {
			count: number;
			firstAttempt: string;
		};

		return Math.max(0, maxAttempts - attemptData.count);
	} catch (error) {
		console.error("Error getting remaining reset attempts:", error);
		return maxAttempts;
	}
}
