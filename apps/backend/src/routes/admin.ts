import { Hono } from "hono";
import type { Env } from "../index";
import { authMiddleware, getCurrentUserId } from "../middleware/auth";
import { adminOnly, rbacManagementAccess } from "../middleware/rbac";
import { getUserPermissions, getUserRoles } from "../services/permission.service";

const adminRouter = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all admin routes
adminRouter.use("*", authMiddleware);

// Mock data for development
const mockUsers = [
	{
		id: "user-1",
		email: "admin@example.com",
		name: "Admin User",
		emailVerified: true,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	},
	{
		id: "user-2",
		email: "editor@example.com",
		name: "Editor User",
		emailVerified: true,
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
	},
	{
		id: "user-3",
		email: "viewer@example.com",
		name: "Viewer User",
		emailVerified: false,
		createdAt: new Date("2024-01-03"),
		updatedAt: new Date("2024-01-03"),
	},
];

const mockRoles = [
	{
		id: "role-1",
		name: "admin",
		description: "Administrator with full access",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "role-2",
		name: "editor",
		description: "Content editor with create/update permissions",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "role-3",
		name: "viewer",
		description: "Read-only access",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "role-4",
		name: "guest",
		description: "Limited guest access",
		createdAt: new Date("2024-01-01"),
	},
];

const mockPermissions = [
	{
		id: "perm-1",
		name: "users.create",
		description: "Create new users",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-2",
		name: "users.read",
		description: "View user information",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-3",
		name: "users.update",
		description: "Update user information",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-4",
		name: "users.delete",
		description: "Delete users",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-5",
		name: "posts.create",
		description: "Create new posts",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-6",
		name: "posts.read",
		description: "View posts",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-7",
		name: "posts.update",
		description: "Update posts",
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "perm-8",
		name: "posts.delete",
		description: "Delete posts",
		createdAt: new Date("2024-01-01"),
	},
];

// Mock user-role assignments
const mockUserRoles = new Map([
	["user-1", ["role-1"]], // admin
	["user-2", ["role-2"]], // editor
	["user-3", ["role-3"]], // viewer
]);

// Mock role-permission assignments
const mockRolePermissions = new Map([
	["role-1", ["perm-1", "perm-2", "perm-3", "perm-4", "perm-5", "perm-6", "perm-7", "perm-8"]], // admin: all
	["role-2", ["perm-2", "perm-5", "perm-6", "perm-7"]], // editor: user read + posts CRUD
	["role-3", ["perm-6"]], // viewer: posts read only
	["role-4", []], // guest: no permissions
]);

/**
 * User Management Endpoints
 */

// Get all users (admin only)
adminRouter.get("/users", adminOnly(), async (c) => {
	try {
		return c.json({ users: mockUsers });
	} catch (error) {
		console.error("Failed to get users:", error);
		return c.json({ error: "Failed to retrieve users" }, 500);
	}
});

// Get user by ID (admin only)
adminRouter.get("/users/:id", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");
		const user = mockUsers.find((u) => u.id === userId);

		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}

		return c.json({ user });
	} catch (error) {
		console.error("Failed to get user:", error);
		return c.json({ error: "Failed to retrieve user" }, 500);
	}
});

// Update user (admin only)
adminRouter.put("/users/:id", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");
		const body = await c.req.json();
		const { name, emailVerified } = body;

		const userIndex = mockUsers.findIndex((u) => u.id === userId);

		if (userIndex === -1) {
			return c.json({ error: "User not found" }, 404);
		}

		// Update user
		if (name) mockUsers[userIndex].name = name;
		if (typeof emailVerified === "boolean") mockUsers[userIndex].emailVerified = emailVerified;
		mockUsers[userIndex].updatedAt = new Date();

		return c.json({
			message: "User updated successfully",
			user: mockUsers[userIndex],
		});
	} catch (error) {
		console.error("Failed to update user:", error);
		return c.json({ error: "Failed to update user" }, 500);
	}
});

// Delete user (admin only)
adminRouter.delete("/users/:id", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");
		const currentUserId = getCurrentUserId(c);

		// Prevent admin from deleting themselves
		if (userId === currentUserId) {
			return c.json({ error: "Cannot delete your own account" }, 400);
		}

		const userIndex = mockUsers.findIndex((u) => u.id === userId);

		if (userIndex === -1) {
			return c.json({ error: "User not found" }, 404);
		}

		// Delete user and their role assignments
		mockUsers.splice(userIndex, 1);
		mockUserRoles.delete(userId);

		return c.json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Failed to delete user:", error);
		return c.json({ error: "Failed to delete user" }, 500);
	}
});

/**
 * Role Management Endpoints
 */

// Get all roles (admin only)
adminRouter.get("/roles", rbacManagementAccess(), async (c) => {
	try {
		return c.json({ roles: mockRoles });
	} catch (error) {
		console.error("Failed to get roles:", error);
		return c.json({ error: "Failed to retrieve roles" }, 500);
	}
});

