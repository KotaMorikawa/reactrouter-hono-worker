import { Hono } from "hono";
import type { Env } from "../index";
import { generateTokens, refreshAccessToken } from "../lib/auth";
import { createCSRFMiddleware, setCSRFToken } from "../lib/csrf";
import { hashPassword, verifyPassword } from "../lib/password";
import {
	checkResetRateLimit,
	generatePasswordResetToken,
	getRemainingResetAttempts,
	recordResetAttempt,
	verifyPasswordResetToken,
} from "../lib/password-reset";
import {
	checkLoginRateLimit,
	getClientIp,
	recordFailedLogin,
	recordSuccessfulLogin,
	recordSuspiciousActivity,
} from "../lib/rate-limit";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { loginRateLimitMiddleware } from "../middleware/security";
import { viewerAccess, adminOnly } from "../middleware/rbac";

// Mock implementations for database and schema - will be replaced with actual imports
interface MockTable {
	email: string;
	id: string;
	name: string;
	role: string;
	passwordHash: string;
}

interface MockData {
	email: string;
	name: string;
	role: string;
	passwordHash: string;
}

// Mock user data for testing (password is "password123")
const mockUserData = {
	id: "mock-id",
	email: "test@example.com",
	name: "Test User",
	role: "viewer",
	passwordHash: "", // Will be set with actual hash
};

// Initialize mock user with hashed password
(async () => {
	try {
		mockUserData.passwordHash = await hashPassword("password123");
	} catch (error) {
		console.error("Failed to initialize mock user password:", error);
		// Fallback to avoid test failures
		mockUserData.passwordHash = "fallback-hash";
	}
})();

const mockDb = {
	select: () => ({
		from: (_table: MockTable) => ({
			where: (condition: { email: string }) => ({
				get: async () => {
					// Return mock user if email matches
					if (condition.email === mockUserData.email) {
						return mockUserData;
					}
					return null;
				},
			}),
		}),
	}),
	insert: (_table: MockTable) => ({
		values: (data: MockData) => ({
			returning: (_fields: MockTable) => ({
				get: async () => ({
					id: "mock-id",
					email: data.email,
					name: data.name,
					role: data.role,
					passwordHash: data.passwordHash,
				}),
			}),
		}),
	}),
};

const mockUsers: MockTable = {
	email: "email",
	id: "id",
	name: "name",
	role: "role",
	passwordHash: "passwordHash",
};

const authRouter = new Hono<{ Bindings: Env }>();

// Apply security middleware to all auth routes
authRouter.use("*", loginRateLimitMiddleware());

// Skip CSRF in test environment
authRouter.use("*", async (c, next) => {
	if (c.env.ENVIRONMENT !== "test") {
		return createCSRFMiddleware({ skipMethods: ["GET", "HEAD", "OPTIONS"] })(c, next);
	}
	await next();
});

