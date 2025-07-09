/**
 * Password hashing utilities using Web Crypto API (PBKDF2)
 * Compatible with Cloudflare Workers environment
 */

// Configuration
const SALT_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // OWASP recommendation
const KEY_LENGTH = 32; // 256 bits
const ALGORITHM = "PBKDF2";
const HASH_ALGORITHM = "SHA-256";

/**
 * Hash a password using PBKDF2
 * @param password - The plain text password to hash
 * @returns A string containing the salt and hash in format: salt:hash (both base64 encoded)
 */
export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password cannot be empty");
	}

	// Generate random salt
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

	// Convert password to ArrayBuffer
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);

	// Import password as key
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		passwordData,
		{ name: ALGORITHM },
		false,
		["deriveBits"]
	);

	// Derive key bits using PBKDF2
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: ALGORITHM,
			salt: salt,
			iterations: ITERATIONS,
			hash: HASH_ALGORITHM,
		},
		passwordKey,
		KEY_LENGTH * 8 // bits
	);

	// Convert to base64 for storage
	const saltBase64 = btoa(String.fromCharCode(...salt));
	const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

	// Return combined format
	return `${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The stored hash in format: salt:hash
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	if (!password) {
		throw new Error("Password cannot be empty");
	}

	// Parse the hash format
	const parts = hash.split(":");
	if (parts.length !== 2) {
		throw new Error("Invalid hash format");
	}

	const [saltBase64, hashBase64] = parts;

	try {
		// Decode from base64
		const salt = new Uint8Array(
			atob(saltBase64)
				.split("")
				.map((c) => c.charCodeAt(0))
		);

		// Convert password to ArrayBuffer
		const encoder = new TextEncoder();
		const passwordData = encoder.encode(password);

		// Import password as key
		const passwordKey = await crypto.subtle.importKey(
			"raw",
			passwordData,
			{ name: ALGORITHM },
			false,
			["deriveBits"]
		);

		// Derive key bits using PBKDF2 with the same salt
		const derivedBits = await crypto.subtle.deriveBits(
			{
				name: ALGORITHM,
				salt: salt,
				iterations: ITERATIONS,
				hash: HASH_ALGORITHM,
			},
			passwordKey,
			KEY_LENGTH * 8 // bits
		);

		// Convert to base64 for comparison
		const derivedHashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

		// Constant-time comparison
		return timingSafeEqual(hashBase64, derivedHashBase64);
	} catch (_error) {
		// Invalid hash format or decoding error
		throw new Error("Invalid hash format");
	}
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Generate a random password
 * @param length - The length of the password to generate
 * @returns A random password string
 */
export function generateRandomPassword(length = 16): string {
	const charset =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
	const randomValues = crypto.getRandomValues(new Uint8Array(length));

	let password = "";
	for (const value of randomValues) {
		password += charset[value % charset.length];
	}

	return password;
}

/**
 * Check password strength
 * @param password - The password to check
 * @returns An object with strength score and feedback
 */
export function checkPasswordStrength(password: string): {
	score: number;
	feedback: string[];
} {
	const feedback: string[] = [];
	let score = 0;

	// Length check
	if (password.length >= 8) score += 1;
	if (password.length >= 12) score += 1;
	if (password.length < 8) feedback.push("Password should be at least 8 characters long");

	// Character variety checks
	if (/[a-z]/.test(password)) score += 1;
	else feedback.push("Add lowercase letters");

	if (/[A-Z]/.test(password)) score += 1;
	else feedback.push("Add uppercase letters");

	if (/[0-9]/.test(password)) score += 1;
	else feedback.push("Add numbers");

	if (/[^a-zA-Z0-9]/.test(password)) score += 1;
	else feedback.push("Add special characters");

	// Common patterns to avoid
	if (/(.)\1{2,}/.test(password)) {
		score -= 1;
		feedback.push("Avoid repeating characters");
	}

	if (/^(password|123456|qwerty|abc123)/i.test(password)) {
		score = 0;
		feedback.push("Avoid common passwords");
	}

	return {
		score: Math.max(0, Math.min(5, score)),
		feedback,
	};
}
