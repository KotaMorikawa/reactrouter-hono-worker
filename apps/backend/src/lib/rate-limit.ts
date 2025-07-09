/**
 * Rate limiting utilities for authentication and API protection
 * Compatible with Cloudflare Workers environment
 */

import type { Env } from "../index";

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const LOGIN_WINDOW_MINUTES = 60;
const IP_RATE_LIMIT_REQUESTS = 100; // requests per minute
const IP_RATE_LIMIT_WINDOW_MINUTES = 1;
const IP_BLOCK_DURATION_HOURS = 24;

/**
 * Check if a user is rate limited for login attempts
 * @param email - User email
 * @param env - Cloudflare environment variables
 * @returns Whether the user is rate limited
 */
export async function checkLoginRateLimit(email: string, env: Env): Promise<boolean> {
	const key = `login_attempts:${email}`;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(key);

		if (!attemptDataStr) {
			return false; // No previous attempts
		}

		const attemptData = JSON.parse(attemptDataStr) as {
			count: number;
			firstAttempt: string;
			lockedUntil?: string;
		};

		// Check if user is locked out
		if (attemptData.lockedUntil) {
			const lockoutExpiry = new Date(attemptData.lockedUntil);
			const now = new Date();

			if (now < lockoutExpiry) {
				return true; // Still locked out
			}

			// Lockout expired, clean up
			await env.RATE_LIMIT_KV.delete(key);
			return false;
		}

		// Check if user has exceeded max attempts
		return attemptData.count >= MAX_LOGIN_ATTEMPTS;
	} catch (error) {
		console.error("Error checking login rate limit:", error);
		return false; // Allow on error to avoid blocking legitimate users
	}
}

/**
 * Record a failed login attempt
 * @param email - User email
 * @param env - Cloudflare environment variables
 */
export async function recordFailedLogin(email: string, env: Env): Promise<void> {
	const key = `login_attempts:${email}`;
	const expirationTtl = LOGIN_WINDOW_MINUTES * 60;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(key);
		const now = new Date();

		if (!attemptDataStr) {
			// First failed attempt
			const attemptData = {
				count: 1,
				firstAttempt: now.toISOString(),
			};

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(attemptData), {
				expirationTtl,
			});
		} else {
			// Increment attempt count
			const attemptData = JSON.parse(attemptDataStr) as {
				count: number;
				firstAttempt: string;
				lockedUntil?: string;
			};

			attemptData.count++;

			// Set lockout if max attempts reached
			if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
				attemptData.lockedUntil = new Date(
					now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000
				).toISOString();
			}

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(attemptData), {
				expirationTtl: LOCKOUT_DURATION_MINUTES * 60, // Extend expiration for lockout
			});
		}
	} catch (error) {
		console.error("Error recording failed login:", error);
	}
}

/**
 * Record a successful login (clears failed attempts)
 * @param email - User email
 * @param env - Cloudflare environment variables
 */
export async function recordSuccessfulLogin(email: string, env: Env): Promise<void> {
	const key = `login_attempts:${email}`;

	try {
		await env.RATE_LIMIT_KV.delete(key);
	} catch (error) {
		console.error("Error clearing failed login attempts:", error);
	}
}

/**
 * Get remaining login attempts for a user
 * @param email - User email
 * @param env - Cloudflare environment variables
 * @returns Number of remaining attempts
 */
export async function getRemainingLoginAttempts(email: string, env: Env): Promise<number> {
	const key = `login_attempts:${email}`;

	try {
		const attemptDataStr = await env.RATE_LIMIT_KV.get(key);

		if (!attemptDataStr) {
			return MAX_LOGIN_ATTEMPTS;
		}

		const attemptData = JSON.parse(attemptDataStr) as {
			count: number;
			firstAttempt: string;
			lockedUntil?: string;
		};

		return Math.max(0, MAX_LOGIN_ATTEMPTS - attemptData.count);
	} catch (error) {
		console.error("Error getting remaining login attempts:", error);
		return MAX_LOGIN_ATTEMPTS;
	}
}

/**
 * Check if an IP is rate limited
 * @param ip - Client IP address
 * @param env - Cloudflare environment variables
 * @returns Whether the IP is rate limited
 */
export async function checkIpRateLimit(ip: string, env: Env): Promise<boolean> {
	const key = `ip_rate_limit:${ip}`;

	try {
		const rateLimitDataStr = await env.RATE_LIMIT_KV.get(key);

		if (!rateLimitDataStr) {
			return false; // No previous requests
		}

		const rateLimitData = JSON.parse(rateLimitDataStr) as {
			requests: number;
			windowStart: string;
		};

		const windowStart = new Date(rateLimitData.windowStart);
		const now = new Date();
		const minutesDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60);

		// Reset window if it has passed
		if (minutesDiff > IP_RATE_LIMIT_WINDOW_MINUTES) {
			await env.RATE_LIMIT_KV.delete(key);
			return false;
		}

		// Check if rate limit exceeded
		return rateLimitData.requests >= IP_RATE_LIMIT_REQUESTS;
	} catch (error) {
		console.error("Error checking IP rate limit:", error);
		return false;
	}
}

/**
 * Record IP activity for rate limiting
 * @param ip - Client IP address
 * @param env - Cloudflare environment variables
 */
