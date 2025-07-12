import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { AuthContext, type AuthContextType } from "~/contexts/auth-context";

// モックAuthContextのデフォルト値
export const mockAuthContext: AuthContextType = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
	login: vi.fn(),
	register: vi.fn(),
	logout: vi.fn(),
	clearError: vi.fn(),
};

// 認証済みユーザーのモック
export const mockAuthenticatedContext: AuthContextType = {
	...mockAuthContext,
	isAuthenticated: true,
	user: {
		id: "1",
		email: "test@test.com",
		name: "Test User",
		role: "viewer" as const,
		createdAt: new Date(),
		updatedAt: new Date(),
		emailVerified: true,
	},
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	authContext?: Partial<AuthContextType>;
	initialEntries?: string[];
}

// AuthProvider付きのカスタムレンダー関数
export function renderWithAuth(ui: ReactElement, options: CustomRenderOptions = {}) {
	const { authContext = {}, initialEntries = ["/"], ...renderOptions } = options;

	const contextValue = {
		...mockAuthContext,
		...authContext,
	};

	function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<AuthContext.Provider value={contextValue}>
				<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
			</AuthContext.Provider>
		);
	}

	return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// 認証済み状態でのレンダー
export function renderWithAuthenticatedUser(ui: ReactElement, options: CustomRenderOptions = {}) {
	return renderWithAuth(ui, {
		...options,
		authContext: {
			...mockAuthenticatedContext,
			...options.authContext,
		},
	});
}

// 未認証状態でのレンダー
export function renderWithUnauthenticatedUser(ui: ReactElement, options: CustomRenderOptions = {}) {
	return renderWithAuth(ui, {
		...options,
		authContext: {
			...mockAuthContext,
			isAuthenticated: false,
			user: null,
			...options.authContext,
		},
	});
}
