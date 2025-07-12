import { Navigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { LoadingSpinner } from "./ui/loading-spinner";

interface AuthGuardProps {
	children: React.ReactNode;
	fallback?: string;
}

export function AuthGuard({ children, fallback = "/login" }: AuthGuardProps) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!isAuthenticated) {
		return <Navigate to={fallback} replace />;
	}

	return <>{children}</>;
}
