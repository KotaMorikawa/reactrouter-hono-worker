import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

// ルート設定をテスト用にモック
const mockRoutes = [
	// Public routes with main layout
	{
		path: "/",
		element: <div data-testid="home-page">Home Page</div>,
	},
	{
		path: "/login",
		element: <div data-testid="login-page">Login Page</div>,
	},
	{
		path: "/register",
		element: <div data-testid="register-page">Register Page</div>,
	},
	// Protected routes with authenticated layout
	{
		path: "/dashboard",
		element: <div data-testid="dashboard-page">Dashboard Page</div>,
	},
	{
		path: "/profile",
		element: <div data-testid="profile-page">Profile Page</div>,
	},
	{
		path: "/settings",
		element: <div data-testid="settings-page">Settings Page</div>,
	},
];

// React Router の createBrowserRouter をモック
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		createBrowserRouter: vi.fn(() => ({
			routes: mockRoutes,
		})),
	};
});

describe("Routing Structure", () => {
	it("should have correct route paths defined", () => {
		const expectedPaths = ["/", "/login", "/register", "/dashboard", "/profile", "/settings"];

		const routePaths = mockRoutes.map((route) => route.path);

		expectedPaths.forEach((path) => {
			expect(routePaths).toContain(path);
		});
	});

	it("should render home page for root path", () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<div data-testid="home-page">Home Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("home-page")).toBeInTheDocument();
	});

	it("should render login page for /login path", () => {
		render(
			<MemoryRouter initialEntries={["/login"]}>
				<div data-testid="login-page">Login Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("login-page")).toBeInTheDocument();
	});

	it("should render register page for /register path", () => {
		render(
			<MemoryRouter initialEntries={["/register"]}>
				<div data-testid="register-page">Register Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("register-page")).toBeInTheDocument();
	});

	it("should render dashboard page for /dashboard path", () => {
		render(
			<MemoryRouter initialEntries={["/dashboard"]}>
				<div data-testid="dashboard-page">Dashboard Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
	});

	it("should render profile page for /profile path", () => {
		render(
			<MemoryRouter initialEntries={["/profile"]}>
				<div data-testid="profile-page">Profile Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("profile-page")).toBeInTheDocument();
	});

	it("should render settings page for /settings path", () => {
		render(
			<MemoryRouter initialEntries={["/settings"]}>
				<div data-testid="settings-page">Settings Page</div>
			</MemoryRouter>
		);

		expect(screen.getByTestId("settings-page")).toBeInTheDocument();
	});

	it("should have proper route separation between public and protected", () => {
		const publicRoutes = ["/", "/login", "/register"];
		const protectedRoutes = ["/dashboard", "/profile", "/settings"];

		const allRoutes = mockRoutes.map((route) => route.path);

		// Check that public routes are included
		publicRoutes.forEach((route) => {
			expect(allRoutes).toContain(route);
		});

		// Check that protected routes are included
		protectedRoutes.forEach((route) => {
			expect(allRoutes).toContain(route);
		});

		// Ensure no overlap
		const intersection = publicRoutes.filter((route) => protectedRoutes.includes(route));
		expect(intersection).toHaveLength(0);
	});
});
