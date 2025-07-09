import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { comprehensiveSecurityMiddleware } from "./middleware/security";

export interface Env extends CloudflareBindings {
	// JWT secrets
	JWT_SECRET: string;
	JWT_REFRESH_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Security middleware
app.use(
	"*",
	secureHeaders({
		contentSecurityPolicy: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "https:"],
		},
		crossOriginEmbedderPolicy: false,
	})
);

// CORS middleware
app.use(
	"*",
	cors({
		origin: (origin) => {
			// Allow localhost for development
			if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
				return origin;
			}
			// Allow production domains
			if (origin?.includes("your-domain.com")) {
				return origin;
			}
			return null;
		},
		credentials: true,
	})
);

// Logger middleware
app.use("*", logger());

// Apply comprehensive security middleware
app.use("*", comprehensiveSecurityMiddleware());

// Health check endpoint
app.get("/", (c) => {
	return c.json({ message: "Hono Backend API", version: "1.0.0", status: "healthy" });
});

// API routes
import authRouter from "./routes/auth";

app.route("/auth", authRouter);

export default app;
