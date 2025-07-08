// Shared utility functions, constants, and helper functions
import type { ApiResponse, Role } from "./types";

// Constants
export const ROLES = {
	ADMIN: "admin",
	EDITOR: "editor",
	VIEWER: "viewer",
	GUEST: "guest",
} as const;

export const PERMISSIONS = {
	// User Management
	USERS_CREATE: "users.create",
	USERS_READ: "users.read",
	USERS_UPDATE: "users.update",
	USERS_DELETE: "users.delete",
	// Authentication
	AUTH_LOGIN: "auth.login",
	AUTH_LOGOUT: "auth.logout",
	AUTH_REFRESH: "auth.refresh",
	// Profile Management
	PROFILE_READ: "profile.read",
	PROFILE_UPDATE: "profile.update",
	PROFILE_DELETE: "profile.delete",
	// System Administration
	SYSTEM_ADMIN: "system.admin",
	SYSTEM_CONFIG: "system.config",
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
	admin: [
		PERMISSIONS.USERS_CREATE,
		PERMISSIONS.USERS_READ,
		PERMISSIONS.USERS_UPDATE,
		PERMISSIONS.USERS_DELETE,
		PERMISSIONS.AUTH_LOGIN,
		PERMISSIONS.AUTH_LOGOUT,
		PERMISSIONS.AUTH_REFRESH,
		PERMISSIONS.PROFILE_READ,
		PERMISSIONS.PROFILE_UPDATE,
		PERMISSIONS.PROFILE_DELETE,
		PERMISSIONS.SYSTEM_ADMIN,
		PERMISSIONS.SYSTEM_CONFIG,
	],
	editor: [
		PERMISSIONS.USERS_READ,
		PERMISSIONS.USERS_UPDATE,
		PERMISSIONS.AUTH_LOGIN,
		PERMISSIONS.AUTH_LOGOUT,
		PERMISSIONS.AUTH_REFRESH,
		PERMISSIONS.PROFILE_READ,
		PERMISSIONS.PROFILE_UPDATE,
		PERMISSIONS.PROFILE_DELETE,
	],
	viewer: [
		PERMISSIONS.USERS_READ,
		PERMISSIONS.AUTH_LOGIN,
		PERMISSIONS.AUTH_LOGOUT,
		PERMISSIONS.AUTH_REFRESH,
		PERMISSIONS.PROFILE_READ,
		PERMISSIONS.PROFILE_UPDATE,
	],
	guest: [PERMISSIONS.AUTH_LOGIN, PERMISSIONS.PROFILE_READ],
};

export const TOKEN_EXPIRY = {
	ACCESS_TOKEN: "15m",
	REFRESH_TOKEN: "7d",
	RESET_TOKEN: "1h",
	VERIFY_TOKEN: "24h",
} as const;

export const API_ENDPOINTS = {
	// Authentication
	AUTH_LOGIN: "/api/auth/login",
	AUTH_REGISTER: "/api/auth/register",
	AUTH_LOGOUT: "/api/auth/logout",
	AUTH_REFRESH: "/api/auth/refresh",
	AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
	AUTH_RESET_PASSWORD: "/api/auth/reset-password",
	AUTH_VERIFY_EMAIL: "/api/auth/verify-email",
	// Users
	USERS_LIST: "/api/users",
	USERS_CREATE: "/api/users",
	USERS_GET: "/api/users/:id",
	USERS_UPDATE: "/api/users/:id",
	USERS_DELETE: "/api/users/:id",
	USERS_CHANGE_PASSWORD: "/api/users/:id/change-password",
	// Profile
	PROFILE_GET: "/api/profile",
	PROFILE_UPDATE: "/api/profile",
	PROFILE_DELETE: "/api/profile",
} as const;

export const PAGINATION_DEFAULTS = {
	PAGE: 1,
	LIMIT: 10,
	MAX_LIMIT: 100,
} as const;

export const PASSWORD_REQUIREMENTS = {
	MIN_LENGTH: 8,
	MAX_LENGTH: 128,
	REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
	ERROR_MESSAGE:
		"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
} as const;

// Date and Time Utilities
export const formatDate = (date: Date): string => {
	return date.toISOString().split("T")[0];
};

export const formatDateTime = (date: Date): string => {
	return date.toISOString();
};

export const parseDate = (dateString: string): Date => {
	return new Date(dateString);
};

export const isDateExpired = (date: Date): boolean => {
	return date.getTime() < Date.now();
};

