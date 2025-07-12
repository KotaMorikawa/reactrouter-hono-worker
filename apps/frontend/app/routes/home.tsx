import { Navigation } from "../components/navigation";
import { useAuth } from "../contexts/auth-context";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export default function Home() {
	const { isAuthenticated } = useAuth();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navigation isAuthenticated={isAuthenticated} />
			<Welcome />
		</div>
	);
}
