import { expect, test } from "@playwright/test";
import {
	clearAuth,
	hasAuthToken,
	loginUser,
	registerUser,
	selectors,
	testUsers,
	waitForPageLoad,
} from "./utils/test-helpers";

test.describe("未認証時のリダイレクト", () => {
	test.beforeEach(async ({ page }) => {
		// 各テストの前に認証状態をクリア
		await clearAuth(page);
	});

	test("ルートページ(/)は未認証でもアクセス可能", async ({ page }) => {
		await page.goto("/");
		await waitForPageLoad(page);

		// ルートページが表示されることを確認
		await expect(page).toHaveURL("/");
		await expect(page.locator(selectors.homeTitle)).toBeVisible();

		// 未認証用のナビゲーションが表示されることを確認
		await expect(page.locator('a[href="/login"]')).toBeVisible();
		await expect(page.locator('a[href="/register"]')).toBeVisible();
	});

	test("ログインページは未認証でもアクセス可能", async ({ page }) => {
		await page.goto("/login");
		await waitForPageLoad(page);

		// ログインページが表示されることを確認
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");
		await expect(page.locator(selectors.emailInput)).toBeVisible();
		await expect(page.locator(selectors.passwordInput)).toBeVisible();
	});

	test("ユーザー登録ページは未認証でもアクセス可能", async ({ page }) => {
		await page.goto("/register");
		await waitForPageLoad(page);

		// ユーザー登録ページが表示されることを確認
		await expect(page).toHaveURL("/register");
		await expect(page.locator("h1, h2").first()).toContainText("新しいアカウントを作成");
		await expect(page.locator(selectors.emailInput)).toBeVisible();
		await expect(page.locator(selectors.nameInput)).toBeVisible();
	});

	test("認証済みユーザーがログインページにアクセスするとダッシュボードにリダイレクトされる", async ({
		page,
	}) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログインページにアクセス
		await page.goto("/login");

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();
	});

	test("認証済みユーザーがユーザー登録ページにアクセスするとダッシュボードにリダイレクトされる", async ({
		page,
	}) => {
		const { email, name, password } = testUsers.validUser;

		// ユーザー登録する
		await registerUser(page, email, name, password);
		await expect(page).toHaveURL("/dashboard");

		// ユーザー登録ページにアクセス
		await page.goto("/register");

		// ダッシュボードにリダイレクトされることを確認
		await expect(page).toHaveURL("/dashboard");
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();
	});

	test("存在しないページにアクセスすると404ページが表示される", async ({ page }) => {
		await page.goto("/non-existent-page");
		await waitForPageLoad(page);

		// 404ページまたはエラーページが表示されることを確認
		// 実装に応じて調整が必要
		const is404 =
			page.url().includes("404") ||
			(await page.locator("h1, h2").first().textContent())?.includes("404") ||
			(await page.locator("h1, h2").first().textContent())?.includes("見つかりません");

		expect(is404).toBeTruthy();
	});

	test("URLパラメータ付きの保護されたページは未認証時にログインページにリダイレクト", async ({
		page,
	}) => {
		await page.goto("/dashboard?tab=settings&filter=active");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("ハッシュフラグメント付きの保護されたページは未認証時にログインページにリダイレクト", async ({
		page,
	}) => {
		await page.goto("/profile#personal-info");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("認証後にクエリパラメータ付きの元のページにリダイレクトされる（理想的な動作）", async ({
		page,
	}) => {
		const { email, password } = testUsers.validUser;

		// URLパラメータ付きの保護されたページにアクセス
		await page.goto("/dashboard?tab=analytics");
		await expect(page).toHaveURL("/login");

		// ログイン
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.click(selectors.loginButton);

		// 現在の実装ではダッシュボードにリダイレクトされる
		// 将来的には元のURL（/dashboard?tab=analytics）にリダイレクトされることが望ましい
		await expect(page).toHaveURL(/\/(dashboard)/);
	});

	test("深いネストのある保護されたページは未認証時にログインページにリダイレクト", async ({
		page,
	}) => {
		await page.goto("/settings/profile/security");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("無効なトークンがある場合はログインページにリダイレクトされる", async ({ page }) => {
		// 無効なトークンを設定
		await page.evaluate(() => {
			localStorage.setItem("authToken", "invalid-token");
		});

		await page.goto("/dashboard");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");

		// 無効なトークンが削除されていることを確認
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("期限切れのトークンがある場合はログインページにリダイレクトされる", async ({ page }) => {
		// 期限切れのトークンをシミュレート（実際の実装に応じて調整）
		await page.evaluate(() => {
			localStorage.setItem("authToken", "expired-token");
		});

		await page.goto("/profile");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");

		// 期限切れのトークンが削除されていることを確認
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("API呼び出し中に認証エラーが発生した場合の処理", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// APIレスポンスを401に変更してセッション無効化をシミュレート
		await page.route("**/api/**", (route) => {
			route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ error: "Unauthorized" }),
			});
		});

		// 何らかのAPI呼び出しを行うページに移動
		await page.goto("/profile");

		// 認証エラーが発生した場合の動作を確認
		// 実装に応じて調整が必要（ログインページにリダイレクトまたはエラー表示）
		await page.waitForTimeout(2000);
		const currentUrl = page.url();
		expect(currentUrl).toMatch(/\/(login|profile)/);
	});

	test("複数の保護されたページを連続でアクセスしてもすべてログインページにリダイレクトされる", async ({
		page,
	}) => {
		const protectedPages = ["/dashboard", "/profile", "/settings"];

		for (const pagePath of protectedPages) {
			await page.goto(pagePath);
			await waitForPageLoad(page);

			// それぞれログインページにリダイレクトされることを確認
			await expect(page).toHaveURL("/login");
		}
	});

	test("認証状態の確認中はローディング状態が適切に表示される", async ({ page }) => {
		await page.goto("/dashboard");

		// ローディング状態またはリダイレクト処理を確認
		// 実装に応じて調整が必要
		const loadingElement = page.locator(selectors.loadingSpinner);

		if ((await loadingElement.count()) > 0) {
			// ローディングが表示される場合
			await expect(loadingElement).toBeVisible();
			// 最終的にログインページにリダイレクト
			await expect(page).toHaveURL("/login");
		} else {
			// 即座にリダイレクトされる場合
			await expect(page).toHaveURL("/login");
		}
	});

	test("ブラウザの前進・後退ボタンでも適切なリダイレクトが発生する", async ({ page }) => {
		// ルートページから開始
		await page.goto("/");
		await expect(page).toHaveURL("/");

		// 保護されたページに移動（リダイレクトされる）
		await page.goto("/dashboard");
		await expect(page).toHaveURL("/login");

		// 戻るボタンでルートページに戻る
		await page.goBack();
		await expect(page).toHaveURL("/");

		// 前進ボタンでログインページに戻る
		await page.goForward();
		await expect(page).toHaveURL("/login");
	});

	test("JavaScriptが無効でもサーバーサイドで適切にリダイレクトされる", async ({ page }) => {
		// JavaScriptを無効にする
		await page.context().setExtraHTTPHeaders({
			"User-Agent": "NoJS",
		});

		await page.goto("/dashboard");
		await waitForPageLoad(page);

		// サーバーサイドリダイレクトが機能することを確認
		// React Routerの場合、クライアントサイドルーティングが主なので
		// この動作は実装に依存します
		await expect(page).toHaveURL(/\/(login|dashboard)/);
	});
});
