import { expect, test } from "@playwright/test";
import {
	clearAuth,
	hasAuthToken,
	loginUser,
	selectors,
	testUsers,
	waitForPageLoad,
} from "./utils/test-helpers";

test.describe("ログインフロー", () => {
	test.beforeEach(async ({ page }) => {
		// 各テストの前に認証状態をクリア
		await clearAuth(page);
	});

	test("正常なログインフローが完了する", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// ページタイトルの確認
		await expect(page).toHaveTitle(/ログイン/);
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");

		// フォーム要素の存在確認
		await expect(page.locator(selectors.emailInput)).toBeVisible();
		await expect(page.locator(selectors.passwordInput)).toBeVisible();
		await expect(page.locator(selectors.loginButton)).toBeVisible();

		// フォーム入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);

		// ログインボタンをクリック
		await page.click(selectors.loginButton);

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");

		// ダッシュボードページの要素確認
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();

		// 認証トークンが保存されていることを確認
		expect(await hasAuthToken(page)).toBe(true);
	});

	test("既にログイン済みユーザーはダッシュボードにリダイレクトされる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// まずログインしてログイン状態にする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログインページに直接アクセス
		await page.goto("/login");

		// 自動的にダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");
	});

	test("メールアドレスが空の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { password } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// パスワードのみ入力
		await page.fill(selectors.passwordInput, password);

		// ログインボタンをクリック
		await page.click(selectors.loginButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=メールアドレスは必須です")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/login");
	});

	test("無効なメールアドレス形式の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { password } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// 無効なメールアドレスを入力
		await page.fill(selectors.emailInput, "invalid-email");
		await page.fill(selectors.passwordInput, password);

		// ログインボタンをクリック
		await page.click(selectors.loginButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=有効なメールアドレスを入力してください")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/login");
	});

	test("パスワードが空の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { email } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// メールアドレスのみ入力
		await page.fill(selectors.emailInput, email);

		// ログインボタンをクリック
		await page.click(selectors.loginButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=パスワードは必須です")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/login");
	});

	test("間違った認証情報の場合はエラーメッセージが表示される", async ({ page }) => {
		const { email, password } = testUsers.invalidUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// 間違った認証情報を入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);

		// ログインボタンをクリック
		await page.click(selectors.loginButton);

		// エラーメッセージが表示されることを確認（実際のAPIエラーメッセージに依存）
		// 注意: 現在はモック実装なので、実際のAPIと異なる可能性があります
		await expect(page.locator(selectors.errorAlert)).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/login");

		// 認証トークンが保存されていないことを確認
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("ユーザー登録ページへのリンクが動作する", async ({ page }) => {
		await page.goto("/login");
		await waitForPageLoad(page);

		// ユーザー登録ページへのリンクをクリック
		await page.click('a[href="/register"]');

		// ユーザー登録ページに遷移することを確認
		await expect(page).toHaveURL("/register");
		await expect(page.locator("h1, h2").first()).toContainText("新しいアカウントを作成");
	});

	test("フォーム送信中はボタンが無効化される", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// フォーム入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);

		// ログインボタンをクリック
		const loginButton = page.locator(selectors.loginButton);
		await loginButton.click();

		// ボタンのテキストが変更されることを確認（送信中）
		await expect(loginButton).toContainText("ログイン中...");
		await expect(loginButton).toBeDisabled();
	});

	test("エラーメッセージが5秒後に自動的に消える", async ({ page }) => {
		const { email, password } = testUsers.invalidUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// 間違った認証情報を入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.click(selectors.loginButton);

		// エラーメッセージが表示されることを確認
		await expect(page.locator(selectors.errorAlert)).toBeVisible();

		// 6秒後（clearError のタイマーより少し長く）にエラーが消えることを確認
		await page.waitForTimeout(6000);
		await expect(page.locator(selectors.errorAlert)).not.toBeVisible();
	});

	test("アクセシビリティ要素が適切に設定されている", async ({ page }) => {
		await page.goto("/login");
		await waitForPageLoad(page);

		// フォーム要素のラベルとautocomplete属性を確認
		await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible();
		await expect(page.locator('label:has-text("パスワード")')).toBeVisible();

		// autocomplete属性の確認
		await expect(page.locator(selectors.emailInput)).toHaveAttribute("autocomplete", "email");
		await expect(page.locator(selectors.passwordInput)).toHaveAttribute(
			"autocomplete",
			"current-password"
		);

		// type属性の確認
		await expect(page.locator(selectors.emailInput)).toHaveAttribute("type", "email");
		await expect(page.locator(selectors.passwordInput)).toHaveAttribute("type", "password");
	});

	test("Enterキーでフォーム送信ができる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		await page.goto("/login");
		await waitForPageLoad(page);

		// フォーム入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);

		// パスワードフィールドでEnterキーを押す
		await page.press(selectors.passwordInput, "Enter");

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");

		// 認証トークンが保存されていることを確認
		expect(await hasAuthToken(page)).toBe(true);
	});

	test("ブラウザのバック/フォワードボタンが正常に動作する", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ホームページから開始
		await page.goto("/");
		await waitForPageLoad(page);

		// ログインページに移動
		await page.goto("/login");
		await waitForPageLoad(page);

		// ログイン実行
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.click(selectors.loginButton);
		await expect(page).toHaveURL("/dashboard");

		// バックボタンでナビゲーション（認証済みなのでダッシュボードに戻される）
		await page.goBack();
		await expect(page).toHaveURL("/dashboard");

		// フォワードボタンでナビゲーション
		await page.goForward();
		await expect(page).toHaveURL("/dashboard");
	});
});
