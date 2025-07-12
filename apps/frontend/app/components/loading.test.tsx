import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Loading, LoadingSpinner } from "./loading";

describe("Loading Component", () => {
	describe("Basic Rendering", () => {
		it("should render loading component with default props", () => {
			render(<Loading />);

			// デフォルトメッセージの確認
			expect(screen.getByText("読み込み中...")).toBeInTheDocument();

			// スピナーが存在することを確認
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass("h-8", "w-8"); // デフォルトサイズ（md）
		});

		it("should render with custom message", () => {
			const customMessage = "データを取得しています...";
			render(<Loading message={customMessage} />);

			expect(screen.getByText(customMessage)).toBeInTheDocument();
		});

		it("should render with custom size classes", () => {
			const { rerender } = render(<Loading size="sm" />);

			// smallサイズの確認
			let spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-4", "w-4");

			// mediumサイズの確認
			rerender(<Loading size="md" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-8", "w-8");

			// largeサイズの確認
			rerender(<Loading size="lg" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-12", "w-12");
		});
	});

	describe("Full Screen Mode", () => {
		it("should render in full screen mode when fullScreen prop is true", () => {
			render(<Loading fullScreen />);

			// フルスクリーンコンテナの確認
			const fullScreenContainer = document.querySelector(".fixed.inset-0.z-50");
			expect(fullScreenContainer).toBeInTheDocument();
			expect(fullScreenContainer).toHaveClass(
				"flex",
				"items-center",
				"justify-center",
				"bg-gray-50",
				"dark:bg-gray-900"
			);

			// スピナーが存在することを確認
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();

			// メッセージが存在することを確認
			expect(screen.getByText("読み込み中...")).toBeInTheDocument();
		});

		it("should render normal mode when fullScreen prop is false", () => {
			render(<Loading fullScreen={false} />);

			// フルスクリーンコンテナが存在しないことを確認
			const fullScreenContainer = document.querySelector(".fixed.inset-0.z-50");
			expect(fullScreenContainer).not.toBeInTheDocument();

			// 通常のコンテナが存在することを確認
			const normalContainer = document.querySelector(".flex.items-center.justify-center.p-4");
			expect(normalContainer).toBeInTheDocument();
		});

		it("should apply correct styling in full screen mode", () => {
			render(<Loading fullScreen message="フルスクリーン読み込み中" size="lg" />);

			// フルスクリーンの背景確認
			const background = document.querySelector(".fixed.inset-0");
			expect(background).toHaveClass("bg-gray-50", "dark:bg-gray-900");

			// 大きなスピナーサイズの確認
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-12", "w-12");

			// メッセージの確認
			expect(screen.getByText("フルスクリーン読み込み中")).toBeInTheDocument();
		});
	});

	describe("Styling and Layout", () => {
		it("should apply correct spinner classes", () => {
			render(<Loading />);

			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("rounded-full", "border-blue-600", "border-b-2", "mx-auto");
		});

		it("should apply correct text styling in normal mode", () => {
			render(<Loading message="テストメッセージ" />);

			const message = screen.getByText("テストメッセージ");
			expect(message).toHaveClass("mt-2", "text-gray-600", "text-sm", "dark:text-gray-400");
		});

		it("should apply correct text styling in full screen mode", () => {
			render(<Loading fullScreen message="フルスクリーンメッセージ" />);

			const message = screen.getByText("フルスクリーンメッセージ");
			expect(message).toHaveClass("mt-4", "text-gray-600", "dark:text-gray-400");
		});

		it("should center content properly", () => {
			render(<Loading />);

			// 通常モードでのセンタリング確認
			const container = document.querySelector(".flex.items-center.justify-center.p-4");
			expect(container).toBeInTheDocument();

			const textCenter = document.querySelector(".text-center");
			expect(textCenter).toBeInTheDocument();
		});
	});

	describe("Dark Mode Support", () => {
		it("should include dark mode classes in normal mode", () => {
			render(<Loading />);

			const message = screen.getByText("読み込み中...");
			expect(message).toHaveClass("dark:text-gray-400");
		});

		it("should include dark mode classes in full screen mode", () => {
			render(<Loading fullScreen />);

			const background = document.querySelector(".fixed.inset-0");
			expect(background).toHaveClass("dark:bg-gray-900");

			const message = screen.getByText("読み込み中...");
			expect(message).toHaveClass("dark:text-gray-400");
		});
	});

	describe("Accessibility", () => {
		it("should be accessible with screen readers", () => {
			render(<Loading message="データを読み込んでいます" />);

			// テキストが読み上げ可能であることを確認
			expect(screen.getByText("データを読み込んでいます")).toBeInTheDocument();
		});

		it("should provide semantic structure", () => {
			render(<Loading fullScreen />);

			// 適切なHTML構造の確認
			const textCenter = document.querySelector(".text-center");
			expect(textCenter).toBeInTheDocument();
		});
	});
});

describe("LoadingSpinner Component", () => {
	describe("Basic Rendering", () => {
		it("should render spinner with default size", () => {
			render(<LoadingSpinner />);

			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass("h-8", "w-8"); // デフォルトサイズ（md）
		});

		it("should render with different sizes", () => {
			const { rerender } = render(<LoadingSpinner size="sm" />);

			// smallサイズの確認
			let spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-4", "w-4");

			// mediumサイズの確認
			rerender(<LoadingSpinner size="md" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-8", "w-8");

			// largeサイズの確認
			rerender(<LoadingSpinner size="lg" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-12", "w-12");
		});
	});

	describe("Styling", () => {
		it("should apply correct spinner classes", () => {
			render(<LoadingSpinner />);

			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("rounded-full", "border-blue-600", "border-b-2");
		});

		it("should be minimal without text or padding", () => {
			render(<LoadingSpinner />);

			// スピナーのみでテキストがないことを確認
			expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();

			// 直接的なパディングがないことを確認
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).not.toHaveClass("p-4");
		});
	});

	describe("Size Variations", () => {
		it("should handle all size props correctly", () => {
			// small
			const { rerender } = render(<LoadingSpinner size="sm" />);
			let spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-4", "w-4");

			// medium
			rerender(<LoadingSpinner size="md" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-8", "w-8");

			// large
			rerender(<LoadingSpinner size="lg" />);
			spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-12", "w-12");
		});

		it("should default to medium size when no size is provided", () => {
			render(<LoadingSpinner />);

			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toHaveClass("h-8", "w-8");
		});
	});

	describe("Standalone Usage", () => {
		it("should work independently without Loading component", () => {
			render(
				<div>
					<span>カスタムローディング: </span>
					<LoadingSpinner size="sm" />
				</div>
			);

			expect(screen.getByText("カスタムローディング:")).toBeInTheDocument();
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass("h-4", "w-4");
		});

		it("should be embeddable in other components", () => {
			render(
				<button type="button" disabled>
					処理中 <LoadingSpinner size="sm" />
				</button>
			);

			expect(screen.getByText("処理中")).toBeInTheDocument();
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});
	});
});

describe("Component Integration", () => {
	it("should work together in complex layouts", () => {
		render(
			<div>
				<Loading message="メインコンテンツを読み込み中" size="lg" />
				<div className="mt-4">
					<div>
						サブプロセス: <LoadingSpinner size="sm" />
					</div>
				</div>
			</div>
		);

		// メインローディングの確認
		expect(screen.getByText("メインコンテンツを読み込み中")).toBeInTheDocument();

		// サブプロセスの確認
		expect(screen.getByText("サブプロセス:")).toBeInTheDocument();

		// 両方のスピナーが存在することを確認
		const spinners = document.querySelectorAll(".animate-spin");
		expect(spinners).toHaveLength(2);

		// サイズが正しいことを確認
		const largeSpinner = document.querySelector(".h-12.w-12");
		const smallSpinner = document.querySelector(".h-4.w-4");
		expect(largeSpinner).toBeInTheDocument();
		expect(smallSpinner).toBeInTheDocument();
	});

	it("should handle conditional rendering properly", () => {
		const { rerender } = render(
			<div>
				{true && <Loading message="条件付きローディング" />}
				{false && <LoadingSpinner />}
			</div>
		);

		// 最初の状態
		expect(screen.getByText("条件付きローディング")).toBeInTheDocument();
		expect(document.querySelectorAll(".animate-spin")).toHaveLength(1);

		// 条件を変更
		rerender(
			<div>
				{false && <Loading message="条件付きローディング" />}
				{true && <LoadingSpinner />}
			</div>
		);

		// 状態変更後
		expect(screen.queryByText("条件付きローディング")).not.toBeInTheDocument();
		expect(document.querySelectorAll(".animate-spin")).toHaveLength(1);
	});
});
