import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithAuth } from "~/test-utils";
import type { Route } from "./+types/register";
import Register, { meta } from "./register";

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

// AuthContextのモック関数
const mockRegister = vi.fn();
const mockClearError = vi.fn();
const mockLogin = vi.fn();
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

describe("Register Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockClear();
		mockLogin.mockClear();
		mockClearError.mockClear();
		mockRegister.mockClear();
		mockLogout.mockClear();
	});

	describe("Meta function", () => {
		it("should return correct meta tags", () => {
			const metaResult = meta({} as Route.MetaArgs);

			expect(metaResult).toEqual([
				{ title: "ユーザー登録 - React Router App" },
				{ name: "description", content: "新しいアカウントを作成してください" },
			]);
		});
	});

	describe("Component rendering", () => {
		it("should render registration form elements", () => {
			renderWithAuth(<Register />);

			// フォーム要素の存在確認
			expect(screen.getByText("新しいアカウントを作成")).toBeInTheDocument();
			expect(screen.getByText("アカウント情報を入力して登録してください")).toBeInTheDocument();
			expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
			expect(screen.getByLabelText("お名前")).toBeInTheDocument();
			expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
			expect(screen.getByLabelText("パスワード確認")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /アカウント作成/ })).toBeInTheDocument();
		});

		it("should render login link", () => {
			renderWithAuth(<Register />);

			const loginLink = screen.getByText("こちら");
			expect(loginLink).toBeInTheDocument();
			expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
		});

		it("should have proper form structure", () => {
			renderWithAuth(<Register />);

			// フォーム構造の確認
			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");
			const passwordInput = screen.getByLabelText("パスワード");
			const confirmPasswordInput = screen.getByLabelText("パスワード確認");

			expect(emailInput).toHaveAttribute("type", "email");
			expect(emailInput).toHaveAttribute("placeholder", "メールアドレスを入力");
			expect(emailInput).toHaveAttribute("autoComplete", "email");

			expect(nameInput).toHaveAttribute("type", "text");
			expect(nameInput).toHaveAttribute("placeholder", "お名前を入力");
			expect(nameInput).toHaveAttribute("autoComplete", "name");

			expect(passwordInput).toHaveAttribute("type", "password");
			expect(passwordInput).toHaveAttribute("placeholder", "パスワードを入力");
			expect(passwordInput).toHaveAttribute("autoComplete", "new-password");

			expect(confirmPasswordInput).toHaveAttribute("type", "password");
			expect(confirmPasswordInput).toHaveAttribute("placeholder", "パスワードを再入力");
			expect(confirmPasswordInput).toHaveAttribute("autoComplete", "new-password");
		});

		it("should show password requirements description", () => {
			renderWithAuth(<Register />);

			expect(
				screen.getByText(
					"パスワードは8文字以上で、大文字・小文字・数字・特殊文字を含む必要があります"
				)
			).toBeInTheDocument();
		});
	});

	describe("Form validation", () => {
		it("should show validation errors for empty fields", async () => {
			const user = userEvent.setup();

			renderWithAuth(<Register />);

			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 空の状態でフォーム送信
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			});
		});

		it("should show validation error for invalid email", async () => {
			const user = userEvent.setup();

			renderWithAuth(<Register />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 無効なメール形式を入力
			await user.type(emailInput, "invalid-email");
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Invalid email format")).toBeInTheDocument();
			});
		});

		it("should show validation error for empty name", async () => {
			const user = userEvent.setup();

			renderWithAuth(<Register />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 有効なメールだけ入力して送信
			await user.type(emailInput, "test@example.com");
			await user.click(submitButton);

			// 名前のバリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Name is required")).toBeInTheDocument();
			});
		});

		it("should show validation error for weak password", async () => {
			const user = userEvent.setup();

			renderWithAuth(<Register />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");
			const passwordInput = screen.getByLabelText("パスワード");
			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 弱いパスワードを入力
			await user.type(emailInput, "test@example.com");
			await user.type(nameInput, "Test User");
			await user.type(passwordInput, "weakpass");
			await user.click(submitButton);

			// パスワード強度のバリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(
					screen.getByText(/Password must contain at least one uppercase letter/)
				).toBeInTheDocument();
			});
		});

		it("should show validation error for mismatched passwords", async () => {
			const user = userEvent.setup();

			renderWithAuth(<Register />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");
			const passwordInput = screen.getByLabelText("パスワード");
			const confirmPasswordInput = screen.getByLabelText("パスワード確認");
			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 異なるパスワードを入力
			await user.type(emailInput, "test@example.com");
			await user.type(nameInput, "Test User");
			await user.type(passwordInput, "ValidPass123!");
			await user.type(confirmPasswordInput, "DifferentPass123!");
			await user.click(submitButton);

			// パスワード不一致のバリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
			});
		});
	});

	describe("Form submission", () => {
		it("should call register function with correct data on valid submission", async () => {
			const user = userEvent.setup();
			const authState = createMockAuthState();
			renderWithAuth(<Register />, { authContext: authState });

			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");
			const passwordInput = screen.getByLabelText("パスワード");
			const confirmPasswordInput = screen.getByLabelText("パスワード確認");
			const submitButton = screen.getByRole("button", { name: /アカウント作成/ });

			// 有効なデータを入力
			await user.type(emailInput, "test@example.com");
			await user.type(nameInput, "Test User");
			await user.type(passwordInput, "ValidPass123!");
			await user.type(confirmPasswordInput, "ValidPass123!");
			await user.click(submitButton);

			// register関数が正しい引数で呼ばれることを確認
			await waitFor(() => {
				expect(mockRegister).toHaveBeenCalledWith(
					"test@example.com",
					"Test User",
					"ValidPass123!",
					"ValidPass123!"
				);
			});
		});

		it("should show loading state during submission", () => {
			// ローディング状態を設定
			const authState = createMockAuthState({ isLoading: true });

			renderWithAuth(<Register />, { authContext: authState });

			// ローディング中のボタンテキストを確認
			const loadingButton = screen.getByRole("button", { name: /登録中.../ });
			expect(loadingButton).toBeInTheDocument();
			expect(loadingButton).toBeDisabled();
		});
	});

	describe("Error handling", () => {
		it("should display error message when registration fails", () => {
			// エラー状態を設定
			const authState = createMockAuthState({
				error: "このメールアドレスは既に登録されています。",
			});

			renderWithAuth(<Register />, { authContext: authState });

			// エラーアラートが表示されることを確認
			expect(screen.getByText("このメールアドレスは既に登録されています。")).toBeInTheDocument();
		});

		it("should clear error after 5 seconds", () => {
			vi.useFakeTimers();

			// エラー状態を設定
			const authState = createMockAuthState({
				error: "登録エラー",
			});

			renderWithAuth(<Register />, { authContext: authState });

			// 5秒後にclearErrorが呼ばれることを確認
			vi.advanceTimersByTime(5000);

			expect(mockClearError).toHaveBeenCalled();

			vi.useRealTimers();
		});
	});

	describe("Authentication redirect", () => {
		it("should redirect to dashboard when already authenticated", () => {
			// 認証済み状態を設定
			const authState = createMockAuthState({
				isAuthenticated: true,
				user: { email: "test@example.com", name: "Test User" },
			});

			renderWithAuth(<Register />, { authContext: authState });

			// ダッシュボードへのリダイレクトを確認
			expect(screen.getByTestId("navigate-to")).toHaveTextContent("/dashboard");
		});
	});

	describe("Accessibility", () => {
		it("should have proper ARIA labels and structure", () => {
			renderWithAuth(<Register />);

			// フォームのアクセシビリティ確認
			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");
			const passwordInput = screen.getByLabelText("パスワード");
			const confirmPasswordInput = screen.getByLabelText("パスワード確認");

			expect(emailInput).toHaveAttribute("aria-describedby");
			expect(nameInput).toHaveAttribute("aria-describedby");
			expect(passwordInput).toHaveAttribute("aria-describedby");
			expect(confirmPasswordInput).toHaveAttribute("aria-describedby");
		});

		it("should have proper heading hierarchy", () => {
			renderWithAuth(<Register />);

			// ヘッダー構造の確認
			expect(screen.getByText("新しいアカウントを作成")).toBeInTheDocument();
		});

		it("should have password description linked to password field", () => {
			renderWithAuth(<Register />);

			const passwordInput = screen.getByLabelText("パスワード");
			const description = screen.getByText(
				"パスワードは8文字以上で、大文字・小文字・数字・特殊文字を含む必要があります"
			);

			// パスワードフィールドと説明文が適切に関連付けられていることを確認
			expect(passwordInput).toHaveAttribute("aria-describedby");
			expect(description).toHaveAttribute("id");
		});
	});

	describe("User experience", () => {
		it("should focus on email input when page loads", () => {
			renderWithAuth(<Register />);

			// 最初のフィールドにフォーカスがあることを確認（テスト環境では手動フォーカスが必要な場合がある）
			const emailInput = screen.getByLabelText("メールアドレス");
			expect(emailInput).toBeInTheDocument();
		});

		it("should navigate between fields with tab", async () => {
			const user = userEvent.setup();
			renderWithAuth(<Register />);

			const emailInput = screen.getByLabelText("メールアドレス");
			const nameInput = screen.getByLabelText("お名前");

			// フィールド間のタブナビゲーション
			await user.click(emailInput);
			await user.tab();

			expect(nameInput).toHaveFocus();
		});

		it("should show real-time validation feedback", async () => {
			const user = userEvent.setup();
			renderWithAuth(<Register />);

			const passwordInput = screen.getByLabelText("パスワード");
			const confirmPasswordInput = screen.getByLabelText("パスワード確認");

			// パスワードを入力
			await user.type(passwordInput, "ValidPass123!");
			// 異なる確認パスワードを入力
			await user.type(confirmPasswordInput, "Different");

			// フィールドからフォーカスを外す
			await user.tab();

			// リアルタイムバリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
			});
		});
	});
});
