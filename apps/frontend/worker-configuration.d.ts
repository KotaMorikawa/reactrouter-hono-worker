interface Env {
	// Environment variables
	ENVIRONMENT: 'development' | 'preview' | 'staging' | 'production';
	API_URL?: string;
	
	// Service Bindings
	API?: Fetcher;
	
	// KV Namespaces
	SESSION_KV: KVNamespace;
	
	// D1 Database (if needed in frontend)
	// DB?: D1Database;
	
	// R2 Buckets (if needed in frontend)
	// ASSETS?: R2Bucket;
}

// Load context type for React Router
interface LoadContext {
	cloudflare: {
		env: Env;
		ctx: ExecutionContext;
	};
}

// Extend global types for React Router
declare global {
	namespace ReactRouter {
		interface LoaderFunctionArgs {
			context: LoadContext;
		}
		interface ActionFunctionArgs {
			context: LoadContext;
		}
	}
}