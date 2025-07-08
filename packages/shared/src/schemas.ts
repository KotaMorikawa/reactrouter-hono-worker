import { z } from "zod";

// User Management Schemas
export const userSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
	passwordHash: z.string(),
	role: z.enum(["admin", "editor", "viewer", "guest"]),
	createdAt: z.date(),
	updatedAt: z.date(),
	emailVerified: z.boolean(),
	lastLogin: z.date().optional(),
});

export const baseUserSchema = userSchema.omit({ passwordHash: true });

// Role and Permission Schemas
export const roleSchema = z.enum(["admin", "editor", "viewer", "guest"]);

export const permissionSchema = z.object({
	resource: z.string().min(1, "Resource is required"),
	action: z.string().min(1, "Action is required"),
});

export const rolePermissionsSchema = z.record(z.string(), z.array(permissionSchema));

// Authentication Schemas
export const loginRequestSchema = z.object({
	email: z.string().email("Invalid email format"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerRequestSchema = z
	.object({
		email: z.string().email("Invalid email format"),
		name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const tokenPayloadSchema = z.object({
	userId: z.string().uuid(),
	email: z.string().email(),
	role: roleSchema,
	iat: z.number(),
	exp: z.number(),
});

export const authSessionSchema = z.object({
	user: baseUserSchema,
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresAt: z.date(),
});

export const refreshTokenRequestSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

// API Response Schemas
export const apiResponseSchema = z.object({
	success: z.boolean(),
	data: z.any().optional(),
	error: z.string().optional(),
	message: z.string().optional(),
});

export const authResponseSchema = z.object({
	user: baseUserSchema,
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresAt: z.string(),
});

export const paginatedResponseSchema = z.object({
	data: z.array(z.any()),
	total: z.number().min(0),
	page: z.number().min(1),
	limit: z.number().min(1).max(100),
	totalPages: z.number().min(0),
});

// Database Schemas
export const userEntitySchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	name: z.string().min(1).max(100),
	password_hash: z.string(),
	role: roleSchema,
	created_at: z.date(),
	updated_at: z.date(),
	email_verified: z.boolean(),
	last_login: z.date().nullable(),
});

export const sessionEntitySchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	refresh_token: z.string(),
	expires_at: z.date(),
	created_at: z.date(),
});

// API Contract Schemas
export const getUserRequestSchema = z.object({
	userId: z.string().uuid(),
});

export const updateUserRequestSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	email: z.string().email().optional(),
	role: roleSchema.optional(),
});

export const getUsersRequestSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	role: roleSchema.optional(),
	search: z.string().optional(),
});

export const changePasswordRequestSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const forgotPasswordRequestSchema = z.object({
	email: z.string().email("Invalid email format"),
});

export const resetPasswordRequestSchema = z
	.object({
		token: z.string().min(1, "Token is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const verifyEmailRequestSchema = z.object({
	token: z.string().min(1, "Token is required"),
});

// Environment and Configuration Schemas
export const databaseConfigSchema = z.object({
	url: z.string().url(),
	name: z.string().min(1),
});

export const jwtConfigSchema = z.object({
	secret: z.string().min(32, "JWT secret must be at least 32 characters"),
	accessTokenExpiry: z.string().regex(/^\d+[smhd]$/, "Invalid token expiry format"),
	refreshTokenExpiry: z.string().regex(/^\d+[smhd]$/, "Invalid token expiry format"),
});

export const emailConfigSchema = z.object({
	from: z.string().email(),
	smtpHost: z.string().min(1),
	smtpPort: z.number().min(1).max(65535),
	smtpUser: z.string().min(1),
	smtpPassword: z.string().min(1),
});

export const appConfigSchema = z.object({
	port: z.number().min(1).max(65535),
	env: z.enum(["development", "staging", "production"]),
	database: databaseConfigSchema,
	jwt: jwtConfigSchema,
	email: emailConfigSchema,
	corsOrigin: z.array(z.string().url()),
});

// Utility Schemas for common validation patterns
export const emailSchema = z.string().email("Invalid email format");
export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
		"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
	);
export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
});
