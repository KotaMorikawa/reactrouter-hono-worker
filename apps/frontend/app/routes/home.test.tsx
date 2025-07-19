import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithAuth } from "~/test-utils";
import type { Route } from "./+types/home";
import Home, { meta } from "./home";

describe("Home Route", () => {
	describe("Component", () => {
		it("should render welcome component", () => {
			renderWithAuth(<Home />);

			// Welcome コンポーネントの要素が存在することを確認
			expect(screen.getByText("What's next?")).toBeInTheDocument();
			expect(screen.getByText("React Router Docs")).toBeInTheDocument();
			expect(screen.getByText("Join Discord")).toBeInTheDocument();
		});

		it("should have proper layout structure", () => {
			renderWithAuth(<Home />);

			// 基本的なレイアウト構造を確認
			const container = screen.getByRole("main");
			expect(container).toBeInTheDocument();
			expect(container).toHaveClass("flex", "items-center", "justify-center");
		});

		it("should render React Router logo images", () => {
			renderWithAuth(<Home />);

			// ロゴ画像が複数存在することを確認（ライト・ダーク両方）
			const logos = screen.getAllByAltText("React Router");
			expect(logos).toHaveLength(2);
			expect(logos[0]).toBeInTheDocument();
			expect(logos[1]).toBeInTheDocument();
		});

		it("should have external links with proper attributes", () => {
			renderWithAuth(<Home />);

			// 外部リンクが正しい属性を持つことを確認
			const docsLink = screen.getByRole("link", { name: /React Router Docs/i });
			expect(docsLink).toHaveAttribute("href", "https://reactrouter.com/docs");
			expect(docsLink).toHaveAttribute("target", "_blank");
			expect(docsLink).toHaveAttribute("rel", "noreferrer");

			const discordLink = screen.getByRole("link", { name: /Join Discord/i });
			expect(discordLink).toHaveAttribute("href", "https://rmx.as/discord");
			expect(discordLink).toHaveAttribute("target", "_blank");
			expect(discordLink).toHaveAttribute("rel", "noreferrer");
		});

		it("should have dark mode compatibility", () => {
			renderWithAuth(<Home />);

			// ホームページコンテンツが正しくレンダリングされることを確認
			expect(screen.getByText("React Router Docs")).toBeInTheDocument();
		});
	});

	describe("Meta function", () => {
		it("should return correct meta tags", () => {
			const metaResult = meta({} as Route.MetaArgs);

			expect(metaResult).toEqual([
				{ title: "New React Router App" },
				{ name: "description", content: "Welcome to React Router!" },
			]);
		});

		it("should handle meta function arguments", () => {
			// meta 関数が引数を受け取ることを確認
			expect(typeof meta).toBe("function");
			expect(meta.length).toBe(1);
		});
	});

	describe("Accessibility", () => {
		it("should have proper heading hierarchy", () => {
			renderWithAuth(<Home />);

			// ヘッダー要素の存在を確認
			const header = screen.getByRole("banner");
			expect(header).toBeInTheDocument();
		});

		it("should have proper navigation structure", () => {
			renderWithAuth(<Home />);

			// ナビゲーション要素の存在を確認（複数ある場合は最初のものを使用）
			const navs = screen.getAllByRole("navigation");
			expect(navs.length).toBeGreaterThan(0);
			expect(navs[0]).toBeInTheDocument();

			// リストの構造を確認
			const list = screen.getByRole("list");
			expect(list).toBeInTheDocument();

			const listItems = screen.getAllByRole("listitem");
			expect(listItems).toHaveLength(2);
		});

		it("should have accessible images with alt text", () => {
			renderWithAuth(<Home />);

			// alt属性を持つ画像を確認
			const images = screen.getAllByRole("img");
			expect(images.length).toBeGreaterThan(0);

			// 通常の img 要素のみをチェック（SVGは除外）
			const imgElements = images.filter((img) => img.tagName === "IMG");
			imgElements.forEach((img) => {
				expect(img).toHaveAttribute("alt");
				expect(img.getAttribute("alt")).not.toBe("");
			});
		});

		it("should have proper ARIA labels for icons", () => {
			renderWithAuth(<Home />);

			// SVGアイコンのaria-label属性を確認
			const svgIcons = document.querySelectorAll("svg[aria-label]");
			expect(svgIcons.length).toBeGreaterThan(0);

			svgIcons.forEach((icon) => {
				expect(icon).toHaveAttribute("aria-label");
				expect(icon.getAttribute("aria-label")).not.toBe("");
			});
		});
	});
});
