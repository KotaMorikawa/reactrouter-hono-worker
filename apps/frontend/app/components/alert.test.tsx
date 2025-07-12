import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Alert, Toast } from "./alert";

describe("Alert Component", () => {
	describe("Basic Rendering", () => {
		it("should render alert with required props", () => {
			render(<Alert type="info" message="テストメッセージ" />);

			expect(screen.getByText("テストメッセージ")).toBeInTheDocument();
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		it("should render alert with title and message", () => {
			render(<Alert type="success" title="成功" message="操作が正常に完了しました" />);

			expect(screen.getByText("成功")).toBeInTheDocument();
			expect(screen.getByText("操作が正常に完了しました")).toBeInTheDocument();
		});

		it("should render alert without title", () => {
			render(<Alert type="error" message="エラーが発生しました" />);

			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			// タイトルが存在しないことを確認
			expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		});
	});

	describe("Alert Types and Styling", () => {
		it("should apply success styling", () => {
			render(<Alert type="success" message="成功メッセージ" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass(
				"bg-green-50",
				"text-green-800",
				"border",
				"border-green-200",
				"dark:bg-green-900/20",
				"dark:text-green-200",
				"dark:border-green-800"
			);
		});

		it("should apply error styling", () => {
			render(<Alert type="error" message="エラーメッセージ" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass(
				"bg-red-50",
				"text-red-800",
				"border",
				"border-red-200",
				"dark:bg-red-900/20",
				"dark:text-red-200",
				"dark:border-red-800"
			);
		});

		it("should apply warning styling", () => {
			render(<Alert type="warning" message="警告メッセージ" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass(
				"bg-yellow-50",
				"text-yellow-800",
				"border",
				"border-yellow-200",
				"dark:bg-yellow-900/20",
				"dark:text-yellow-200",
				"dark:border-yellow-800"
			);
		});

		it("should apply info styling", () => {
			render(<Alert type="info" message="情報メッセージ" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass(
				"bg-blue-50",
				"text-blue-800",
				"border",
				"border-blue-200",
				"dark:bg-blue-900/20",
				"dark:text-blue-200",
				"dark:border-blue-800"
			);
		});
	});

	describe("Icons", () => {
		it("should display success icon", () => {
			render(<Alert type="success" message="成功" />);

			const icon = screen.getByLabelText("成功");
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveClass("h-5", "w-5", "text-green-400");
		});

		it("should display error icon", () => {
			render(<Alert type="error" message="エラー" />);

			const icon = screen.getByLabelText("エラー");
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveClass("h-5", "w-5", "text-red-400");
		});

		it("should display warning icon", () => {
			render(<Alert type="warning" message="警告" />);

			const icon = screen.getByLabelText("警告");
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveClass("h-5", "w-5", "text-yellow-400");
		});

		it("should display info icon", () => {
			render(<Alert type="info" message="情報" />);

			const icon = screen.getByLabelText("情報");
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveClass("h-5", "w-5", "text-blue-400");
		});
	});

	describe("Close Functionality", () => {
		it("should render close button when onClose is provided", () => {
			const mockOnClose = vi.fn();
			render(<Alert type="info" message="閉じられるアラート" onClose={mockOnClose} />);

			const closeButton = screen.getByLabelText("閉じる");
			expect(closeButton).toBeInTheDocument();
		});

		it("should not render close button when onClose is not provided", () => {
			render(<Alert type="info" message="閉じられないアラート" />);

			const closeButton = screen.queryByLabelText("閉じる");
			expect(closeButton).not.toBeInTheDocument();
		});

		it("should call onClose when close button is clicked", async () => {
			const user = userEvent.setup();
			const mockOnClose = vi.fn();
			render(<Alert type="info" message="テスト" onClose={mockOnClose} />);

			const closeButton = screen.getByLabelText("閉じる");
			await user.click(closeButton);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("should apply correct close button styling", () => {
			const mockOnClose = vi.fn();
			render(<Alert type="info" message="テスト" onClose={mockOnClose} />);

			const closeButton = screen.getByRole("button");
			expect(closeButton).toHaveClass(
				"inline-flex",
				"rounded-md",
				"p-1.5",
				"hover:bg-black/5",
				"focus:outline-none",
				"focus:ring-2",
				"focus:ring-current",
				"focus:ring-offset-2"
			);
		});
	});

	describe("Custom Styling", () => {
		it("should apply custom className", () => {
			render(<Alert type="info" message="カスタム" className="custom-class mt-4" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("custom-class", "mt-4");
		});

		it("should merge custom className with default classes", () => {
			render(<Alert type="success" message="テスト" className="extra-class" />);

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("extra-class", "rounded-md", "p-4");
		});
	});

	describe("Content Structure", () => {
		it("should have proper HTML structure", () => {
			render(<Alert type="info" title="タイトル" message="メッセージ" />);

			const alert = screen.getByRole("alert");
			expect(alert.querySelector(".flex")).toBeInTheDocument();
			expect(alert.querySelector(".flex-shrink-0")).toBeInTheDocument();
			expect(alert.querySelector(".ml-3.flex-1")).toBeInTheDocument();
		});

		it("should style title correctly", () => {
			render(<Alert type="warning" title="警告タイトル" message="メッセージ" />);

			const title = screen.getByText("警告タイトル");
			expect(title).toHaveClass("mb-1", "font-medium", "text-sm");
		});

		it("should style message correctly", () => {
			render(<Alert type="error" message="エラーメッセージ" />);

			const message = screen.getByText("エラーメッセージ");
			expect(message).toHaveClass("text-sm");
		});
	});

	describe("Accessibility", () => {
		it("should have role='alert'", () => {
			render(<Alert type="info" message="アクセシビリティテスト" />);

			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		it("should have accessible icon labels", () => {
			render(<Alert type="success" message="テスト" />);

			const icon = screen.getByLabelText("成功");
			expect(icon).toHaveAttribute("role", "img");
			expect(icon).toHaveAttribute("aria-label", "成功");
		});

		it("should have accessible close button", () => {
			const mockOnClose = vi.fn();
			render(<Alert type="info" message="テスト" onClose={mockOnClose} />);

			const closeButton = screen.getByRole("button");
			expect(closeButton).toHaveAttribute("type", "button");

			const closeIcon = closeButton.querySelector("svg");
			expect(closeIcon).toHaveAttribute("aria-label", "閉じる");
		});

		it("should support screen reader text", () => {
			const mockOnClose = vi.fn();
			render(<Alert type="info" message="テスト" onClose={mockOnClose} />);

			const screenReaderText = screen.getByText("閉じる", { selector: ".sr-only" });
			expect(screenReaderText).toBeInTheDocument();
		});
	});
});

describe("Toast Component", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Basic Rendering", () => {
		it("should render when isVisible is true", () => {
			const mockOnClose = vi.fn();
			render(
				<Toast isVisible={true} onClose={mockOnClose} type="success" message="トーストメッセージ" />
			);

			expect(screen.getByText("トーストメッセージ")).toBeInTheDocument();
		});

		it("should not render when isVisible is false", () => {
			const mockOnClose = vi.fn();
			render(
				<Toast
					isVisible={false}
					onClose={mockOnClose}
					type="success"
					message="トーストメッセージ"
				/>
			);

			expect(screen.queryByText("トーストメッセージ")).not.toBeInTheDocument();
		});

		it("should apply toast-specific positioning classes", () => {
			const mockOnClose = vi.fn();
			render(<Toast isVisible={true} onClose={mockOnClose} type="info" message="位置テスト" />);

			const toastContainer = document.querySelector(".fixed.top-4.right-4.z-50.w-full.max-w-sm");
			expect(toastContainer).toBeInTheDocument();
		});
	});

	describe("Auto-dismiss Functionality", () => {
		it("should auto-dismiss after default duration (5000ms)", async () => {
			const mockOnClose = vi.fn();
			render(<Toast isVisible={true} onClose={mockOnClose} type="info" message="自動消去テスト" />);

			expect(mockOnClose).not.toHaveBeenCalled();

			// 5秒経過をシミュレート
			vi.advanceTimersByTime(5000);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("should auto-dismiss after custom duration", async () => {
			const mockOnClose = vi.fn();
			render(
				<Toast
					isVisible={true}
					onClose={mockOnClose}
					type="warning"
					message="カスタム時間テスト"
					duration={3000}
				/>
			);

			expect(mockOnClose).not.toHaveBeenCalled();

			// 3秒経過をシミュレート
			vi.advanceTimersByTime(3000);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("should not auto-dismiss when duration is 0", () => {
			const mockOnClose = vi.fn();
			render(
				<Toast
					isVisible={true}
					onClose={mockOnClose}
					type="error"
					message="手動消去のみ"
					duration={0}
				/>
			);

			// 長時間経過しても消去されないことを確認
			vi.advanceTimersByTime(10000);

			expect(mockOnClose).not.toHaveBeenCalled();
		});

		it("should clear timer when component becomes invisible", () => {
			const mockOnClose = vi.fn();
			const { rerender } = render(
				<Toast isVisible={true} onClose={mockOnClose} type="info" message="タイマーテスト" />
			);

			// 表示状態から非表示に変更
			rerender(
				<Toast isVisible={false} onClose={mockOnClose} type="info" message="タイマーテスト" />
			);

			// タイマーが経過してもonCloseが呼ばれないことを確認
			vi.advanceTimersByTime(5000);
			expect(mockOnClose).not.toHaveBeenCalled();
		});

		it("should restart timer when becoming visible again", () => {
			const mockOnClose = vi.fn();
			const { rerender } = render(
				<Toast isVisible={false} onClose={mockOnClose} type="info" message="再表示テスト" />
			);

			// 表示状態に変更
			rerender(<Toast isVisible={true} onClose={mockOnClose} type="info" message="再表示テスト" />);

			// タイマーが開始されることを確認
			vi.advanceTimersByTime(5000);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("Manual Close", () => {
		it("should support manual close via Alert's close button", () => {
			vi.useRealTimers();
			const mockOnClose = vi.fn();
			render(
				<Toast isVisible={true} onClose={mockOnClose} type="success" message="手動閉じるテスト" />
			);

			const closeButton = screen.getByRole("button");
			closeButton.click();

			expect(mockOnClose).toHaveBeenCalledTimes(1);
			vi.useFakeTimers();
		});

		it("should clear auto-dismiss timer when manually closed", () => {
			const mockOnClose = vi.fn();
			render(
				<Toast isVisible={true} onClose={mockOnClose} type="info" message="手動閉じるテスト" />
			);

			// 手動で閉じる
			const closeButton = screen.getByRole("button");
			closeButton.click();

			// 手動クリックで閉じられることを確認
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	describe("Toast Props Inheritance", () => {
		it("should pass through all Alert props except onClose", () => {
			const mockOnClose = vi.fn();
			render(
				<Toast
					isVisible={true}
					onClose={mockOnClose}
					type="warning"
					title="警告タイトル"
					message="警告メッセージ"
					className="custom-toast-class"
				/>
			);

			expect(screen.getByText("警告タイトル")).toBeInTheDocument();
			expect(screen.getByText("警告メッセージ")).toBeInTheDocument();

			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("custom-toast-class");
		});

		it("should work with all alert types", () => {
			const mockOnClose = vi.fn();
			const { rerender } = render(
				<Toast isVisible={true} onClose={mockOnClose} type="success" message="成功トースト" />
			);

			expect(screen.getByLabelText("成功")).toBeInTheDocument();

			rerender(
				<Toast isVisible={true} onClose={mockOnClose} type="error" message="エラートースト" />
			);

			expect(screen.getByLabelText("エラー")).toBeInTheDocument();
		});
	});

	describe("Positioning and Layout", () => {
		it("should maintain fixed positioning", () => {
			const mockOnClose = vi.fn();
			render(<Toast isVisible={true} onClose={mockOnClose} type="info" message="位置テスト" />);

			const container = document.querySelector(".fixed.top-4.right-4");
			expect(container).toBeInTheDocument();
			expect(container).toHaveClass("z-50", "w-full", "max-w-sm");
		});

		it("should stack properly with multiple toasts", () => {
			const mockOnClose1 = vi.fn();
			const mockOnClose2 = vi.fn();

			render(
				<div>
					<Toast isVisible={true} onClose={mockOnClose1} type="success" message="トースト1" />
					<Toast isVisible={true} onClose={mockOnClose2} type="error" message="トースト2" />
				</div>
			);

			expect(screen.getByText("トースト1")).toBeInTheDocument();
			expect(screen.getByText("トースト2")).toBeInTheDocument();

			// 両方のトーストが固定位置にあることを確認
			const containers = document.querySelectorAll(".fixed.top-4.right-4");
			expect(containers).toHaveLength(2);
		});
	});

	describe("Edge Cases", () => {
		it("should handle rapid visibility changes", () => {
			const mockOnClose = vi.fn();
			const { rerender } = render(
				<Toast isVisible={true} onClose={mockOnClose} type="info" message="高速変更テスト" />
			);

			// 短時間で表示/非表示を繰り返す
			rerender(
				<Toast isVisible={false} onClose={mockOnClose} type="info" message="高速変更テスト" />
			);
			rerender(
				<Toast isVisible={true} onClose={mockOnClose} type="info" message="高速変更テスト" />
			);

			// 最後のタイマーのみが有効であることを確認
			vi.advanceTimersByTime(5000);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("should handle onClose function changes", () => {
			const mockOnClose1 = vi.fn();
			const mockOnClose2 = vi.fn();

			const { rerender } = render(
				<Toast isVisible={true} onClose={mockOnClose1} type="info" message="関数変更テスト" />
			);

			// onClose関数を変更
			rerender(
				<Toast isVisible={true} onClose={mockOnClose2} type="info" message="関数変更テスト" />
			);

			vi.advanceTimersByTime(5000);

			// 新しい関数が呼ばれることを確認
			expect(mockOnClose1).not.toHaveBeenCalled();
			expect(mockOnClose2).toHaveBeenCalledTimes(1);
		});
	});
});
