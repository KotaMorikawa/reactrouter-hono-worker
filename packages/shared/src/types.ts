// Core type definitions for authentication, user management, and API contracts

// User Management Types
export interface User {
	id: string;
	email: string;
	name: string;
	passwordHash: string;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
	emailVerified: boolean;
	lastLogin?: Date;
}

export interface BaseUser {
	id: string;
	email: string;
	name: string;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
	emailVerified: boolean;
	lastLogin?: Date;
}

// Role and Permission Types
export type Role = "admin" | "editor" | "viewer" | "guest";

export interface Permission {
	resource: string;
	action: string;
}

export interface RolePermissions {
	[key: string]: Permission[];
}

// Authentication Types
export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	name: string;
	password: string;
	confirmPassword: string;
}

export interface TokenPayload {
	userId: string;
	email: string;
	role: Role;
	iat: number;
	exp: number;
}

export interface AuthSession {
	user: BaseUser;
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface AuthResponse {
	user: BaseUser;
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// Database Types
export interface UserEntity {
	id: string;
	email: string;
	name: string;
	password_hash: string;
	role: Role;
	created_at: Date;
	updated_at: Date;
	email_verified: boolean;
	last_login: Date | null;
}

export interface SessionEntity {
	id: string;
	user_id: string;
	refresh_token: string;
	expires_at: Date;
	created_at: Date;
}

// API Contract Types
export interface GetUserRequest {
	userId: string;
}

export interface UpdateUserRequest {
	name?: string;
	email?: string;
	role?: Role;
}

export interface GetUsersRequest {
	page?: number;
	limit?: number;
	role?: Role;
	search?: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	newPassword: string;
	confirmPassword: string;
}

export interface VerifyEmailRequest {
	token: string;
}

// Environment and Configuration Types
export interface DatabaseConfig {
	url: string;
	name: string;
}

export interface JwtConfig {
	secret: string;
	accessTokenExpiry: string;
	refreshTokenExpiry: string;
}

export interface EmailConfig {
	from: string;
	smtpHost: string;
	smtpPort: number;
	smtpUser: string;
	smtpPassword: string;
}

export interface AppConfig {
	port: number;
	env: "development" | "staging" | "production";
	database: DatabaseConfig;
	jwt: JwtConfig;
	email: EmailConfig;
	corsOrigin: string[];
}
