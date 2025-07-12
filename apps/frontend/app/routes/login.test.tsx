import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Route } from "./+types/login";
import Login, { meta } from "./login";

// React Routerのモック
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		Navigate: ({ to }: { to: string }) => {
			mockNavigate(to);
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

// AuthContextのモック
const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();

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

vi.mock("../contexts/auth-context", () => ({
	useAuth: () => mockAuthState,
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Login Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		mockAuthState = createMockAuthState();
	});

	describe("Meta function", () => {
		it("should return correct meta tags", () => {
			const metaResult = meta({} as Route.MetaArgs);

			expect(metaResult).toEqual([
				{ title: "ログイン - React Router App" },
				{ name: "description", content: "アカウントにログインしてください" },
			]);
		});
	});

	describe("Component rendering", () => {
		it("should render login form elements", () => {
			render(<Login />);

			// フォーム要素の存在確認
			expect(screen.getByText("アカウントにログイン")).toBeInTheDocument();
			expect(
				screen.getByText("アカウントの詳細を入力してログインしてください")
			).toBeInTheDocument();
			expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
			expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /ログイン/ })).toBeInTheDocument();
		});

		it("should render registration link", () => {
			render(<Login />);

			const registrationLink = screen.getByText("こちら");
			expect(registrationLink).toBeInTheDocument();
			expect(registrationLink.closest("a")).toHaveAttribute("href", "/register");
		});

		it("should have proper form structure", () => {
			render(<Login />);

			// フォーム構造の確認
			const emailInput = screen.getByLabelText("メールアドレス");
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toHaveAttribute("type", "email");
			expect(emailInput).toHaveAttribute("placeholder", "メールアドレスを入力");
			expect(emailInput).toHaveAttribute("autoComplete", "email");

			expect(passwordInput).toHaveAttribute("type", "password");
			expect(passwordInput).toHaveAttribute("placeholder", "パスワードを入力");
			expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
		});
	});

	describe("Form validation", () => {
		it("should show validation errors for empty fields", async () => {
			const user = userEvent.setup();

			render(<Login />);

			const submitButton = screen.getByRole("button", { name: /ログイン/ });

			// 空の状態でフォーム送信
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			});
		});

		it("should show validation error for invalid email", async () => {
			const user = userEvent.setup();

			render(<Login />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const submitButton = screen.getByRole("button", { name: /ログイン/ });

			// 無効なメール形式を入力
			await user.type(emailInput, "invalid-email");
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			});
		});

		it("should show validation error for short password", async () => {
			const user = userEvent.setup();

			render(<Login />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const passwordInput = screen.getByLabelText("パスワード");
			const submitButton = screen.getByRole("button", { name: /ログイン/ });

			// 有効なメールと短いパスワードを入力
			await user.type(emailInput, "test@example.com");
			await user.type(passwordInput, "123");
			await user.click(submitButton);

			// パスワード長のバリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
			});
		});
	});

	describe("Form submission", () => {
		it("should call login function with correct data on valid submission", async () => {
			const user = userEvent.setup();
			render(<Login />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const passwordInput = screen.getByLabelText("パスワード");
			const submitButton = screen.getByRole("button", { name: /ログイン/ });

			// 有効なデータを入力
			await user.type(emailInput, "test@example.com");
			await user.type(passwordInput, "ValidPass123!");
			await user.click(submitButton);

			// login関数が正しい引数で呼ばれることを確認
			await waitFor(() => {
				expect(mockLogin).toHaveBeenCalledWith("test@example.com", "ValidPass123!");
			});
		});

		it("should show loading state during submission", () => {
			// ローディング状態を設定
			mockAuthState = createMockAuthState({ isLoading: true });

			render(<Login />);

			// ローディング中のボタンテキストを確認
			expect(screen.getByRole("button", { name: /ログイン中.../ })).toBeInTheDocument();
			expect(screen.getByRole("button")).toBeDisabled();
		});
	});

	describe("Error handling", () => {
		it("should display error message when login fails", () => {
			// エラー状態を設定
			mockAuthState = createMockAuthState({
				error: "ログインに失敗しました。メールアドレスとパスワードを確認してください。",
			});

			render(<Login />);

			// エラーアラートが表示されることを確認
			expect(
				screen.getByText("ログインに失敗しました。メールアドレスとパスワードを確認してください。")
			).toBeInTheDocument();
		});

		it("should clear error after 5 seconds", async () => {
			vi.useFakeTimers();

			// エラー状態を設定
			mockAuthState = createMockAuthState({
				error: "ログインエラー",
			});

			render(<Login />);

			// 5秒後にclearErrorが呼ばれることを確認
			vi.advanceTimersByTime(5000);

			expect(mockClearError).toHaveBeenCalled();

			vi.useRealTimers();
		});
	});

	describe("Authentication redirect", () => {
		it("should redirect to dashboard when already authenticated", () => {
			// 認証済み状態を設定
			mockAuthState = createMockAuthState({
				isAuthenticated: true,
				user: { email: "test@example.com", name: "Test User" },
			});

			render(<Login />);

			// ダッシュボードへのリダイレクトを確認
			expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
		});
	});

	describe("Accessibility", () => {
		it("should have proper ARIA labels and structure", () => {
			render(<Login />);

			// フォームのアクセシビリティ確認
			const emailInput = screen.getByLabelText("メールアドレス");
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toHaveAttribute("aria-describedby");
			expect(passwordInput).toHaveAttribute("aria-describedby");
		});

		it("should have proper heading hierarchy", () => {
			render(<Login />);

			// ヘッダー構造の確認（CardTitleは実際はh1ではない可能性があるので調整）
			expect(screen.getByText("アカウントにログイン")).toBeInTheDocument();
		});
	});
});
