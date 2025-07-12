import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../index";
import { checkPermission, getUserPermissions, getUserRoles } from "./permission.service";

// モック設定
vi.mock("@repo/db", () => ({
	createDatabaseConnection: vi.fn(),
	eq: vi.fn(),
	and: vi.fn(),
	userRoles: { userId: "userId", roleId: "roleId" },
	rolePermissions: { roleId: "roleId", permissionId: "permissionId" },
	permissions: { id: "id", name: "name", description: "description" },
	roles: { id: "id", name: "name", description: "description" },
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
	and: vi.fn(),
}));

describe("PermissionService", () => {
	const mockEnv: Env = {
		JWT_SECRET: "test-secret",
		JWT_REFRESH_SECRET: "test-refresh-secret",
		DATABASE_URL: "postgresql://test",
		AUTH_KV: {} as KVNamespace,
		RATE_LIMIT_KV: {} as KVNamespace,
		ENVIRONMENT: "test",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("checkPermission", () => {
		it("管理者ユーザーは全ての権限を持つ", async () => {
			// Arrange
			const userId = "admin-user-id";
			const resource = "posts";
			const action = "delete";

			// Admin roleを持つユーザーの場合をモック
			const mockDbQuery = vi.fn().mockResolvedValue([{ role: { name: "admin" } }]);

			const { createDatabaseConnection } = await import("@repo/db");
			vi.mocked(createDatabaseConnection).mockReturnValue({
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: mockDbQuery,
						}),
					}),
				}),
			} as unknown as ReturnType<typeof createDatabaseConnection>);

			// Act
			const result = await checkPermission(mockEnv, userId, resource, action);

			// Assert
			expect(result).toBe(true);
		});

		it("権限を持たないユーザーはアクションを実行できない", async () => {
			// Arrange
			const userId = "guest-user-id";
			const resource = "posts";
			const action = "delete";

			// 権限なしの場合をモック
			const mockDbQuery = vi.fn().mockResolvedValue([]);

			const { createDatabaseConnection } = await import("@repo/db");
			vi.mocked(createDatabaseConnection).mockReturnValue({
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: mockDbQuery,
						}),
					}),
				}),
			} as unknown as ReturnType<typeof createDatabaseConnection>);

			// Act
			const result = await checkPermission(mockEnv, userId, resource, action);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("getUserRoles", () => {
		it("ユーザーの全ロールを取得できる", async () => {
			// Arrange
			const userId = "test-user-id";
			const expectedRoles = [{ id: "1", name: "editor", description: "Content editor" }];

			const mockDbQuery = vi.fn().mockResolvedValue(expectedRoles.map((role) => ({ role })));

			const { createDatabaseConnection } = await import("@repo/db");
			vi.mocked(createDatabaseConnection).mockReturnValue({
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							where: mockDbQuery,
						}),
					}),
				}),
			} as unknown as ReturnType<typeof createDatabaseConnection>);

			// Act
			const result = await getUserRoles(mockEnv, userId);

			// Assert
			expect(result).toEqual(expectedRoles);
		});
	});

	describe("getUserPermissions", () => {
		it("ユーザーの全権限を取得できる", async () => {
			// Arrange
			const userId = "test-user-id";
			const expectedPermissions = [{ id: "1", name: "posts.create", description: "Create posts" }];

			const mockDbQuery = vi
				.fn()
				.mockResolvedValue(expectedPermissions.map((permission) => ({ permission })));

			const { createDatabaseConnection } = await import("@repo/db");
			vi.mocked(createDatabaseConnection).mockReturnValue({
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						leftJoin: vi.fn().mockReturnValue({
							leftJoin: vi.fn().mockReturnValue({
								leftJoin: vi.fn().mockReturnValue({
									where: mockDbQuery,
								}),
							}),
						}),
					}),
				}),
			} as unknown as ReturnType<typeof createDatabaseConnection>);

			// Act
			const result = await getUserPermissions(mockEnv, userId);

			// Assert
			expect(result).toEqual(expectedPermissions);
		});
	});
});
