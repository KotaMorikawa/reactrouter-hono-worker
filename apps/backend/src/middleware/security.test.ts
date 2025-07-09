import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import type { Env } from "../index";
import {
	ipBlockingMiddleware,
	rateLimitMiddleware,
	securityHeaders,
	suspiciousActivityMiddleware,
} from "./security";

describe("Security Middleware", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		app = new Hono<{ Bindings: Env }>();
	});

	describe("securityHeaders", () => {
		it("should add security headers to response", async () => {
			app.use("*", securityHeaders);
			app.get("/test", (c) => c.json({ message: "test" }));

			const res = await app.request("/test");

			expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(res.headers.get("X-Frame-Options")).toBe("DENY");
			expect(res.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
			expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
			expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
		});

		it("should not interfere with response body", async () => {
			app.use("*", securityHeaders);
			app.get("/test", (c) => c.json({ message: "test" }));

			const res = await app.request("/test");
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data).toEqual({ message: "test" });
		});
	});

	describe("rateLimitMiddleware", () => {
		it("should be a function", () => {
			const middleware = rateLimitMiddleware();

			expect(typeof middleware).toBe("function");
		});
	});

	describe("ipBlockingMiddleware", () => {
		it("should be a function", () => {
			const middleware = ipBlockingMiddleware();

			expect(typeof middleware).toBe("function");
		});
	});

	describe("suspiciousActivityMiddleware", () => {
		it("should be a function", () => {
			const middleware = suspiciousActivityMiddleware();

			expect(typeof middleware).toBe("function");
		});
	});
});
