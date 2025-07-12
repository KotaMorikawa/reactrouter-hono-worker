import { expect, test } from "@playwright/test";
import {
	clearAuth,
	hasAuthToken,
	registerUser,
	selectors,
	testUsers,
	waitForPageLoad,
} from "./utils/test-helpers";

test.describe("ユーザー登録フロー", () => {
	test.beforeEach(async ({ page }) => {
		// 各テストの前に認証状態をクリア
		await clearAuth(page);
	});

	test("正常な登録フローが完了する", async ({ page }) => {
		const { email, name, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// ページタイトルの確認
		await expect(page).toHaveTitle(/ユーザー登録/);
		await expect(page.locator("h1, h2").first()).toContainText("新しいアカウントを作成");

		// フォーム要素の存在確認
		await expect(page.locator(selectors.emailInput)).toBeVisible();
		await expect(page.locator(selectors.nameInput)).toBeVisible();
		await expect(page.locator(selectors.passwordInput)).toBeVisible();
		await expect(page.locator(selectors.confirmPasswordInput)).toBeVisible();
		await expect(page.locator(selectors.registerButton)).toBeVisible();

		// フォーム入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, password);

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");

		// ダッシュボードページの要素確認
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();

		// 認証トークンが保存されていることを確認
		expect(await hasAuthToken(page)).toBe(true);
	});

	test("既にログイン済みユーザーはダッシュボードにリダイレクトされる", async ({ page }) => {
		const { email, name, password } = testUsers.validUser;

		// まず登録してログイン状態にする
		await registerUser(page, email, name, password);
		await expect(page).toHaveURL("/dashboard");

		// 登録ページに直接アクセス
		await page.goto("/register");

		// 自動的にダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");
	});

	test("メールアドレスが空の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { name, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// 名前とパスワードのみ入力
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, password);

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=メールアドレスは必須です")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/register");
	});

	test("無効なメールアドレス形式の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { name, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// 無効なメールアドレスを入力
		await page.fill(selectors.emailInput, "invalid-email");
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, password);

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=有効なメールアドレスを入力してください")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/register");
	});

	test("名前が空の場合はバリデーションエラーが表示される", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// メールとパスワードのみ入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, password);

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=名前は必須です")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/register");
	});

	test("パスワードが短い場合はバリデーションエラーが表示される", async ({ page }) => {
		const { email, name } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// 短いパスワードを入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, "123");
		await page.fill(selectors.confirmPasswordInput, "123");

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=パスワードは8文字以上で入力してください")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/register");
	});

	test("パスワード確認が一致しない場合はバリデーションエラーが表示される", async ({ page }) => {
		const { email, name, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// パスワード確認を異なる値で入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, "DifferentPassword123!");

		// 登録ボタンをクリック
		await page.click(selectors.registerButton);

		// バリデーションエラーが表示されることを確認
		await expect(page.locator("text=パスワードが一致しません")).toBeVisible();

		// ページが変わらないことを確認
		await expect(page).toHaveURL("/register");
	});

	test("ログインページへのリンクが動作する", async ({ page }) => {
		await page.goto("/register");
		await waitForPageLoad(page);

		// ログインページへのリンクをクリック
		await page.click('a[href="/login"]');

		// ログインページに遷移することを確認
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");
	});

	test("フォーム送信中はボタンが無効化される", async ({ page }) => {
		const { email, name, password } = testUsers.validUser;

		await page.goto("/register");
		await waitForPageLoad(page);

		// フォーム入力
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.nameInput, name);
		await page.fill(selectors.passwordInput, password);
		await page.fill(selectors.confirmPasswordInput, password);

		// 登録ボタンをクリック
		const registerButton = page.locator(selectors.registerButton);
		await registerButton.click();

		// ボタンのテキストが変更されることを確認（送信中）
		await expect(registerButton).toContainText("登録中...");
		await expect(registerButton).toBeDisabled();
	});

	test("アクセシビリティ要素が適切に設定されている", async ({ page }) => {
		await page.goto("/register");
		await waitForPageLoad(page);

		// フォーム要素のラベルとautocomplete属性を確認
		await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible();
		await expect(page.locator('label:has-text("お名前")')).toBeVisible();
		await expect(page.locator('label:has-text("パスワード")')).toBeVisible();
		await expect(page.locator('label:has-text("パスワード確認")')).toBeVisible();

		// autocomplete属性の確認
		await expect(page.locator(selectors.emailInput)).toHaveAttribute("autocomplete", "email");
		await expect(page.locator(selectors.nameInput)).toHaveAttribute("autocomplete", "name");
		await expect(page.locator(selectors.passwordInput)).toHaveAttribute(
			"autocomplete",
			"new-password"
		);
		await expect(page.locator(selectors.confirmPasswordInput)).toHaveAttribute(
			"autocomplete",
			"new-password"
		);
	});
});
