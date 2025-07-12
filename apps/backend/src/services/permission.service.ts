import { createDatabaseConnection, permissions, rolePermissions, roles, userRoles } from "@repo/db";
import { and, eq } from "drizzle-orm";
import type { Env } from "../index";

/**
 * ユーザーが特定のリソースに対するアクションの権限を持っているかチェック
 */
export async function checkPermission(
	env: Env,
	userId: string,
	resource: string,
	action: string
): Promise<boolean> {
	try {
		const db = createDatabaseConnection(env.DATABASE_URL);

		// まず管理者権限をチェック（管理者は全権限を持つ）
		const adminCheck = await db
			.select({ role: { name: roles.name } })
			.from(userRoles)
			.leftJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, userId));

		// 管理者の場合は常にtrue
		if (adminCheck.some((row) => row.role?.name === "admin")) {
			return true;
		}

		// 特定の権限をチェック
		const permissionName = `${resource}.${action}`;
		try {
			const permissionCheck = await db
				.select({ permission: { name: permissions.name } })
				.from(userRoles)
				.leftJoin(roles, eq(userRoles.roleId, roles.id))
				.leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
				.leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
				.where(and(eq(userRoles.userId, userId), eq(permissions.name, permissionName)));

			return permissionCheck.length > 0;
		} catch (permissionError) {
			console.error("Specific permission check failed:", permissionError);
			return false;
		}
	} catch (error) {
		console.error("Permission check failed:", error);
		return false;
	}
}

/**
 * ユーザーの全ロールを取得
 */
export async function getUserRoles(env: Env, userId: string) {
	try {
		const db = createDatabaseConnection(env.DATABASE_URL);

		const userRolesList = await db
			.select({
				role: {
					id: roles.id,
					name: roles.name,
					description: roles.description,
				},
			})
			.from(userRoles)
			.leftJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, userId));

		return userRolesList.map((row) => row.role).filter(Boolean);
	} catch (error) {
		console.error("Failed to get user roles:", error);
		return [];
	}
}

/**
 * ユーザーの全権限を取得
 */
export async function getUserPermissions(env: Env, userId: string) {
	try {
		const db = createDatabaseConnection(env.DATABASE_URL);

		const userPermissionsList = await db
			.select({
				permission: {
					id: permissions.id,
					name: permissions.name,
					description: permissions.description,
				},
			})
			.from(userRoles)
			.leftJoin(roles, eq(userRoles.roleId, roles.id))
			.leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
			.leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
			.where(eq(userRoles.userId, userId));

		// 重複を除去
		const uniquePermissions = userPermissionsList
			.map((row) => row.permission)
			.filter(Boolean)
			.filter(
				(permission, index, self) =>
					index === self.findIndex((p) => p && permission && p.id === permission.id)
			);

		return uniquePermissions;
	} catch (error) {
		console.error("Failed to get user permissions:", error);
		return [];
	}
}
