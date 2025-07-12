import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Navigation } from "./navigation";

// useAuth フックをモック
const mockUseAuth = vi.fn();
vi.mock("../contexts/auth-context", () => ({
	useAuth: () => mockUseAuth(),
}));

describe("Navigation", () => {
	it("should render navigation with home link", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={false} />
			</MemoryRouter>
		);

		expect(screen.getByText("React Router App")).toBeInTheDocument();
		expect(screen.getByText("ホーム")).toBeInTheDocument();
	});

	it("should show login and register buttons for unauthenticated users", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={false} />
			</MemoryRouter>
		);

		expect(screen.getByText("ログイン")).toBeInTheDocument();
		expect(screen.getByText("登録")).toBeInTheDocument();
	});

	it("should show authenticated navigation items for logged in users", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: { id: "1", name: "Test User", email: "test@example.com" },
			logout: vi.fn(),
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={true} />
			</MemoryRouter>
		);

		expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
		expect(screen.getByText("プロフィール")).toBeInTheDocument();
		expect(screen.getByText("設定")).toBeInTheDocument();
		expect(screen.getByText("ログアウト")).toBeInTheDocument();
	});

	it("should call logout function when logout button is clicked", () => {
		const mockLogout = vi.fn();
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: { id: "1", name: "Test User", email: "test@example.com" },
			logout: mockLogout,
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={true} />
			</MemoryRouter>
		);

		const logoutButton = screen.getByText("ログアウト");
		fireEvent.click(logoutButton);

		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it("should toggle mobile menu when menu button is clicked", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={false} />
			</MemoryRouter>
		);

		// メニューボタンを見つける（aria-labelで検索）
		const menuButton = screen.getByLabelText("メニューを開く");
		expect(menuButton).toBeInTheDocument();

		// 初期状態ではモバイルメニューは表示されていない
		expect(screen.queryByText("こんにちは、さん")).not.toBeInTheDocument();

		// メニューボタンをクリック
		fireEvent.click(menuButton);
	});

	it("should filter navigation items based on authentication status", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
		});

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={false} />
			</MemoryRouter>
		);

		// 未認証の場合、保護されたルートは表示されない
		expect(screen.queryByText("ダッシュボード")).not.toBeInTheDocument();
		expect(screen.queryByText("プロフィール")).not.toBeInTheDocument();
		expect(screen.queryByText("設定")).not.toBeInTheDocument();

		// ホームは表示される
		expect(screen.getByText("ホーム")).toBeInTheDocument();
	});

	it("should handle undefined auth context gracefully", () => {
		mockUseAuth.mockReturnValue(null);

		render(
			<MemoryRouter>
				<Navigation isAuthenticated={false} />
			</MemoryRouter>
		);

		// エラーなく描画されることを確認
		expect(screen.getByText("React Router App")).toBeInTheDocument();
		expect(screen.getByText("ホーム")).toBeInTheDocument();
	});
});