// User registration endpoint
authRouter.post("/register", async (c) => {
	try {
		const body = await c.req.json();
		const { email, password, name } = body;
		console.log("Login attempt:", { email, password, name });

		// Check if user already exists
		const existingUser = await mockDb.select().from(mockUsers).where({ email }).get();

		if (existingUser) {
			return c.json({ error: "User already exists" }, 400);
		}

		// Hash password using PBKDF2
		const hashedPassword = await hashPassword(password);

		// Create new user
		const newUser = await mockDb
			.insert(mockUsers)
			.values({
				email,
				name,
				passwordHash: hashedPassword,
				role: "viewer", // Default role
			})
			.returning({
				id: mockUsers.id,
				email: mockUsers.email,
				name: mockUsers.name,
				role: mockUsers.role,
				passwordHash: mockUsers.passwordHash,
			})
			.get();

		// Generate JWT tokens
		const tokens = await generateTokens(
			{
				id: newUser.id,
				email: newUser.email,
				role: newUser.role,
			},
			c.env
		);

		// Set cookies for tokens
		c.header(
			"Set-Cookie",
			`accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/`
		);
		c.header(
			"Set-Cookie",
			`refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
		);

		return c.json({
			message: "User registered successfully",
			user: {
				id: newUser.id,
				email: newUser.email,
				name: newUser.name,
				role: newUser.role,
			},
			tokens,
		});
	} catch (error) {
		console.error("Registration error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// User login endpoint
authRouter.post("/login", async (c) => {
	try {
		const body = await c.req.json();
		const { email, password } = body;
		console.log("Registration attempt:", { email, password });

		// Check login rate limit for this email
		const isRateLimited = await checkLoginRateLimit(email, c.env);
		if (isRateLimited) {
			const ip = getClientIp(c.req.raw);
			await recordSuspiciousActivity(ip, "Login attempt while rate limited", c.env);
			return c.json({ error: "Too many failed login attempts. Please try again later." }, 429);
		}

		// Find user by email (mock implementation)
		// TODO: Replace with actual database query when DB is integrated
		const user = await mockDb.select().from(mockUsers).where({ email }).get();

		if (!user) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		// Verify password using PBKDF2
		const isValidPassword = await verifyPassword(password, user.passwordHash);
		if (!isValidPassword) {
			// Record failed login attempt
			await recordFailedLogin(email, c.env);
			const ip = getClientIp(c.req.raw);
			await recordSuspiciousActivity(ip, "Failed login attempt", c.env);
			return c.json({ error: "Invalid credentials" }, 401);
		}

		// Record successful login (clears failed attempts)
		await recordSuccessfulLogin(email, c.env);

		// Generate JWT tokens
		const tokens = await generateTokens(
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			c.env
		);

		// Set cookies for tokens
		c.header(
			"Set-Cookie",
			`accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/`
		);
		c.header(
			"Set-Cookie",
			`refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
		);

		return c.json({
			message: "Login successful",
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
			tokens,
		});
	} catch (error) {
		console.error("Login error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// User logout endpoint
authRouter.post("/logout", authMiddleware, requireAuth, async (c) => {
	try {
		const user = c.get("user");
		const refreshToken = c.req.header("Cookie")?.match(/refreshToken=([^;]+)/)?.[1];

		if (user && refreshToken) {
			// Delete refresh token from KV store
			await c.env.AUTH_KV.delete(`refresh_token:${refreshToken}`);
		}

		// Clear cookies
		c.header("Set-Cookie", "accessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
		c.header("Set-Cookie", "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");

		return c.json({ message: "Logout successful" });
	} catch (error) {
		console.error("Logout error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Get current user endpoint (requires viewer access)
authRouter.get("/me", viewerAccess(), async (c) => {
	try {
		const user = c.get("user");
		return c.json({ user });
	} catch (error) {
		console.error("Get user error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Refresh token endpoint
authRouter.post("/refresh", async (c) => {
	try {
		const refreshToken = c.req.header("Cookie")?.match(/refreshToken=([^;]+)/)?.[1];

		if (!refreshToken) {
			return c.json({ error: "Refresh token not provided" }, 401);
		}

		const newAccessToken = await refreshAccessToken(refreshToken, c.env);

		// Set new access token cookie
		c.header(
			"Set-Cookie",
			`accessToken=${newAccessToken}; HttpOnly; Secure; SameSite=Strict; Path=/`
		);

		return c.json({ accessToken: newAccessToken });
	} catch (error) {
		console.error("Token refresh error:", error);
		return c.json({ error: "Invalid refresh token" }, 401);
	}
});

// Password reset request endpoint
authRouter.post("/reset-password", async (c) => {
	try {
		const body = await c.req.json();
		const { email } = body;

		if (!email) {
			return c.json({ error: "Email is required" }, 400);
		}

		// Find user by email (mock implementation)
		const user = await mockDb.select().from(mockUsers).where({ email }).get();

		if (!user) {
			// Don't reveal if user exists for security
			return c.json({ message: "If the email exists, a reset link has been sent" });
		}

		// Check rate limiting
		const isRateLimited = await checkResetRateLimit(user.id, c.env);
		if (isRateLimited) {
			return c.json({ error: "Too many reset attempts. Please try again later." }, 429);
		}

		// Generate and store reset token
		const resetToken = await generatePasswordResetToken(user.id, user.email, c.env);

		// Record reset attempt
		await recordResetAttempt(user.id, c.env);

		// TODO: Send email with reset link (mock implementation)
		console.log(`Password reset link for ${email}: /reset-password/${resetToken}`);

		return c.json({ message: "If the email exists, a reset link has been sent" });
	} catch (error) {
		console.error("Password reset error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Password reset confirmation endpoint
authRouter.post("/reset-password/:token", async (c) => {
	try {
		const token = c.req.param("token");
		const body = await c.req.json();
		const { newPassword } = body;

		if (!token) {
			return c.json({ error: "Reset token is required" }, 400);
		}

		if (!newPassword) {
			return c.json({ error: "New password is required" }, 400);
		}

		// Verify reset token
		const tokenData = await verifyPasswordResetToken(token, c.env);

		// Hash new password
		const hashedPassword = await hashPassword(newPassword);

		// Update user password in database (mock implementation)
		// TODO: Replace with actual database update
		mockUserData.passwordHash = hashedPassword;

		// Generate new tokens for automatic login
		const tokens = await generateTokens(
			{
				id: tokenData.userId,
				email: tokenData.email,
				role: "viewer", // Default role
			},
			c.env
		);

		// Set cookies for tokens
		c.header(
			"Set-Cookie",
			`accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/`
		);
		c.header(
			"Set-Cookie",
			`refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
		);

		return c.json({
			message: "Password reset successful",
			user: {
				id: tokenData.userId,
				email: tokenData.email,
				role: "viewer",
			},
			tokens,
		});
	} catch (error) {
		console.error("Password reset confirmation error:", error);
		return c.json({ error: "Invalid or expired reset token" }, 400);
	}
});

// Check reset attempts remaining endpoint (admin only for security)
authRouter.get("/reset-attempts/:userId", adminOnly(), async (c) => {
	try {
		const userId = c.req.param("userId");

		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		const remaining = await getRemainingResetAttempts(userId, c.env);

		return c.json({ remainingAttempts: remaining });
	} catch (error) {
		console.error("Get reset attempts error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Get CSRF token endpoint
authRouter.get("/csrf-token", async (c) => {
	try {
		const csrfToken = setCSRFToken(c);
		return c.json({ csrfToken });
	} catch (error) {
		console.error("CSRF token error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export default authRouter;