export async function recordIpActivity(ip: string, env: Env): Promise<void> {
	const key = `ip_rate_limit:${ip}`;
	const expirationTtl = IP_RATE_LIMIT_WINDOW_MINUTES * 60;

	try {
		const rateLimitDataStr = await env.RATE_LIMIT_KV.get(key);
		const now = new Date();

		if (!rateLimitDataStr) {
			// First request in window
			const rateLimitData = {
				requests: 1,
				windowStart: now.toISOString(),
			};

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(rateLimitData), {
				expirationTtl,
			});
		} else {
			// Increment request count
			const rateLimitData = JSON.parse(rateLimitDataStr) as {
				requests: number;
				windowStart: string;
			};

			rateLimitData.requests++;

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(rateLimitData), {
				expirationTtl,
			});
		}
	} catch (error) {
		console.error("Error recording IP activity:", error);
	}
}

/**
 * Check if an IP is blocked
 * @param ip - Client IP address
 * @param env - Cloudflare environment variables
 * @returns Whether the IP is blocked
 */
export async function isIpBlocked(ip: string, env: Env): Promise<boolean> {
	const key = `ip_block:${ip}`;

	try {
		const blockDataStr = await env.RATE_LIMIT_KV.get(key);

		if (!blockDataStr) {
			return false;
		}

		const blockData = JSON.parse(blockDataStr) as {
			blocked: boolean;
			reason: string;
			blockedAt: string;
		};

		return blockData.blocked;
	} catch (error) {
		console.error("Error checking IP block status:", error);
		return false;
	}
}

/**
 * Block an IP address
 * @param ip - Client IP address
 * @param reason - Reason for blocking
 * @param env - Cloudflare environment variables
 */
export async function blockIp(ip: string, reason: string, env: Env): Promise<void> {
	const key = `ip_block:${ip}`;
	const expirationTtl = IP_BLOCK_DURATION_HOURS * 60 * 60;

	try {
		const blockData = {
			blocked: true,
			reason,
			blockedAt: new Date().toISOString(),
		};

		await env.RATE_LIMIT_KV.put(key, JSON.stringify(blockData), {
			expirationTtl,
		});

		console.log(`Blocked IP ${ip}: ${reason}`);
	} catch (error) {
		console.error("Error blocking IP:", error);
	}
}

/**
 * Unblock an IP address
 * @param ip - Client IP address
 * @param env - Cloudflare environment variables
 */
export async function unblockIp(ip: string, env: Env): Promise<void> {
	const key = `ip_block:${ip}`;

	try {
		await env.RATE_LIMIT_KV.delete(key);
		console.log(`Unblocked IP ${ip}`);
	} catch (error) {
		console.error("Error unblocking IP:", error);
	}
}

/**
 * Get client IP from request
 * @param request - Request object
 * @returns Client IP address
 */
export function getClientIp(request: Request): string {
	// Cloudflare Workers provides the real IP in the CF-Connecting-IP header
	const cfConnectingIp = request.headers.get("CF-Connecting-IP");
	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	// Fallback headers
	const xForwardedFor = request.headers.get("X-Forwarded-For");
	if (xForwardedFor) {
		return xForwardedFor.split(",")[0].trim();
	}

	const xRealIp = request.headers.get("X-Real-IP");
	if (xRealIp) {
		return xRealIp;
	}

	// Default fallback
	return "unknown";
}

/**
 * Analyze suspicious activity patterns
 * @param ip - Client IP address
 * @param userAgent - User agent string
 * @param env - Cloudflare environment variables
 * @returns Whether the activity is suspicious
 */
export async function isSuspiciousActivity(
	ip: string,
	userAgent: string,
	env: Env
): Promise<boolean> {
	// Check for common bot patterns
	const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i];

	const isBotUserAgent = botPatterns.some((pattern) => pattern.test(userAgent));

	if (isBotUserAgent) {
		return true;
	}

	// Check for rapid requests from same IP
	const isRateLimited = await checkIpRateLimit(ip, env);
	if (isRateLimited) {
		return true;
	}

	// Check for multiple failed logins
	try {
		const failedLoginsKey = `suspicious_activity:${ip}`;
		const failedLoginsStr = await env.RATE_LIMIT_KV.get(failedLoginsKey);

		if (failedLoginsStr) {
			const failedLogins = JSON.parse(failedLoginsStr) as {
				count: number;
				lastAttempt: string;
			};

			// More than 10 failed logins in the last hour
			const lastAttempt = new Date(failedLogins.lastAttempt);
			const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

			if (failedLogins.count > 10 && lastAttempt > hourAgo) {
				return true;
			}
		}
	} catch (error) {
		console.error("Error checking suspicious activity:", error);
	}

	return false;
}

/**
 * Record suspicious activity
 * @param ip - Client IP address
 * @param activity - Type of suspicious activity
 * @param env - Cloudflare environment variables
 */
export async function recordSuspiciousActivity(
	ip: string,
	activity: string,
	env: Env
): Promise<void> {
	const key = `suspicious_activity:${ip}`;
	const expirationTtl = 60 * 60; // 1 hour

	try {
		const activityDataStr = await env.RATE_LIMIT_KV.get(key);
		const now = new Date();

		if (!activityDataStr) {
			const activityData = {
				count: 1,
				lastAttempt: now.toISOString(),
				activities: [activity],
			};

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(activityData), {
				expirationTtl,
			});
		} else {
			const activityData = JSON.parse(activityDataStr) as {
				count: number;
				lastAttempt: string;
				activities: string[];
			};

			activityData.count++;
			activityData.lastAttempt = now.toISOString();
			activityData.activities.push(activity);

			// Auto-block if too many suspicious activities
			if (activityData.count >= 5) {
				await blockIp(ip, "Multiple suspicious activities", env);
			}

			await env.RATE_LIMIT_KV.put(key, JSON.stringify(activityData), {
				expirationTtl,
			});
		}

		console.log(`Recorded suspicious activity from ${ip}: ${activity}`);
	} catch (error) {
		console.error("Error recording suspicious activity:", error);
	}
}
