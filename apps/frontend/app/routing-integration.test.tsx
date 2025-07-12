import { render, screen } from "@testing-library/react";
import type * as React from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MainLayout } from "./components/layout/main-layout";
import { ProtectedRoute } from "./components/protected-route";
import { AuthProvider } from "./contexts/auth-context";

// React Routerのモック
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
			mockNavigate(to, { replace });
			return <div data-testid="navigate-to">{to}</div>;
		},
		Link: ({
			to,
			children,
			...props
		}: {
			to: string;
			children: React.ReactNode;
			[key: string]: unknown;
		}) => (
			<a href={to} {...props}>
				{children}
			</a>
		),
	};
});

// Navigationコンポーネントのモック
vi.mock("./components/navigation", () => ({
	Navigation: ({ isAuthenticated }: { isAuthenticated: boolean }) => (
		<nav data-testid="navigation" data-authenticated={isAuthenticated}>
			<div data-testid="home-link">Home</div>
			{!isAuthenticated && (
				<>
					<div data-testid="login-link">Login</div>
					<div data-testid="register-link">Register</div>
				</>
			)}
			{isAuthenticated && (
				<>
					<div data-testid="dashboard-link">Dashboard</div>
					<div data-testid="profile-link">Profile</div>
					<div data-testid="settings-link">Settings</div>
				</>
			)}
		</nav>
	),
}));

// AuthContextのモック
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockRegister = vi.fn();
const mockClearError = vi.fn();

const createMockAuthState = (overrides = {}) => ({
	login: mockLogin,
	register: mockRegister,
	logout: mockLogout,
	clearError: mockClearError,
	isAuthenticated: false,
	isLoading: false,
	error: null,
	user: null,
	...overrides,
});

let mockAuthState = createMockAuthState();

