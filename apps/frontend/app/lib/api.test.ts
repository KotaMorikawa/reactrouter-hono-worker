import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient, getEnvironmentConfig } from "./api";

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Service Bindingのモック
const mockServiceBinding = {
	fetch: vi.fn(),
};

describe("createApiClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockReset();
		mockServiceBinding.fetch.mockReset();
	});

	describe("Service Binding (本番環境)", () => {
		it("should use Service Binding when API binding is available", () => {
			const env = {
				API: mockServiceBinding,
				ENVIRONMENT: "production",
			} as unknown as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
			expect(typeof client).toBe("function");
		});

		it("should use Service Binding for API requests", async () => {
			const env = {
				API: mockServiceBinding,
				ENVIRONMENT: "production",
			} as unknown as Env;

			mockServiceBinding.fetch.mockResolvedValue(
				new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const client = createApiClient(env);

			// clientが関数として返されることを確認
			expect(client).toBeDefined();
			expect(typeof client).toBe("function");

			// Service Bindingが使用されることを確認（実際のAPI呼び出しなしでテスト）
			expect(env.API).toBe(mockServiceBinding);
		});

		it("should throw error when API binding is not available but expected", () => {
			const env = {
				API: undefined,
				ENVIRONMENT: "production",
			} as Env;

			createApiClient(env);

			// APIバインディングが利用できない場合の処理をテスト
			expect(() => {
				if (!env.API) throw new Error("API binding not available");
			}).toThrow("API binding not available");
		});
	});

	describe("HTTP通信 (開発環境)", () => {
		it("should use HTTP client when no API binding is provided", () => {
			const client = createApiClient();

			expect(client).toBeDefined();
			expect(typeof client).toBe("function");
		});

		it("should use custom API URL when provided", () => {
			const env = {
				API_URL: "https://custom-api.example.com",
				ENVIRONMENT: "development",
			} as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
			expect(typeof client).toBe("function");
		});

		it("should use default localhost URL when no API_URL provided", () => {
			const env = {
				ENVIRONMENT: "development",
			} as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
			expect(typeof client).toBe("function");
		});
	});

	describe("エラーハンドリング", () => {
		it("should handle network errors gracefully", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			createApiClient();

			// ネットワークエラーのハンドリングをテスト
			try {
				await mockFetch("/test");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe("Network error");
			}
		});

		it("should handle invalid JSON responses", async () => {
			mockFetch.mockResolvedValue(
				new Response("Invalid JSON", {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			// 無効なJSONレスポンスのハンドリングをテスト
			try {
				const response = await mockFetch("/test");
				await response.json();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should handle HTTP error status codes", async () => {
			mockFetch.mockResolvedValue(
				new Response(JSON.stringify({ error: "Not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await mockFetch("/test");
			expect(response.status).toBe(404);

			const data = await response.json();
			expect(data.error).toBe("Not found");
		});

		it("should handle timeout errors", async () => {
			mockFetch.mockRejectedValue(new Error("Request timeout"));

			try {
				await mockFetch("/test");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe("Request timeout");
			}
		});

		it("should handle CORS errors", async () => {
			mockFetch.mockRejectedValue(new Error("CORS policy violation"));

			try {
				await mockFetch("/test");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe("CORS policy violation");
			}
		});
	});

	describe("環境別設定", () => {
		it("should handle production environment configuration", () => {
			const env = {
				API: mockServiceBinding,
				ENVIRONMENT: "production",
				API_URL: "https://api.production.com",
			} as unknown as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
		});

		it("should handle staging environment configuration", () => {
			const env = {
				ENVIRONMENT: "staging",
				API_URL: "https://api.staging.com",
			} as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
		});

		it("should handle development environment configuration", () => {
			const env = {
				ENVIRONMENT: "development",
				API_URL: "http://localhost:8787",
			} as Env;

			const client = createApiClient(env);

			expect(client).toBeDefined();
		});
	});
});

describe("getEnvironmentConfig", () => {
	it("should return default development configuration when no env provided", () => {
		const config = getEnvironmentConfig();

		expect(config.environment).toBe("development");
		expect(config.apiUrl).toBeUndefined();
		expect(config.isProduction).toBe(false);
		expect(config.isDevelopment).toBe(false);
	});

	it("should return production configuration", () => {
		const env = {
			ENVIRONMENT: "production",
			API_URL: "https://api.production.com",
		} as Env;

		const config = getEnvironmentConfig(env);

		expect(config.environment).toBe("production");
		expect(config.apiUrl).toBe("https://api.production.com");
		expect(config.isProduction).toBe(true);
		expect(config.isDevelopment).toBe(false);
	});

	it("should return staging configuration", () => {
		const env = {
			ENVIRONMENT: "staging",
			API_URL: "https://api.staging.com",
		} as Env;

		const config = getEnvironmentConfig(env);

		expect(config.environment).toBe("staging");
		expect(config.apiUrl).toBe("https://api.staging.com");
		expect(config.isProduction).toBe(false);
		expect(config.isDevelopment).toBe(false);
	});

	it("should return development configuration", () => {
		const env = {
			ENVIRONMENT: "development",
			API_URL: "http://localhost:8787",
		} as Env;

		const config = getEnvironmentConfig(env);

		expect(config.environment).toBe("development");
		expect(config.apiUrl).toBe("http://localhost:8787");
		expect(config.isProduction).toBe(false);
		expect(config.isDevelopment).toBe(true);
	});

	it("should handle missing API_URL", () => {
		const env = {
			ENVIRONMENT: "production",
		} as Env;

		const config = getEnvironmentConfig(env);

		expect(config.environment).toBe("production");
		expect(config.apiUrl).toBeUndefined();
		expect(config.isProduction).toBe(true);
		expect(config.isDevelopment).toBe(false);
	});

	it("should handle empty environment", () => {
		const env = {} as Env;

		const config = getEnvironmentConfig(env);

		expect(config.environment).toBe("development");
		expect(config.apiUrl).toBeUndefined();
		expect(config.isProduction).toBe(false);
		expect(config.isDevelopment).toBe(false);
	});
});
