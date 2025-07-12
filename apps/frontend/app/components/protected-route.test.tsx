import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "~/contexts/auth-context";
import { ProtectedRoute } from "./protected-route";

const mockAuthContext = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
	login: vi.fn(),
	register: vi.fn(),
	logout: vi.fn(),
	clearError: vi.fn(),
};

describe("ProtectedRoute", () => {
	it("should render children when authenticated", () => {
		const authenticatedContext = {
			...mockAuthContext,
			isAuthenticated: true,
			user: {
				id: "1",
				email: "test@test.com",
				name: "Test",
				role: "viewer" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
				emailVerified: true,
			},
		};

		render(
			<AuthContext.Provider value={authenticatedContext}>
				<MemoryRouter>
					<ProtectedRoute>
						<div>Protected Content</div>
					</ProtectedRoute>
				</MemoryRouter>
			</AuthContext.Provider>
		);

		expect(screen.getByText("Protected Content")).toBeInTheDocument();
	});

	it("should not render when not authenticated", () => {
		render(
			<AuthContext.Provider value={mockAuthContext}>
				<MemoryRouter>
					<ProtectedRoute>
						<div>Protected Content</div>
					</ProtectedRoute>
				</MemoryRouter>
			</AuthContext.Provider>
		);

		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
	});
});
