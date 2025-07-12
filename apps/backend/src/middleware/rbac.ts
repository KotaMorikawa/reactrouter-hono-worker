import type { Context, Next } from "hono";
import type { Env } from "../index";
import { requireAuth, requirePermission, requireRole } from "./auth";

/**
 * Permission decorator helper functions for common permission patterns
 */

/**
 * Require admin role
 */
export function requireAdmin() {
	return requireRole("admin");
}

/**
 * Require editor role or higher
 */
export function requireEditor() {
	return requireRole("editor");
}

/**
 * Require viewer role or higher
 */
export function requireViewer() {
	return requireRole("viewer");
}

/**
 * User management permissions
 */
export function requireUserCreate() {
	return requirePermission("users", "create");
}

export function requireUserRead() {
	return requirePermission("users", "read");
}

export function requireUserUpdate() {
	return requirePermission("users", "update");
}

export function requireUserDelete() {
	return requirePermission("users", "delete");
}

/**
 * Post management permissions
 */
export function requirePostCreate() {
	return requirePermission("posts", "create");
}

export function requirePostRead() {
	return requirePermission("posts", "read");
}

export function requirePostUpdate() {
	return requirePermission("posts", "update");
}

export function requirePostDelete() {
	return requirePermission("posts", "delete");
}

/**
 * Role management permissions (admin only)
 */
export function requireRoleManagement() {
	return requirePermission("roles", "manage");
}

/**
 * Permission management permissions (admin only)
 */
export function requirePermissionManagement() {
	return requirePermission("permissions", "manage");
}

/**
 * Combine multiple middleware functions
 */
export function combine(
	...middlewares: Array<
		(c: Context<{ Bindings: Env }>, next: Next) => Promise<undefined | Response>
	>
) {
	return async (c: Context<{ Bindings: Env }>, next: Next): Promise<undefined | Response> => {
		// Execute middlewares in sequence
		for (const middleware of middlewares) {
			const result = await middleware(c, async () => {});
			if (result) {
				return result; // If middleware returns a response, stop and return it
			}
		}
		await next();
	};
}

/**
 * Common permission combinations
 */

/**
 * Admin-only access
 */
export function adminOnly() {
	return combine(requireAuth, requireAdmin());
}

/**
 * Editor or higher access
 */
export function editorAccess() {
	return combine(requireAuth, requireEditor());
}

/**
 * Viewer or higher access (authenticated users)
 */
export function viewerAccess() {
	return combine(requireAuth, requireViewer());
}

/**
 * User management access (admin only)
 */
export function userManagementAccess() {
	return combine(requireAuth, requireUserRead());
}

/**
 * Content creation access (editor+)
 */
export function contentCreationAccess() {
	return combine(requireAuth, requirePostCreate());
}

/**
 * Content viewing access (viewer+)
 */
export function contentViewAccess() {
	return combine(requireAuth, requirePostRead());
}

/**
 * Role and permission management access (admin only)
 */
export function rbacManagementAccess() {
	return combine(requireAuth, requireAdmin());
}
