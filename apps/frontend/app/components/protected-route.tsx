import { Navigate } from "react-router";
import { useAuth } from "../contexts/auth-context";
import { Navigation } from "./navigation";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<Navigation isAuthenticated={false} />
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2"></div>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navigation isAuthenticated={true} />
			{children}
		</div>
	);
}