export const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

export const addMinutes = (date: Date, minutes: number): Date => {
	const result = new Date(date);
	result.setMinutes(result.getMinutes() + minutes);
	return result;
};

// Password Validation Utilities
export const validatePassword = (password: string): boolean => {
	return (
		password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH &&
		password.length <= PASSWORD_REQUIREMENTS.MAX_LENGTH &&
		PASSWORD_REQUIREMENTS.REGEX.test(password)
	);
};

export const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
	if (password.length < 8) return "weak";

	let score = 0;
	if (/[a-z]/.test(password)) score++;
	if (/[A-Z]/.test(password)) score++;
	if (/\d/.test(password)) score++;
	if (/[@$!%*?&]/.test(password)) score++;
	if (password.length >= 12) score++;

	if (score < 3) return "weak";
	if (score < 5) return "medium";
	return "strong";
};

// Role and Permission Utilities
export const hasPermission = (userRole: Role, permission: string): boolean => {
	return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
};

export const canAccessResource = (userRole: Role, resource: string, action: string): boolean => {
	const permission = `${resource}.${action}`;
	return hasPermission(userRole, permission);
};

export const getRoleLevel = (role: Role): number => {
	const roleLevels = {
		guest: 0,
		viewer: 1,
		editor: 2,
		admin: 3,
	};
	return roleLevels[role] ?? 0;
};

export const isRoleHigherOrEqual = (userRole: Role, requiredRole: Role): boolean => {
	return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};

export const getAllowedRoles = (userRole: Role): Role[] => {
	const userLevel = getRoleLevel(userRole);
	return Object.keys(ROLE_PERMISSIONS).filter(
		(role) => getRoleLevel(role as Role) <= userLevel
	) as Role[];
};

// API Response Utilities
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => {
	return {
		success: true,
		data,
		message,
	};
};

export const createErrorResponse = (error: string, message?: string): ApiResponse => {
	return {
		success: false,
		error,
		message,
	};
};

export const createPaginatedResponse = <T>(
	data: T[],
	total: number,
	page: number,
	limit: number
) => {
	const totalPages = Math.ceil(total / limit);
	return {
		data,
		total,
		page,
		limit,
		totalPages,
	};
};

// JWT Token Utilities
export const parseJwtPayload = (token: string): unknown => {
	try {
		const payload = token.split(".")[1];
		return JSON.parse(atob(payload));
	} catch {
		return null;
	}
};

export const isTokenExpired = (token: string): boolean => {
	const payload = parseJwtPayload(token) as { exp?: number };
	if (!payload || !payload.exp) return true;
	return payload.exp * 1000 < Date.now();
};

export const getTokenExpirationDate = (token: string): Date | null => {
	const payload = parseJwtPayload(token) as { exp?: number };
	if (!payload || !payload.exp) return null;
	return new Date(payload.exp * 1000);
};

// String Utilities
export const capitalizeFirst = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const camelToSnake = (str: string): string => {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (str: string): string => {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const slugify = (str: string): string => {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
};

// Validation Utilities
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
};

export const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>]/g, "");
};

// Array Utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
	return [...new Set(array)];
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
	return array.reduce(
		(groups, item) => {
			const groupKey = String(item[key]);
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(item);
			return groups;
		},
		{} as Record<string, T[]>
	);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] => {
	return [...array].sort((a, b) => {
		const aValue = a[key];
		const bValue = b[key];

		if (aValue < bValue) return direction === "asc" ? -1 : 1;
		if (aValue > bValue) return direction === "asc" ? 1 : -1;
		return 0;
	});
};

// Error Handling Utilities
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
	try {
		return JSON.parse(json);
	} catch {
		return defaultValue;
	}
};

export const asyncSafeCall = async <T>(fn: () => Promise<T>, defaultValue: T): Promise<T> => {
	try {
		return await fn();
	} catch {
		return defaultValue;
	}
};

// Crypto Utilities (basic helpers)
export const generateRandomString = (length: number): string => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const generateId = (): string => {
	return `${Date.now()}-${generateRandomString(8)}`;
};

// Environment Utilities
export const isDevelopment = (): boolean => {
	return process.env.NODE_ENV === "development";
};

export const isProduction = (): boolean => {
	return process.env.NODE_ENV === "production";
};

export const getEnvVar = (name: string, defaultValue?: string): string => {
	return process.env[name] ?? defaultValue ?? "";
};
