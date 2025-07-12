import { Outlet } from "react-router";
import { useAuth } from "../../contexts/auth-context";
import { Navigation } from "../navigation";

export function MainLayout() {
	const auth = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;

	return (
		<div className="min-h-screen bg-background">
			<Navigation isAuthenticated={isAuthenticated} />
			<main className="mx-auto max-w-7xl">
				<Outlet />
			</main>
		</div>
	);
}
