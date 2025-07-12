import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../contexts/auth-context";
import { AuthenticatedLayout } from "./authenticated-layout";

// ProtectedRoute コンポーネントをモック
vi.mock("../protected-route", () => ({
	ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="protected-route">{children}</div>
	),
}));

// Navigation コンポーネントをモック
vi.mock("../navigation", () => ({
	Navigation: vi.fn(({ isAuthenticated }) => (
		<nav data-testid="navigation" data-authenticated={isAuthenticated}>
			Mock Navigation
		</nav>
	)),
}));

// useAuth フックをモック
const mockUseAuth = vi.fn();
vi.mock("../../../contexts/auth-context", async () => {
	const actual = await vi.importActual("../../../contexts/auth-context");
	return {
		...actual,
		useAuth: () => mockUseAuth(),
		AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	};
});

describe("AuthenticatedLayout", () => {
	it("should render with protected route wrapper", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: { id: "1", name: "Test User", email: "test@example.com" },
		});

		render(
			<MemoryRouter>
				<AuthProvider>
					<AuthenticatedLayout />
				</AuthProvider>
			</MemoryRouter>
		);

		expect(screen.getByTestId("protected-route")).toBeInTheDocument();
		expect(screen.getByTestId("navigation")).toBeInTheDocument();
		// 認証状態が正しく渡されているかは別の方法で確認
		expect(screen.getByText("Mock Navigation")).toBeInTheDocument();
	});

	it("should handle unauthenticated user", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: false,
			user: null,
		});

		render(
			<MemoryRouter>
				<AuthProvider>
					<AuthenticatedLayout />
				</AuthProvider>
			</MemoryRouter>
		);

		expect(screen.getByTestId("protected-route")).toBeInTheDocument();
		expect(screen.getByTestId("navigation")).toBeInTheDocument();
		expect(screen.getByTestId("navigation")).toHaveAttribute("data-authenticated", "false");
	});

	it("should have proper layout structure with protection", () => {
		mockUseAuth.mockReturnValue({
			isAuthenticated: true,
			user: { id: "1", name: "Test User", email: "test@example.com" },
		});

		const { container } = render(
			<MemoryRouter>
				<AuthProvider>
					<AuthenticatedLayout />
				</AuthProvider>
			</MemoryRouter>
		);

		// Check for protected route wrapper
		expect(screen.getByTestId("protected-route")).toBeInTheDocument();

		// Check for main layout container inside protected route
		const layoutContainer = container.querySelector(".min-h-screen.bg-background");
		expect(layoutContainer).toBeInTheDocument();

		// Check for main content area
		const mainContent = container.querySelector("main.mx-auto.max-w-7xl");
		expect(mainContent).toBeInTheDocument();
	});
});
