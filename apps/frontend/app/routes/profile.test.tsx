import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import Profile from "./profile";

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
