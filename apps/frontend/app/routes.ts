import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	// Public routes with main layout
	layout("components/layout/main-layout.tsx", [
		index("routes/home.tsx"),
		route("login", "routes/login.tsx"),
		route("register", "routes/register.tsx"),
	]),

	// Protected routes with authenticated layout
	layout("components/layout/authenticated-layout.tsx", [
		route("dashboard", "routes/dashboard.tsx"),
		route("profile", "routes/profile.tsx"),
		route("settings", "routes/settings.tsx"),
	]),
] satisfies RouteConfig;