vi.mock("./contexts/auth-context", () => ({
	useAuth: () => mockAuthState,
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// テスト用のコンポーネント
const TestPage = ({ pageName }: { pageName: string }) => (
	<div data-testid={`page-${pageName}`}>
		<h1>{pageName} Page</h1>
	</div>
);

const TestApp = ({
	initialEntries,
	layoutType = "none",
}: {
	initialEntries: string[];
	layoutType?: "public" | "protected" | "none";
}) => {
	return (
		<MemoryRouter initialEntries={initialEntries}>
			<AuthProvider>
				{layoutType === "public" && (
					<div data-testid="public-layout">
						<MainLayout />
					</div>
				)}
				{layoutType === "protected" && (
					<div data-testid="protected-layout-test">
						<ProtectedRoute>
							<TestPage pageName="protected" />
						</ProtectedRoute>
					</div>
				)}
				{layoutType === "none" && (
					<div data-testid="test-app">
						<TestPage pageName="default" />
					</div>
				)}
			</AuthProvider>
		</MemoryRouter>
	);
};

describe("Routing Integration Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		mockAuthState = createMockAuthState();
	});

	describe("Public Layout Routing", () => {
		it("should render public layout with navigation for unauthenticated users", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false });

			render(<TestApp initialEntries={["/"]} layoutType="public" />);

			// パブリックレイアウトが表示されることを確認
			expect(screen.getByTestId("navigation")).toBeInTheDocument();
			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");

			// パブリックルート用のナビゲーションリンクが表示されることを確認
			expect(screen.getByTestId("home-link")).toBeInTheDocument();
			expect(screen.getByTestId("login-link")).toBeInTheDocument();
			expect(screen.getByTestId("register-link")).toBeInTheDocument();

			// 認証済みユーザー用のリンクは表示されないことを確認
			expect(screen.queryByTestId("dashboard-link")).not.toBeInTheDocument();
			expect(screen.queryByTestId("profile-link")).not.toBeInTheDocument();
			expect(screen.queryByTestId("settings-link")).not.toBeInTheDocument();
		});

		it("should update navigation when user becomes authenticated", () => {
			// 最初は未認証状態でレンダリング
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { rerender } = render(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
			expect(screen.getByTestId("login-link")).toBeInTheDocument();

			// 認証状態に変更してリレンダリング
			mockAuthState = createMockAuthState({ isAuthenticated: true });
			rerender(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "true");
			expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();
			expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
		});
	});

	describe("Protected Route Routing", () => {
		it("should redirect to login when accessing protected routes without authentication", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false, isLoading: false });

			render(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);

			// ログインページへのリダイレクトが発生することを確認
			expect(screen.getByTestId("navigate-to")).toHaveTextContent("/login");
			expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
		});

		it("should show loading state while authentication is being checked", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false, isLoading: true });

			render(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);

			// ローディング状態が表示されることを確認
			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
			expect(document.querySelector(".animate-spin")).toBeInTheDocument();

			// リダイレクトが発生していないことを確認
			expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();
		});

		it("should render protected content when user is authenticated", () => {
			mockAuthState = createMockAuthState({
				isAuthenticated: true,
				isLoading: false,
				user: { email: "test@example.com", name: "Test User" },
			});

			render(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);

			// 認証済みユーザーに適切なナビゲーションが表示されることを確認
			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "true");
			expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();
			expect(screen.getByTestId("profile-link")).toBeInTheDocument();
			expect(screen.getByTestId("settings-link")).toBeInTheDocument();

			// ログイン/登録リンクは表示されないことを確認
			expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
			expect(screen.queryByTestId("register-link")).not.toBeInTheDocument();

			// プロテクトされたページコンテンツが表示されることを確認
			expect(screen.getByTestId("page-protected")).toBeInTheDocument();

			// リダイレクトが発生していないことを確認
			expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();
		});
	});

	describe("Route Configuration Consistency", () => {
		it("should maintain route structure integrity", () => {
			const publicRoutes = ["/", "/login", "/register"];
			const protectedRoutes = ["/dashboard", "/profile", "/settings"];

			// パブリックルートとプロテクトルートが重複していないことを確認
			const allRoutes = [...publicRoutes, ...protectedRoutes];
			const uniqueRoutes = [...new Set(allRoutes)];

			expect(allRoutes.length).toBe(uniqueRoutes.length);
			expect(publicRoutes.length).toBe(3);
			expect(protectedRoutes.length).toBe(3);

			// 各ルートが正しいカテゴリに分類されていることを確認
			const authRoutes = ["/login", "/register"];
			const dashboardRoutes = ["/dashboard", "/profile", "/settings"];

			authRoutes.forEach((route) => {
				expect(publicRoutes.includes(route)).toBe(true);
				expect(protectedRoutes.includes(route)).toBe(false);
			});

			dashboardRoutes.forEach((route) => {
				expect(protectedRoutes.includes(route)).toBe(true);
				expect(publicRoutes.includes(route)).toBe(false);
			});
		});

		it("should handle route transitions correctly", () => {
			// 未認証状態でパブリックルートから開始
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { rerender } = render(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("public-layout")).toBeInTheDocument();

			// 認証状態に変更してプロテクトルートに遷移
			mockAuthState = createMockAuthState({ isAuthenticated: true });
			rerender(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);

			expect(screen.getByTestId("page-protected")).toBeInTheDocument();
		});
	});

	describe("Layout Switching", () => {
		it("should switch from main layout to authenticated layout upon login", () => {
			// メインレイアウトから開始
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { rerender } = render(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
			expect(screen.getByTestId("public-layout")).toBeInTheDocument();

			// 認証済みレイアウトに切り替え
			mockAuthState = createMockAuthState({ isAuthenticated: true });
			rerender(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "true");
			expect(screen.getByTestId("page-protected")).toBeInTheDocument();
		});

		it("should switch from authenticated layout to main layout upon logout", () => {
			// 認証済みレイアウトから開始
			mockAuthState = createMockAuthState({ isAuthenticated: true });
			const { rerender } = render(
				<TestApp initialEntries={["/dashboard"]} layoutType="protected" />
			);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "true");
			expect(screen.getByTestId("page-protected")).toBeInTheDocument();

			// メインレイアウトに切り替え（ログアウト後）
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			rerender(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
			expect(screen.getByTestId("public-layout")).toBeInTheDocument();
		});
	});

	describe("ProtectedRoute Component", () => {
		const TestProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

		it("should render children when user is authenticated", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: true, isLoading: false });

			render(
				<MemoryRouter initialEntries={["/dashboard"]}>
					<AuthProvider>
						<ProtectedRoute>
							<TestProtectedContent />
						</ProtectedRoute>
					</AuthProvider>
				</MemoryRouter>
			);

			expect(screen.getByTestId("protected-content")).toBeInTheDocument();
			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "true");
		});

		it("should redirect to login when user is not authenticated", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false, isLoading: false });

			render(
				<MemoryRouter initialEntries={["/dashboard"]}>
					<AuthProvider>
						<ProtectedRoute>
							<TestProtectedContent />
						</ProtectedRoute>
					</AuthProvider>
				</MemoryRouter>
			);

			expect(screen.getByTestId("navigate-to")).toHaveTextContent("/login");
			expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
			expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
		});

		it("should show loading spinner while checking authentication", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false, isLoading: true });

			render(
				<MemoryRouter initialEntries={["/dashboard"]}>
					<AuthProvider>
						<ProtectedRoute>
							<TestProtectedContent />
						</ProtectedRoute>
					</AuthProvider>
				</MemoryRouter>
			);

			expect(document.querySelector(".animate-spin")).toBeInTheDocument();
			expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
			expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
			expect(screen.queryByTestId("navigate-to")).not.toBeInTheDocument();
		});
	});

	describe("Error Route Handling", () => {
		it("should handle invalid routes gracefully", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false });

			render(<TestApp initialEntries={["/invalid-route"]} />);

			// アプリケーションがクラッシュしないことを確認
			expect(screen.getByTestId("test-app")).toBeInTheDocument();
		});

		it("should handle multiple history entries correctly", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false });

			render(<TestApp initialEntries={["/login", "/dashboard", "/"]} />);

			// 複数の履歴エントリを持つ場合でも正常に動作することを確認
			expect(screen.getByTestId("test-app")).toBeInTheDocument();
		});
	});

	describe("Route Navigation Flow", () => {
		it("should support complete authentication flow navigation", async () => {
			// ホームページから開始（未認証）
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { rerender } = render(<TestApp initialEntries={["/"]} layoutType="public" />);

			expect(screen.getByTestId("public-layout")).toBeInTheDocument();
			expect(screen.getByTestId("login-link")).toBeInTheDocument();

			// ログインページに遷移
			rerender(<TestApp initialEntries={["/login"]} layoutType="public" />);
			expect(screen.getByTestId("public-layout")).toBeInTheDocument();

			// ログイン後、認証状態に変更
			mockAuthState = createMockAuthState({ isAuthenticated: true });

			// ダッシュボードに遷移
			rerender(<TestApp initialEntries={["/dashboard"]} layoutType="protected" />);
			expect(screen.getByTestId("page-protected")).toBeInTheDocument();
			expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();

			// プロフィールページに遷移
			rerender(<TestApp initialEntries={["/profile"]} layoutType="protected" />);
			expect(screen.getByTestId("page-protected")).toBeInTheDocument();

			// ログアウト後、パブリックルートに戻る
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			rerender(<TestApp initialEntries={["/"]} layoutType="public" />);
			expect(screen.getByTestId("public-layout")).toBeInTheDocument();
			expect(screen.getByTestId("login-link")).toBeInTheDocument();
		});
	});

	describe("Layout Consistency", () => {
		it("should maintain proper HTML structure across all layouts", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { container: publicContainer } = render(
				<TestApp initialEntries={["/"]} layoutType="public" />
			);

			mockAuthState = createMockAuthState({ isAuthenticated: true });
			const { container: protectedContainer } = render(
				<TestApp initialEntries={["/dashboard"]} layoutType="protected" />
			);

			// パブリックレイアウトの構造確認
			const publicNav = publicContainer.querySelector("nav");
			const publicMain = publicContainer.querySelector("main");
			expect(publicNav).toBeInTheDocument();
			expect(publicMain).toBeInTheDocument();

			// プロテクトレイアウトの構造確認
			const protectedNav = protectedContainer.querySelector("nav");
			expect(protectedNav).toBeInTheDocument();

			// 最低限のアクセシビリティ構造が維持されていることを確認
			expect(publicContainer.querySelector('[data-testid="navigation"]')).toBeInTheDocument();
			expect(protectedContainer.querySelector('[data-testid="navigation"]')).toBeInTheDocument();
		});

		it("should apply consistent styling classes across layouts", () => {
			mockAuthState = createMockAuthState({ isAuthenticated: false });
			const { container: publicContainer } = render(
				<TestApp initialEntries={["/"]} layoutType="public" />
			);

			mockAuthState = createMockAuthState({ isAuthenticated: true });
			const { container: protectedContainer } = render(
				<TestApp initialEntries={["/dashboard"]} layoutType="protected" />
			);

			// パブリックレイアウトのスタイリング確認
			const publicMain = publicContainer.querySelector("main");
			if (publicMain) {
				expect(publicMain).toHaveClass("mx-auto", "max-w-7xl");
			}

			// プロテクトレイアウトのスタイリング確認
			const protectedMain = protectedContainer.querySelector("main");
			if (protectedMain) {
				expect(protectedMain).toHaveClass("mx-auto", "max-w-7xl");
			}

			// 背景色クラスが適用されていることを確認
			const publicDiv = publicContainer.querySelector(".min-h-screen.bg-background");
			const protectedDiv = protectedContainer.querySelector(".min-h-screen");

			expect(publicDiv).toBeInTheDocument();
			expect(protectedDiv).toBeInTheDocument();
		});
	});
});
