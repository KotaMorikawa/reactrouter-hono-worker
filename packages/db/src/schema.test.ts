import { describe, expect, it } from "vitest";
import { permissions, rolePermissions, roles, sessions, userRoles, users } from "./schema";

describe("Schema", () => {
	it("should export users table", () => {
		expect(users).toBeDefined();
		expect(typeof users).toBe("object");
	});

	it("should export sessions table", () => {
		expect(sessions).toBeDefined();
		expect(typeof sessions).toBe("object");
	});

	it("should export roles table", () => {
		expect(roles).toBeDefined();
		expect(typeof roles).toBe("object");
	});

	it("should export permissions table", () => {
		expect(permissions).toBeDefined();
		expect(typeof permissions).toBe("object");
	});

	it("should export userRoles junction table", () => {
		expect(userRoles).toBeDefined();
		expect(typeof userRoles).toBe("object");
	});

	it("should export rolePermissions junction table", () => {
		expect(rolePermissions).toBeDefined();
		expect(typeof rolePermissions).toBe("object");
	});
});
