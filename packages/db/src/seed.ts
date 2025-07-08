import type { Database } from "./connection";
import { permissions, rolePermissions, roles, userRoles, users } from "./schema";

export async function seedDatabase(db: Database) {
	// Create default roles
	const defaultRoles = [
		{
			id: crypto.randomUUID(),
			name: "admin",
			description: "Administrator with full access",
		},
		{
			id: crypto.randomUUID(),
			name: "editor",
			description: "Editor with content management access",
		},
		{
			id: crypto.randomUUID(),
			name: "viewer",
			description: "Viewer with read-only access",
		},
		{
			id: crypto.randomUUID(),
			name: "guest",
			description: "Guest with limited access",
		},
	];

	const insertedRoles = await db.insert(roles).values(defaultRoles).returning();

	// Create default permissions
	const defaultPermissions = [
		{
			id: crypto.randomUUID(),
			name: "users.create",
			description: "Create new users",
		},
		{
			id: crypto.randomUUID(),
			name: "users.read",
			description: "Read user information",
		},
		{
			id: crypto.randomUUID(),
			name: "users.update",
			description: "Update user information",
		},
		{
			id: crypto.randomUUID(),
			name: "users.delete",
			description: "Delete users",
		},
		{
			id: crypto.randomUUID(),
			name: "posts.create",
			description: "Create new posts",
		},
		{
			id: crypto.randomUUID(),
			name: "posts.read",
			description: "Read posts",
		},
		{
			id: crypto.randomUUID(),
			name: "posts.update",
			description: "Update posts",
		},
		{
			id: crypto.randomUUID(),
			name: "posts.delete",
			description: "Delete posts",
		},
	];

	const insertedPermissions = await db.insert(permissions).values(defaultPermissions).returning();

	// Assign permissions to roles
	const adminRole = insertedRoles.find((r) => r.name === "admin");
	if (!adminRole) throw new Error("Admin role not found");
	const editorRole = insertedRoles.find((r) => r.name === "editor");
	if (!editorRole) throw new Error("Editor role not found");
	const viewerRole = insertedRoles.find((r) => r.name === "viewer");
	if (!viewerRole) throw new Error("Viewer role not found");
	const guestRole = insertedRoles.find((r) => r.name === "guest");
	if (!guestRole) throw new Error("Guest role not found");

	// Admin gets all permissions
	const adminPermissions = insertedPermissions.map((p) => ({
		roleId: adminRole.id,
		permissionId: p.id,
	}));

	// Editor gets post management and user read permissions
	const editorPermissions = insertedPermissions
		.filter((p) => p.name.startsWith("posts.") || p.name === "users.read")
		.map((p) => ({
			roleId: editorRole.id,
			permissionId: p.id,
		}));

	// Viewer gets read-only permissions
	const viewerPermissions = insertedPermissions
		.filter((p) => p.name.endsWith(".read"))
		.map((p) => ({
			roleId: viewerRole.id,
			permissionId: p.id,
		}));

	// Guest gets minimal read permissions
	const guestPermissions = insertedPermissions
		.filter((p) => p.name === "posts.read")
		.map((p) => ({
			roleId: guestRole.id,
			permissionId: p.id,
		}));

	await db
		.insert(rolePermissions)
		.values([...adminPermissions, ...editorPermissions, ...viewerPermissions, ...guestPermissions]);

	// Create default admin user
	const adminUser = await db
		.insert(users)
		.values({
			id: crypto.randomUUID(),
			email: "admin@example.com",
			passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$placeholder", // This should be properly hashed
			name: "Admin User",
			emailVerified: true,
		})
		.returning();

	// Assign admin role to admin user
	await db.insert(userRoles).values({
		userId: adminUser[0].id,
		roleId: adminRole.id,
	});

	console.log("Database seeded successfully!");
	console.log("Default admin user created: admin@example.com");
	console.log("Remember to update the password hash with a proper value");
}

export async function clearDatabase(db: Database) {
	await db.delete(rolePermissions);
	await db.delete(userRoles);
	await db.delete(permissions);
	await db.delete(roles);
	await db.delete(users);

	console.log("Database cleared successfully!");
}
