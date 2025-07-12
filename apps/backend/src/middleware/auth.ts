import type { Context, Next } from "hono";
import type { Env } from "../index";
import { extractBearerToken, verifyToken } from "../lib/auth";
import { checkPermission } from "../services/permission.service";

// Types for authenticated user
export interface AuthenticatedUser {
	id: string;
	email: string;
	role: string;
}

// Extend Hono context with user information
declare module "hono" {
	interface ContextVariableMap {
		user?: AuthenticatedUser;
	}
}

/**
 * Authentication middleware that optionally sets user context
 * Does not reject requests without authentication
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<void> {
	const authHeader = c.req.header("Authorization");
	const token = extractBearerToken(authHeader);

	if (token) {
		try {
			const env = c.env;
			const payload = await verifyToken(token, env.JWT_SECRET);

			// Only set user context for access tokens
			if (payload.type === "access") {
				c.set("user", {
					id: payload.userId,
					email: payload.email,
					role: payload.role,
				});
			}
		} catch (_error) {
			// Invalid token - continue without user context
			// We don't throw an error here because this middleware is optional
		}
	}

	await next();
}

/**
 * Require authentication middleware
 * Rejects requests without valid authentication
 */
export async function requireAuth(
	c: Context<{ Bindings: Env }>,
	next: Next
): Promise<undefined | Response> {
	const user = c.get("user");

	if (!user) {
		return c.json({ error: "Authentication required" }, 401);
	}

	await next();
}

/**
 * Require specific role middleware
 * Rejects requests without required role
 */
export function requireRole(requiredRole: string) {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Authentication required" }, 401);
		}

		// Check if user has required role
		// Role hierarchy: admin > editor > viewer > guest
		const roleHierarchy = ["guest", "viewer", "editor", "admin"];
		const userRoleIndex = roleHierarchy.indexOf(user.role);
		const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

		if (userRoleIndex < requiredRoleIndex) {
			return c.json({ error: "Insufficient permissions" }, 403);
		}

		await next();
	};
}

/**
 * Require specific permission middleware
 * Rejects requests without required permission
 */
export function requirePermission(resource: string, action: string) {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "Authentication required" }, 401);
		}

		// Check if user has required permission using database
		const env = c.env;
		const hasPermission = await checkPermission(env, user.id, resource, action);

		if (!hasPermission) {
			return c.json({ error: "Insufficient permissions" }, 403);
		}

		await next();
	};
}

/**
 * Extract user ID from context
 */
export function getCurrentUserId(c: Context<{ Bindings: Env }>): string | null {
	const user = c.get("user");
	return user ? user.id : null;
}

/**
 * Extract user from context
 */
export function getCurrentUser(c: Context<{ Bindings: Env }>): AuthenticatedUser | null {
	return c.get("user") || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(c: Context<{ Bindings: Env }>): boolean {
	return !!c.get("user");
}

/**
 * Check if user has specific role
 */
export function hasRole(c: Context<{ Bindings: Env }>, role: string): boolean {
	const user = c.get("user");
	return user ? user.role === role : false;
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(c: Context<{ Bindings: Env }>, minimumRole: string): boolean {
	const user = c.get("user");

	if (!user) return false;

	const roleHierarchy = ["guest", "viewer", "editor", "admin"];
	const userRoleIndex = roleHierarchy.indexOf(user.role);
	const minimumRoleIndex = roleHierarchy.indexOf(minimumRole);

	return userRoleIndex >= minimumRoleIndex;
}
