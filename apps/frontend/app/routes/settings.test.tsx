import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Settings from "./settings";

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
