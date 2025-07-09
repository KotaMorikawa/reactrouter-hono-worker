import type { Env } from "../index";

// JWT payload interfaces
interface JWTPayload {
	userId: string;
	email: string;
	role: string;
	type: "access" | "refresh";
	iat?: number;
	exp?: number;
}

interface User {
	id: string;
	email: string;
	role: string;
}

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
	// Add padding if needed
	str += "=".repeat((4 - (str.length % 4)) % 4);
	// Replace URL-safe characters
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	return atob(str);
}

/**
 * Create JWT using Web Crypto API (compatible with Cloudflare Workers)
 */
async function createJWT(payload: JWTPayload, secret: string, expiresIn: number): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const fullPayload = {
		...payload,
		iat: now,
		exp: now + expiresIn,
	};

	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

	const message = `${encodedHeader}.${encodedPayload}`;

	// Create signature using Web Crypto API
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));

	const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

	return `${message}.${encodedSignature}`;
}

/**
 * Verify JWT using Web Crypto API (compatible with Cloudflare Workers)
 */
async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
	const parts = token.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid token format");
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const message = `${encodedHeader}.${encodedPayload}`;

	// Verify signature
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	);

	const signature = Uint8Array.from(base64UrlDecode(encodedSignature), (c) => c.charCodeAt(0));

	const isValid = await crypto.subtle.verify(
		"HMAC",
		key,
		signature,
		new TextEncoder().encode(message)
	);

	if (!isValid) {
		throw new Error("Invalid signature");
	}

	// Parse payload
	const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

	// Check expiration
	if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
		throw new Error("Token expired");
	}

	return payload;
}

/**
 * Generate access and refresh tokens for a user
 */
export async function generateTokens(
	user: User,
	env: Env
): Promise<{
	accessToken: string;
	refreshToken: string;
}> {
	// Generate access token
	const accessPayload: JWTPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		type: "access",
	};

	const accessToken = await createJWT(accessPayload, env.JWT_SECRET, ACCESS_TOKEN_EXPIRY);

	// Generate refresh token
	const refreshPayload: JWTPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		type: "refresh",
	};

	const refreshToken = await createJWT(
		refreshPayload,
		env.JWT_REFRESH_SECRET,
		REFRESH_TOKEN_EXPIRY
	);

	// Store refresh token in KV
	const refreshKey = `refresh_token:${user.id}:${Date.now()}`;
	await env.AUTH_KV.put(
		refreshKey,
		JSON.stringify({
			userId: user.id,
			email: user.email,
			role: user.role,
			tokenId: refreshKey,
		}),
		{
			expirationTtl: REFRESH_TOKEN_EXPIRY,
		}
	);

	return {
		accessToken,
		refreshToken,
	};
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
	try {
		const payload = await verifyJWT(token, secret);
		return payload;
	} catch (_error) {
		throw new Error("Invalid token");
	}
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string, env: Env): Promise<string> {
	try {
		// Verify refresh token
		const payload = await verifyToken(refreshToken, env.JWT_REFRESH_SECRET);

		if (payload.type !== "refresh") {
			throw new Error("Invalid token type");
		}

		// Check if refresh token exists in KV
		const refreshKey = `refresh_token:${payload.userId}`;
		const storedData = await env.AUTH_KV.get(refreshKey);

		if (!storedData) {
			throw new Error("Refresh token not found or expired");
		}

		const user = JSON.parse(storedData);

		// Generate new access token
		const newAccessPayload: JWTPayload = {
			userId: user.userId,
			email: user.email,
			role: user.role,
			type: "access",
		};

		const newAccessToken = await createJWT(newAccessPayload, env.JWT_SECRET, ACCESS_TOKEN_EXPIRY);

		return newAccessToken;
	} catch (_error) {
		throw new Error("Failed to refresh token");
	}
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(userId: string, env: Env): Promise<void> {
	// Find and delete all refresh tokens for user
	// Note: This is a simplified implementation
	// In production, you might want to use a pattern-based deletion
	const refreshKey = `refresh_token:${userId}`;
	await env.AUTH_KV.delete(refreshKey);
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.substring(7);
}

/**
 * Create secure cookie options
 */
export function getSecureCookieOptions() {
	return {
		httpOnly: true,
		secure: true,
		sameSite: "strict" as const,
		maxAge: ACCESS_TOKEN_EXPIRY,
	};
}