// Create new role (admin only)
adminRouter.post("/roles", rbacManagementAccess(), async (c) => {
	try {
		const body = await c.req.json();
		const { name, description } = body;

		if (!name) {
			return c.json({ error: "Role name is required" }, 400);
		}

		// Check if role already exists
		if (mockRoles.find((r) => r.name === name)) {
			return c.json({ error: "Role already exists" }, 400);
		}

		// Create new role
		const newRole = {
			id: `role-${Date.now()}`,
			name,
			description: description || "",
			createdAt: new Date(),
		};

		mockRoles.push(newRole);
		mockRolePermissions.set(newRole.id, []); // Start with no permissions

		return c.json({
			message: "Role created successfully",
			role: newRole,
		});
	} catch (error) {
		console.error("Failed to create role:", error);
		return c.json({ error: "Failed to create role" }, 500);
	}
});

// Update role (admin only)
adminRouter.put("/roles/:id", rbacManagementAccess(), async (c) => {
	try {
		const roleId = c.req.param("id");
		const body = await c.req.json();
		const { name, description } = body;

		const roleIndex = mockRoles.findIndex((r) => r.id === roleId);

		if (roleIndex === -1) {
			return c.json({ error: "Role not found" }, 404);
		}

		// Prevent modifying system roles
		if (["admin", "editor", "viewer", "guest"].includes(mockRoles[roleIndex].name)) {
			return c.json({ error: "Cannot modify system roles" }, 400);
		}

		// Update role
		if (name) mockRoles[roleIndex].name = name;
		if (description !== undefined) mockRoles[roleIndex].description = description;

		return c.json({
			message: "Role updated successfully",
			role: mockRoles[roleIndex],
		});
	} catch (error) {
		console.error("Failed to update role:", error);
		return c.json({ error: "Failed to update role" }, 500);
	}
});

// Delete role (admin only)
adminRouter.delete("/roles/:id", rbacManagementAccess(), async (c) => {
	try {
		const roleId = c.req.param("id");
		const roleIndex = mockRoles.findIndex((r) => r.id === roleId);

		if (roleIndex === -1) {
			return c.json({ error: "Role not found" }, 404);
		}

		// Prevent deleting system roles
		if (["admin", "editor", "viewer", "guest"].includes(mockRoles[roleIndex].name)) {
			return c.json({ error: "Cannot delete system roles" }, 400);
		}

		// Delete role and clean up assignments
		mockRoles.splice(roleIndex, 1);
		mockRolePermissions.delete(roleId);

		// Remove role from user assignments
		for (const [userId, roleIds] of mockUserRoles) {
			const filteredRoles = roleIds.filter((id) => id !== roleId);
			if (filteredRoles.length !== roleIds.length) {
				mockUserRoles.set(userId, filteredRoles);
			}
		}

		return c.json({ message: "Role deleted successfully" });
	} catch (error) {
		console.error("Failed to delete role:", error);
		return c.json({ error: "Failed to delete role" }, 500);
	}
});

/**
 * User-Role Assignment Endpoints
 */

// Get user roles (admin only)
adminRouter.get("/users/:id/roles", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");

		// Check if user exists
		if (!mockUsers.find((u) => u.id === userId)) {
			return c.json({ error: "User not found" }, 404);
		}

		const userRoleIds = mockUserRoles.get(userId) || [];
		const userRolesList = userRoleIds
			.map((roleId) => mockRoles.find((r) => r.id === roleId))
			.filter(Boolean);

		return c.json({ roles: userRolesList });
	} catch (error) {
		console.error("Failed to get user roles:", error);
		return c.json({ error: "Failed to retrieve user roles" }, 500);
	}
});

// Assign role to user (admin only)
adminRouter.post("/users/:id/roles", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");
		const body = await c.req.json();
		const { roleId } = body;

		if (!roleId) {
			return c.json({ error: "Role ID is required" }, 400);
		}

		// Check if user exists
		if (!mockUsers.find((u) => u.id === userId)) {
			return c.json({ error: "User not found" }, 404);
		}

		// Check if role exists
		if (!mockRoles.find((r) => r.id === roleId)) {
			return c.json({ error: "Role not found" }, 404);
		}

		// Check if assignment already exists
		const userRoleIds = mockUserRoles.get(userId) || [];
		if (userRoleIds.includes(roleId)) {
			return c.json({ error: "User already has this role" }, 400);
		}

		// Assign role to user
		mockUserRoles.set(userId, [...userRoleIds, roleId]);

		return c.json({ message: "Role assigned successfully" });
	} catch (error) {
		console.error("Failed to assign role:", error);
		return c.json({ error: "Failed to assign role" }, 500);
	}
});

