/**
 * Security middleware for Hono application
 * Includes rate limiting, IP blocking, and security headers
 */

import type { Context, Next } from "hono";
import type { Env } from "../index";
import {
	checkIpRateLimit,
	getClientIp,
	isIpBlocked,
	isSuspiciousActivity,
	recordIpActivity,
	recordSuspiciousActivity,
} from "../lib/rate-limit";

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export async function securityHeaders(c: Context, next: Next): Promise<void> {
	await next();

	// X-Content-Type-Options: Prevent MIME type sniffing
	c.header("X-Content-Type-Options", "nosniff");

	// X-Frame-Options: Prevent clickjacking
	c.header("X-Frame-Options", "DENY");

	// X-XSS-Protection: Enable XSS filtering
	c.header("X-XSS-Protection", "1; mode=block");

	// Referrer-Policy: Control referrer information
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");

	// Permissions-Policy: Control browser features
	c.header(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()"
	);

	// Content-Security-Policy: Prevent XSS and injection attacks
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
		"style-src 'self' 'unsafe-inline'", // Allow inline styles
		"img-src 'self' data: https:",
		"font-src 'self' https:",
		"connect-src 'self' https:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"object-src 'none'",
	].join("; ");

	c.header("Content-Security-Policy", csp);

	// Strict-Transport-Security: Enforce HTTPS
	if (c.env?.ENVIRONMENT === "production") {
		c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
	}
}

/**
 * Rate limiting middleware
 * Blocks requests from IPs that exceed rate limits
 */
export function rateLimitMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const ip = getClientIp(c.req.raw);

		// Check if IP is rate limited
		const isRateLimited = await checkIpRateLimit(ip, c.env);

		if (isRateLimited) {
			return c.json(
				{
					error: "Rate limit exceeded",
					message: "Too many requests. Please try again later.",
				},
				429
			);
		}

		// Record this request
		await recordIpActivity(ip, c.env);

		await next();
	};
}

/**
 * IP blocking middleware
 * Blocks requests from banned IP addresses
 */
export function ipBlockingMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const ip = getClientIp(c.req.raw);

		// Check if IP is blocked
		const blocked = await isIpBlocked(ip, c.env);

		if (blocked) {
			return c.json(
				{
					error: "Access denied",
					message: "Your IP address has been blocked.",
				},
				403
			);
		}

		await next();
	};
}

/**
 * Suspicious activity detection middleware
 * Monitors and records suspicious behavior patterns
 */
export function suspiciousActivityMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<void> => {
		const ip = getClientIp(c.req.raw);
		const userAgent = c.req.header("User-Agent") || "";

		// Check for suspicious activity patterns
		const suspicious = await isSuspiciousActivity(ip, userAgent, c.env);

		if (suspicious) {
			await recordSuspiciousActivity(ip, `Suspicious request to ${c.req.url}`, c.env);
		}

		await next();
	};
}

/**
 * Login rate limiting middleware specifically for authentication endpoints
 */
export function loginRateLimitMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const ip = getClientIp(c.req.raw);

		// More strict rate limiting for login attempts
		const loginRateLimit = 10; // 10 attempts per minute
		const key = `login_rate_limit:${ip}`;

		try {
			const rateLimitDataStr = await c.env.RATE_LIMIT_KV.get(key);
			const now = new Date();

			if (rateLimitDataStr) {
				const rateLimitData = JSON.parse(rateLimitDataStr) as {
					attempts: number;
					windowStart: string;
				};

				const windowStart = new Date(rateLimitData.windowStart);
				const minutesDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60);

				// Check if within the same minute and over limit
				if (minutesDiff < 1 && rateLimitData.attempts >= loginRateLimit) {
					return c.json(
						{
							error: "Login rate limit exceeded",
							message: "Too many login attempts. Please try again later.",
						},
						429
					);
				}

				// Reset if window has passed
				if (minutesDiff >= 1) {
					await c.env.RATE_LIMIT_KV.put(
						key,
						JSON.stringify({
							attempts: 1,
							windowStart: now.toISOString(),
						}),
						{ expirationTtl: 60 }
					);
				} else {
					// Increment attempts
					rateLimitData.attempts++;
					await c.env.RATE_LIMIT_KV.put(key, JSON.stringify(rateLimitData), { expirationTtl: 60 });
				}
			} else {
				// First attempt in this window
				await c.env.RATE_LIMIT_KV.put(
					key,
					JSON.stringify({
						attempts: 1,
						windowStart: now.toISOString(),
					}),
					{ expirationTtl: 60 }
				);
			}
		} catch (error) {
			console.error("Error in login rate limiting:", error);
			// Continue on error to avoid blocking legitimate users
		}

		await next();
	};
}

/**
 * Comprehensive security middleware that combines all security measures
 */
export function comprehensiveSecurityMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		// Apply IP blocking first
		const ip = getClientIp(c.req.raw);
		const blocked = await isIpBlocked(ip, c.env);

		if (blocked) {
			return c.json(
				{
					error: "Access denied",
					message: "Your IP address has been blocked.",
				},
				403
			);
		}

		// Check rate limits
		const isRateLimited = await checkIpRateLimit(ip, c.env);

		if (isRateLimited) {
			return c.json(
				{
					error: "Rate limit exceeded",
					message: "Too many requests. Please try again later.",
				},
				429
			);
		}

		// Record activity and check for suspicious patterns
		await recordIpActivity(ip, c.env);

		const userAgent = c.req.header("User-Agent") || "";
		const suspicious = await isSuspiciousActivity(ip, userAgent, c.env);

		if (suspicious) {
			await recordSuspiciousActivity(ip, `Suspicious request to ${c.req.url}`, c.env);
		}

		// Apply security headers
		await securityHeaders(c, next);
	};
}
