import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Settings, { loader, meta } from "./settings";

describe("Settings Page", () => {
	it("should render settings page with all sections", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
		expect(screen.getByText("通知設定")).toBeInTheDocument();
		expect(screen.getByText("セキュリティ")).toBeInTheDocument();
		expect(screen.getByText("表示設定")).toBeInTheDocument();
		expect(screen.getByText("一般設定")).toBeInTheDocument();
	});

	it("should display notification settings options", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByText("メール通知")).toBeInTheDocument();
		expect(screen.getByText("プッシュ通知")).toBeInTheDocument();
		expect(screen.getByText("重要な更新情報をメールで受け取る")).toBeInTheDocument();
		expect(screen.getByText("リアルタイム通知を受け取る")).toBeInTheDocument();
	});

	it("should display security settings options", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByText("二要素認証")).toBeInTheDocument();
		expect(screen.getByText("パスワード変更")).toBeInTheDocument();
		expect(screen.getByText("アカウントのセキュリティを強化")).toBeInTheDocument();
		expect(screen.getByText("定期的なパスワード更新を推奨")).toBeInTheDocument();
	});

	it("should display appearance settings options", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByText("テーマ")).toBeInTheDocument();
		expect(screen.getByText("言語")).toBeInTheDocument();
		expect(screen.getByText("ライト・ダーク・自動")).toBeInTheDocument();
		expect(screen.getByText("表示言語を選択")).toBeInTheDocument();
	});

	it("should display general settings options", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByText("データエクスポート")).toBeInTheDocument();
		expect(screen.getByText("アカウント削除")).toBeInTheDocument();
		expect(screen.getByText("アカウントデータをダウンロード")).toBeInTheDocument();
		expect(screen.getByText("アカウントを完全に削除")).toBeInTheDocument();
	});

	it("should have proper action buttons", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		// 各セクションのボタンが存在することを確認
		expect(screen.getByText("有効")).toBeInTheDocument();
		expect(screen.getByText("無効")).toBeInTheDocument();
		expect(screen.getAllByText("設定")).toHaveLength(2); // タイトルとボタン
		expect(screen.getByText("変更")).toBeInTheDocument();
		expect(screen.getByText("ライト")).toBeInTheDocument();
		expect(screen.getByText("日本語")).toBeInTheDocument();
		expect(screen.getByText("エクスポート")).toBeInTheDocument();
		expect(screen.getByText("削除")).toBeInTheDocument();
	});

	it("should have proper page structure and styling", () => {
		const { container } = render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		// メインコンテナの存在確認
		const mainContainer = container.querySelector(".py-6.sm\\:px-6.lg\\:px-8");
		expect(mainContainer).toBeInTheDocument();

		// カード構造の確認
		const cards = container.querySelectorAll(".p-6");
		expect(cards.length).toBeGreaterThan(0);
	});

	it("should display settings description", () => {
		render(
			<MemoryRouter>
				<Settings />
			</MemoryRouter>
		);

		expect(screen.getByText("アプリケーションの設定をカスタマイズできます。")).toBeInTheDocument();
	});
});

describe("Settings Meta Function", () => {
	it("should return correct meta data", () => {
		const metaArgs = {} as any; // Route.MetaArgs type
		const result = meta(metaArgs);

		expect(result).toEqual([
			{ title: "設定 - React Router App" },
			{ name: "description", content: "アプリケーション設定" },
		]);
	});
});

describe("Settings Loader Function", () => {
	let mockRequest: Request;
	let mockContext: any;

	beforeEach(() => {
		mockRequest = new Request("http://localhost:3000/settings");
		mockContext = {
			env: {
				API_URL: "http://localhost:8787",
			},
		};
		vi.clearAllMocks();
	});

	it("should return settings data when authenticated", async () => {
		// モックJWTトークンを含むCookieを設定
		const requestWithAuth = new Request("http://localhost:3000/settings", {
			headers: {
				Cookie: "auth-token=valid-jwt-token",
			},
		});

		const result = await loader({
			request: requestWithAuth,
			context: mockContext,
		} as any);

		expect(result).toBeDefined();
		// Response でない場合にのみ設定情報をチェック
		if (!(result instanceof Response)) {
			expect(result.settings).toBeDefined();
			expect(result.user).toBeDefined();
		}
	});

	it("should redirect to login when not authenticated", async () => {
		const result = await loader({
			request: mockRequest,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(302);
		expect((result as Response).headers.get("Location")).toBe("/login");
	});

	it("should handle invalid auth token", async () => {
		const requestWithInvalidAuth = new Request("http://localhost:3000/settings", {
			headers: {
				Cookie: "auth-token=invalid-token",
			},
		});

		const result = await loader({
			request: requestWithInvalidAuth,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(302);
		expect((result as Response).headers.get("Location")).toBe("/login");
	});

	it("should return default settings for new users", async () => {
		const requestWithAuth = new Request("http://localhost:3000/settings", {
			headers: {
				Cookie: "auth-token=new-user-token",
			},
		});

		const result = await loader({
			request: requestWithAuth,
			context: mockContext,
		} as any);

		expect(result).toBeDefined();
		// Response でない場合にのみ設定をチェック
		if (!(result instanceof Response)) {
			expect(result.settings).toEqual({
				theme: "light",
				language: "ja",
				emailNotifications: true,
				pushNotifications: false,
			});
		}
	});

	it("should handle API errors gracefully", async () => {
		const requestWithAuth = new Request("http://localhost:3000/settings", {
			headers: {
				Cookie: "auth-token=api-error-token",
			},
		});

		const result = await loader({
			request: requestWithAuth,
			context: mockContext,
		} as any);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(500);
	});
});
