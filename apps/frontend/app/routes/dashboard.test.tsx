import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Route } from "./+types/dashboard";
import Dashboard, { meta } from "./dashboard";

describe("Dashboard Page", () => {
	describe("Meta function", () => {
		it("should return correct meta tags", () => {
			const metaResult = meta({} as Route.MetaArgs);

			expect(metaResult).toEqual([
				{ title: "ダッシュボード - React Router App" },
				{ name: "description", content: "ユーザーダッシュボード" },
			]);
		});
	});

	describe("Component rendering", () => {
		it("should render main dashboard elements", () => {
			render(<Dashboard />);

			// メインヘッダーの確認
			expect(screen.getByText("ようこそ、ダッシュボードへ")).toBeInTheDocument();
			expect(
				screen.getByText("ここにユーザーの情報やアプリケーションのコンテンツが表示されます。")
			).toBeInTheDocument();
		});

		it("should render all dashboard cards", () => {
			render(<Dashboard />);

			// 3つのダッシュボードカードが存在することを確認
			expect(screen.getByText("統計情報")).toBeInTheDocument();
			expect(screen.getByText("最近の活動")).toBeInTheDocument();
			expect(screen.getByText("設定")).toBeInTheDocument();
		});

		it("should render statistics card with correct content", () => {
			render(<Dashboard />);

			const statsCard = screen.getByText("統計情報");
			expect(statsCard).toBeInTheDocument();
			expect(screen.getByText("ユーザーの活動統計やメトリクスを表示")).toBeInTheDocument();
		});

		it("should render recent activity card with correct content", () => {
			render(<Dashboard />);

			const activityCard = screen.getByText("最近の活動");
			expect(activityCard).toBeInTheDocument();
			expect(screen.getByText("最近のユーザー活動を表示")).toBeInTheDocument();
		});

		it("should render settings card with correct content", () => {
			render(<Dashboard />);

			const settingsCard = screen.getByText("設定");
			expect(settingsCard).toBeInTheDocument();
			expect(screen.getByText("アカウント設定とプリファレンス")).toBeInTheDocument();
		});
	});

	describe("Layout and styling", () => {
		it("should have proper container structure", () => {
			render(<Dashboard />);

			// メインコンテナが存在することを確認
			const container = document.querySelector(".py-6.sm\\:px-6.lg\\:px-8");
			expect(container).toBeInTheDocument();
		});

		it("should have responsive grid layout", () => {
			render(<Dashboard />);

			// グリッドレイアウトのコンテナが存在することを確認
			const gridContainer = document.querySelector(".grid.grid-cols-1.gap-6.md\\:grid-cols-3");
			expect(gridContainer).toBeInTheDocument();
		});

		it("should have dark mode support", () => {
			render(<Dashboard />);

			// ダークモード対応のクラスが存在することを確認
			const mainCard = document.querySelector(".bg-white.dark\\:bg-gray-800");
			expect(mainCard).toBeInTheDocument();

			const statsCard = document.querySelector(".bg-blue-50.dark\\:bg-blue-900\\/20");
			expect(statsCard).toBeInTheDocument();

			const activityCard = document.querySelector(".bg-green-50.dark\\:bg-green-900\\/20");
			expect(activityCard).toBeInTheDocument();

			const settingsCard = document.querySelector(".bg-purple-50.dark\\:bg-purple-900\\/20");
			expect(settingsCard).toBeInTheDocument();
		});

		it("should use proper color schemes for each card", () => {
			render(<Dashboard />);

			// 統計情報カード（青）
			const statsTitle = screen.getByText("統計情報");
			expect(statsTitle).toHaveClass("text-blue-900", "dark:text-blue-100");

			// 最近の活動カード（緑）
			const activityTitle = screen.getByText("最近の活動");
			expect(activityTitle).toHaveClass("text-green-900", "dark:text-green-100");

			// 設定カード（紫）
			const settingsTitle = screen.getByText("設定");
			expect(settingsTitle).toHaveClass("text-purple-900", "dark:text-purple-100");
		});
	});

	describe("Accessibility", () => {
		it("should have proper heading hierarchy", () => {
			render(<Dashboard />);

			// メインヘッダー（h2）の確認
			const mainHeading = screen.getByRole("heading", { level: 2 });
			expect(mainHeading).toHaveTextContent("ようこそ、ダッシュボードへ");

			// サブヘッダー（h3）の確認
			const subHeadings = screen.getAllByRole("heading", { level: 3 });
			expect(subHeadings).toHaveLength(3);
			expect(subHeadings[0]).toHaveTextContent("統計情報");
			expect(subHeadings[1]).toHaveTextContent("最近の活動");
			expect(subHeadings[2]).toHaveTextContent("設定");
		});

		it("should have readable text with proper contrast", () => {
			render(<Dashboard />);

			// テキストが適切なコントラストクラスを持つことを確認
			const mainText = screen.getByText(
				"ここにユーザーの情報やアプリケーションのコンテンツが表示されます。"
			);
			expect(mainText).toHaveClass("text-gray-600", "dark:text-gray-400");
		});

		it("should be semantically structured", () => {
			render(<Dashboard />);

			// セマンティックな構造の確認
			const headings = screen.getAllByRole("heading");
			expect(headings).toHaveLength(4); // h2 + 3つのh3

			// 各カードが適切な構造を持つことを確認
			const allText = document.body.textContent;
			expect(allText).toContain("統計情報");
			expect(allText).toContain("最近の活動");
			expect(allText).toContain("設定");
		});
	});

	describe("Content structure", () => {
		it("should display welcome message prominently", () => {
			render(<Dashboard />);

			const welcomeMessage = screen.getByText("ようこそ、ダッシュボードへ");
			expect(welcomeMessage).toBeInTheDocument();
			expect(welcomeMessage).toHaveClass("font-bold", "text-2xl");
		});

		it("should display description text", () => {
			render(<Dashboard />);

			const description = screen.getByText(
				"ここにユーザーの情報やアプリケーションのコンテンツが表示されます。"
			);
			expect(description).toBeInTheDocument();
			expect(description).toHaveClass("mb-6");
		});

		it("should organize content in cards", () => {
			render(<Dashboard />);

			// カードが適切に配置されていることを確認
			const cardTitles = ["統計情報", "最近の活動", "設定"];
			const cardDescriptions = [
				"ユーザーの活動統計やメトリクスを表示",
				"最近のユーザー活動を表示",
				"アカウント設定とプリファレンス",
			];

			cardTitles.forEach((title) => {
				expect(screen.getByText(title)).toBeInTheDocument();
			});

			cardDescriptions.forEach((description) => {
				expect(screen.getByText(description)).toBeInTheDocument();
			});
		});
	});

	describe("Responsive design", () => {
		it("should have responsive classes", () => {
			render(<Dashboard />);

			// レスポンシブデザインのクラスが存在することを確認
			const outerContainer = document.querySelector(".py-6.sm\\:px-6.lg\\:px-8");
			expect(outerContainer).toBeInTheDocument();

			const innerContainer = document.querySelector(".px-4.py-6.sm\\:px-0");
			expect(innerContainer).toBeInTheDocument();

			const gridContainer = document.querySelector(".grid-cols-1.md\\:grid-cols-3");
			expect(gridContainer).toBeInTheDocument();
		});

		it("should handle different screen sizes", () => {
			render(<Dashboard />);

			// モバイル（1列）からデスクトップ（3列）へのグリッド変更
			const grid = document.querySelector(".grid-cols-1.gap-6.md\\:grid-cols-3");
			expect(grid).toBeInTheDocument();
		});
	});

	describe("Visual design", () => {
		it("should have proper spacing and padding", () => {
			render(<Dashboard />);

			// メインカードのパディング
			const mainCard = document.querySelector(".p-8");
			expect(mainCard).toBeInTheDocument();

			// 個別カードのパディング
			const cards = document.querySelectorAll(".p-6");
			expect(cards).toHaveLength(3);
		});

		it("should have rounded corners and shadows", () => {
			render(<Dashboard />);

			// メインカードの角丸とシャドウ
			const mainCard = document.querySelector(".rounded-lg.shadow");
			expect(mainCard).toBeInTheDocument();

			// 個別カードの角丸
			const roundedCards = document.querySelectorAll(".rounded-lg");
			expect(roundedCards.length).toBeGreaterThanOrEqual(4); // メイン + 3つのカード
		});

		it("should use consistent typography", () => {
			render(<Dashboard />);

			// メインタイトルのタイポグラフィ
			const mainTitle = screen.getByText("ようこそ、ダッシュボードへ");
			expect(mainTitle).toHaveClass("font-bold", "text-2xl");

			// カードタイトルのタイポグラフィ
			const cardTitles = screen.getAllByRole("heading", { level: 3 });
			cardTitles.forEach((title) => {
				expect(title).toHaveClass("font-semibold", "text-lg");
			});
		});
	});

	describe("User experience", () => {
		it("should provide clear navigation cues", () => {
			render(<Dashboard />);

			// ユーザーが何をできるかが明確であることを確認
			expect(screen.getByText("統計情報")).toBeInTheDocument();
			expect(screen.getByText("最近の活動")).toBeInTheDocument();
			expect(screen.getByText("設定")).toBeInTheDocument();
		});

		it("should display helpful descriptions", () => {
			render(<Dashboard />);

			// 各セクションが何をするかの説明が存在
			expect(screen.getByText("ユーザーの活動統計やメトリクスを表示")).toBeInTheDocument();
			expect(screen.getByText("最近のユーザー活動を表示")).toBeInTheDocument();
			expect(screen.getByText("アカウント設定とプリファレンス")).toBeInTheDocument();
		});

		it("should have centered layout for better focus", () => {
			render(<Dashboard />);

			// 中央揃えのレイアウト
			const centeredContainer = document.querySelector(".text-center");
			expect(centeredContainer).toBeInTheDocument();
		});
	});
});
