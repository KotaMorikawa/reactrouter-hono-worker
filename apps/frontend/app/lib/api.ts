import { hc } from "hono/client";
import type { AppType } from "../../../backend/src/index";

interface Env {
	API?: Fetcher;
	API_URL?: string;
	ENVIRONMENT?: string;
}

/**
 * Create API client for frontend-backend communication
 * Uses Service Bindings in production, HTTP in development
 */
export function createApiClient(env?: Env) {
	// Production: Use Service Binding for high-performance internal communication
	if (env?.API) {
		return hc<AppType>("/", {
			fetch: (input: RequestInfo | URL, init?: RequestInit) => {
				if (!env.API) throw new Error("API binding not available");
				return env.API.fetch(input, init);
			},
		});
	}

	// Development: Use HTTP communication
	const apiUrl = env?.API_URL || "http://localhost:8787";
	return hc<AppType>(apiUrl);
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(env?: Env) {
	return {
		environment: env?.ENVIRONMENT || "development",
		apiUrl: env?.API_URL,
		isProduction: env?.ENVIRONMENT === "production",
		isDevelopment: env?.ENVIRONMENT === "development",
	};
}