// Remove role from user (admin only)
adminRouter.delete("/users/:id/roles/:roleId", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");
		const roleId = c.req.param("roleId");
		const currentUserId = getCurrentUserId(c);

		// Prevent admin from removing their own admin role
		if (userId === currentUserId) {
			const role = mockRoles.find((r) => r.id === roleId);
			if (role?.name === "admin") {
				return c.json({ error: "Cannot remove admin role from yourself" }, 400);
			}
		}

		// Check if assignment exists
		const userRoleIds = mockUserRoles.get(userId) || [];
		if (!userRoleIds.includes(roleId)) {
			return c.json({ error: "User does not have this role" }, 404);
		}

		// Remove role from user
		const filteredRoles = userRoleIds.filter((id) => id !== roleId);
		mockUserRoles.set(userId, filteredRoles);

		return c.json({ message: "Role removed successfully" });
	} catch (error) {
		console.error("Failed to remove role:", error);
		return c.json({ error: "Failed to remove role" }, 500);
	}
});

/**
 * Permission Management Endpoints
 */

// Get all permissions (admin only)
adminRouter.get("/permissions", rbacManagementAccess(), async (c) => {
	try {
		return c.json({ permissions: mockPermissions });
	} catch (error) {
		console.error("Failed to get permissions:", error);
		return c.json({ error: "Failed to retrieve permissions" }, 500);
	}
});

// Get role permissions (admin only)
adminRouter.get("/roles/:id/permissions", rbacManagementAccess(), async (c) => {
	try {
		const roleId = c.req.param("id");

		// Check if role exists
		if (!mockRoles.find((r) => r.id === roleId)) {
			return c.json({ error: "Role not found" }, 404);
		}

		const rolePermissionIds = mockRolePermissions.get(roleId) || [];
		const rolePermissionsList = rolePermissionIds
			.map((permId) => mockPermissions.find((p) => p.id === permId))
			.filter(Boolean);

		return c.json({ permissions: rolePermissionsList });
	} catch (error) {
		console.error("Failed to get role permissions:", error);
		return c.json({ error: "Failed to retrieve role permissions" }, 500);
	}
});

// Assign permission to role (admin only)
adminRouter.post("/roles/:id/permissions", rbacManagementAccess(), async (c) => {
	try {
		const roleId = c.req.param("id");
		const body = await c.req.json();
		const { permissionId } = body;

		if (!permissionId) {
			return c.json({ error: "Permission ID is required" }, 400);
		}

		// Check if role exists
		if (!mockRoles.find((r) => r.id === roleId)) {
			return c.json({ error: "Role not found" }, 404);
		}

		// Check if permission exists
		if (!mockPermissions.find((p) => p.id === permissionId)) {
			return c.json({ error: "Permission not found" }, 404);
		}

		// Check if assignment already exists
		const rolePermissionIds = mockRolePermissions.get(roleId) || [];
		if (rolePermissionIds.includes(permissionId)) {
			return c.json({ error: "Role already has this permission" }, 400);
		}

		// Assign permission to role
		mockRolePermissions.set(roleId, [...rolePermissionIds, permissionId]);

		return c.json({ message: "Permission assigned successfully" });
	} catch (error) {
		console.error("Failed to assign permission:", error);
		return c.json({ error: "Failed to assign permission" }, 500);
	}
});

// Remove permission from role (admin only)
adminRouter.delete("/roles/:id/permissions/:permissionId", rbacManagementAccess(), async (c) => {
	try {
		const roleId = c.req.param("id");
		const permissionId = c.req.param("permissionId");

		// Check if assignment exists
		const rolePermissionIds = mockRolePermissions.get(roleId) || [];
		if (!rolePermissionIds.includes(permissionId)) {
			return c.json({ error: "Role does not have this permission" }, 404);
		}

		// Remove permission from role
		const filteredPermissions = rolePermissionIds.filter((id) => id !== permissionId);
		mockRolePermissions.set(roleId, filteredPermissions);

		return c.json({ message: "Permission removed successfully" });
	} catch (error) {
		console.error("Failed to remove permission:", error);
		return c.json({ error: "Failed to remove permission" }, 500);
	}
});

/**
 * User Permission and Role Information Endpoints
 */

// Get user permissions via RBAC service (admin only)
adminRouter.get("/users/:id/permissions", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");

		// Check if user exists
		if (!mockUsers.find((u) => u.id === userId)) {
			return c.json({ error: "User not found" }, 404);
		}

		const userPermissions = await getUserPermissions(c.env, userId);
		return c.json({ permissions: userPermissions });
	} catch (error) {
		console.error("Failed to get user permissions:", error);
		return c.json({ error: "Failed to retrieve user permissions" }, 500);
	}
});

// Get user roles via RBAC service (admin only)
adminRouter.get("/users/:id/roles-service", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("id");

		// Check if user exists
		if (!mockUsers.find((u) => u.id === userId)) {
			return c.json({ error: "User not found" }, 404);
		}

		const userRoles = await getUserRoles(c.env, userId);
		return c.json({ roles: userRoles });
	} catch (error) {
		console.error("Failed to get user roles:", error);
		return c.json({ error: "Failed to retrieve user roles via service" }, 500);
	}
});

export default adminRouter;
