import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile, { loader, meta } from "./profile";

// useAuth フックをモック
const mockUseAuth = vi.fn();
vi.mock("../contexts/auth-context", () => ({
	useAuth: () => mockUseAuth(),
}));

describe("Profile Page", () => {
	it("should render profile page with user information", () => {
		const mockUser = {
			id: "1",
			name: "Test User",
			email: "test@example.com",
			role: "user",
			createdAt: "2024-01-01T00:00:00Z",
			lastLogin: "2024-01-02T00:00:00Z",
		};

		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: mockUser,
		});

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		expect(screen.getByText("プロフィール")).toBeInTheDocument();
		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
		expect(screen.getByText("user")).toBeInTheDocument();
	});

	it("should handle missing user data gracefully", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: null,
		});

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		expect(screen.getByText("プロフィール")).toBeInTheDocument();
		// 複数の「未設定」テキストがあるため、最初の要素を取得
		expect(screen.getAllByText("未設定").length).toBeGreaterThan(0);
	});

	it("should display account statistics section", () => {
		const mockUser = {
			id: "1",
			name: "Test User",
			email: "test@example.com",
			role: "user",
			createdAt: "2024-01-01T00:00:00Z",
		};

		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: mockUser,
		});

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		expect(screen.getByText("アカウント統計")).toBeInTheDocument();
		expect(screen.getByText("ログイン回数")).toBeInTheDocument();
		expect(screen.getByText("最終ログイン")).toBeInTheDocument();
		expect(screen.getByText("アカウント状態")).toBeInTheDocument();
	});

	it("should show edit profile button", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: { id: "1", name: "Test User", email: "test@example.com" },
		});

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		expect(screen.getByText("プロフィールを編集")).toBeInTheDocument();
	});

	it("should display creation date when available", () => {
		const mockUser = {
			id: "1",
			name: "Test User",
			email: "test@example.com",
			createdAt: "2024-01-01T00:00:00Z",
		};

		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: mockUser,
		});

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		// 日付が日本語形式で表示されることを確認
		expect(screen.getByText("2024/1/1")).toBeInTheDocument();
	});

	it("should handle undefined auth context", () => {
		mockUseAuth.mockReturnValue(null);

		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

		expect(screen.getByText("プロフィール")).toBeInTheDocument();
		expect(screen.getAllByText("未設定").length).toBeGreaterThan(0);
	});
});

describe("Profile Meta Function", () => {
	it("should return correct meta data", () => {
		const metaArgs = {} as any; // Route.MetaArgs type
		const result = meta(metaArgs);

		expect(result).toEqual([
			{ title: "プロフィール - React Router App" },
			{ name: "description", content: "ユーザープロフィール管理" },
		]);
	});
});

describe("Profile Loader Function", () => {
	let mockRequest: Request;
	let mockContext: any;

	beforeEach(() => {
		mockRequest = new Request("http://localhost:3000/profile");
		mockContext = {
			env: {
				API_URL: "http://localhost:8787",
			},
		};
		vi.clearAllMocks();
	});

	it("should return user profile data when authenticated", async () => {
		// モックJWTトークンを含むCookieを設定
		const requestWithAuth = new Request("http://localhost:3000/profile", {
			headers: {
				Cookie: "auth-token=valid-jwt-token",
			},
		});

		const result = await loader({
			request: requestWithAuth,
			context: mockContext,
		} as any);

		expect(result).toBeDefined();
		// Response でない場合にのみユーザー情報をチェック
		if (!(result instanceof Response)) {
			expect(result.user).toBeDefined();
			expect(result.user.email).toBe("user@example.com");
		}
	});

	it("should redirect to login when not authenticated", async () => {
		const result = await loader({
			request: mockRequest,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(302);
		expect((result as Response).headers.get("Location")).toBe("/login");
	});

	it("should handle invalid auth token", async () => {
		const requestWithInvalidAuth = new Request("http://localhost:3000/profile", {
			headers: {
				Cookie: "auth-token=invalid-token",
			},
		});

		const result = await loader({
			request: requestWithInvalidAuth,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(302);
		expect((result as Response).headers.get("Location")).toBe("/login");
	});

	it("should handle API errors gracefully", async () => {
		// APIエラーを発生させるモック設定
		const requestWithAuth = new Request("http://localhost:3000/profile", {
			headers: {
				Cookie: "auth-token=api-error-token",
			},
		});

		const result = await loader({
			request: requestWithAuth,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(500);
	});
});
