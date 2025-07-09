/**
 * CSRF protection utilities using Double Submit Cookie pattern
 * Compatible with Cloudflare Workers environment
 */

import type { Context, Next } from "hono";
import type { Env } from "../index";

// Configuration
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Generate a secure CSRF token
 * @returns Base64 encoded CSRF token
 */
export function generateCSRFToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(CSRF_TOKEN_LENGTH));
	return btoa(String.fromCharCode(...bytes));
}

/**
 * Verify CSRF token using Double Submit Cookie pattern
 * @param cookieToken - Token from cookie
 * @param headerToken - Token from header/form
 * @returns Whether tokens match
 */
export function verifyCSRFToken(cookieToken: string, headerToken: string): boolean {
	if (!cookieToken || !headerToken) {
		return false;
	}

	// Constant-time comparison to prevent timing attacks
	return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Create CSRF protection middleware
 * @param options - Configuration options
 * @returns Hono middleware function
 */
export function createCSRFMiddleware(
	options: { skipMethods?: string[]; cookieName?: string; headerName?: string } = {}
) {
	const {
		skipMethods = ["GET", "HEAD", "OPTIONS"],
		cookieName = CSRF_COOKIE_NAME,
		headerName = CSRF_HEADER_NAME,
	} = options;

	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const method = c.req.method.toUpperCase();

		// Skip CSRF check for safe methods
		if (skipMethods.includes(method)) {
			await next();
			return;
		}

		// Get tokens from cookie and header
		const cookieToken = c.req.header("Cookie")?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];

		const headerToken = c.req.header(headerName);

		// Verify CSRF tokens
		if (!verifyCSRFToken(cookieToken || "", headerToken || "")) {
			return c.json({ error: "Invalid CSRF token" }, 403);
		}

		await next();
	};
}

/**
 * Add CSRF token to response cookies and headers
 * @param c - Hono context
 * @param token - CSRF token (optional, will generate if not provided)
 */
export function setCSRFToken(c: Context<{ Bindings: Env }>, token?: string): string {
	const csrfToken = token || generateCSRFToken();

	// Set cookie with CSRF token
	c.header(
		"Set-Cookie",
		`${CSRF_COOKIE_NAME}=${csrfToken}; HttpOnly; Secure; SameSite=Strict; Path=/`
	);

	// Also send token in response for client-side access
	c.header("X-CSRF-Token", csrfToken);

	return csrfToken;
}

/**
 * Get CSRF token from request
 * @param c - Hono context
 * @returns CSRF token from cookie
 */
export function getCSRFToken(c: Context<{ Bindings: Env }>): string | null {
	const cookieHeader = c.req.header("Cookie");
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
	return match ? match[1] : null;
}

/**
 * Create middleware to set CSRF token for GET requests
 * @returns Hono middleware function
 */
export function createCSRFTokenMiddleware() {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<void> => {
		const method = c.req.method.toUpperCase();

		// Only set CSRF token for GET requests (safe methods)
		if (method === "GET") {
			const existingToken = getCSRFToken(c);

			if (!existingToken) {
				setCSRFToken(c);
			}
		}

		await next();
	};
}

/**
 * Validate CSRF token from form data
 * @param c - Hono context
 * @param formData - Form data containing CSRF token
 * @returns Whether CSRF token is valid
 */
export async function validateCSRFFromForm(
	c: Context<{ Bindings: Env }>,
	formData: FormData
): Promise<boolean> {
	const cookieToken = getCSRFToken(c);
	const formToken = formData.get("_csrf") as string;

	return verifyCSRFToken(cookieToken || "", formToken || "");
}

/**
 * Generate CSRF token for forms
 * @param c - Hono context
 * @returns CSRF token for inclusion in forms
 */
export function getCSRFTokenForForm(c: Context<{ Bindings: Env }>): string {
	let token = getCSRFToken(c);

	if (!token) {
		token = setCSRFToken(c);
	}

	return token;
}
