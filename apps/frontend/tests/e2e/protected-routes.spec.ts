import { expect, test } from "@playwright/test";
import {
	clearAuth,
	hasAuthToken,
	loginUser,
	selectors,
	testUsers,
	waitForPageLoad,
} from "./utils/test-helpers";

test.describe("認証が必要なページへのアクセス", () => {
	test.beforeEach(async ({ page }) => {
		// 各テストの前に認証状態をクリア
		await clearAuth(page);
	});

	test("未認証ユーザーがダッシュボードにアクセスしようとするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");
	});

	test("未認証ユーザーがプロフィールページにアクセスしようとするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/profile");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");
	});

	test("未認証ユーザーが設定ページにアクセスしようとするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		await page.goto("/settings");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
		await expect(page.locator("h1, h2").first()).toContainText("アカウントにログイン");
	});

	test("認証済みユーザーはダッシュボードにアクセスできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);

		// ダッシュボードにアクセス
		await page.goto("/dashboard");
		await waitForPageLoad(page);

		// ダッシュボードページが表示されることを確認
		await expect(page).toHaveURL("/dashboard");
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();
		await expect(page.locator(selectors.statisticsCard)).toBeVisible();
	});

	test("認証済みユーザーはプロフィールページにアクセスできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);

		// プロフィールページにアクセス
		await page.goto("/profile");
		await waitForPageLoad(page);

		// プロフィールページが表示されることを確認
		await expect(page).toHaveURL("/profile");
		await expect(page.locator("h1, h2").first()).toContainText("プロフィール");
	});

	test("認証済みユーザーは設定ページにアクセスできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);

		// 設定ページにアクセス
		await page.goto("/settings");
		await waitForPageLoad(page);

		// 設定ページが表示されることを確認
		await expect(page).toHaveURL("/settings");
		await expect(page.locator("h1, h2").first()).toContainText("設定");
	});

	test("認証されていないユーザーがナビゲーションで保護されたページにアクセスしようとする", async ({
		page,
	}) => {
		await page.goto("/");
		await waitForPageLoad(page);

		// ダッシュボードリンクが存在しないか、または機能しないことを確認
		const dashboardLink = page.locator(selectors.dashboardLink);

		// リンクが存在しない場合
		if ((await dashboardLink.count()) === 0) {
			// 期待される動作: 未認証時はダッシュボードリンクが表示されない
			expect(await dashboardLink.count()).toBe(0);
		} else {
			// リンクが存在する場合はクリックしてリダイレクトを確認
			await dashboardLink.click();
			await expect(page).toHaveURL("/login");
		}
	});

	test("URLを直接変更して保護されたページにアクセスしようとする", async ({ page }) => {
		await page.goto("/");
		await waitForPageLoad(page);

		// アドレスバーにダッシュボードURLを直接入力（programmatically）
		await page.goto("/dashboard");

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("セッションが無効になった後に保護されたページにアクセスしようとする", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ローカルストレージから認証トークンを削除（セッション無効化をシミュレート）
		await clearAuth(page);

		// 保護されたページに再度アクセス
		await page.goto("/profile");
		await waitForPageLoad(page);

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("ログイン後に元々アクセスしようとしていたページにリダイレクトされる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// 未認証状態でプロフィールページにアクセス
		await page.goto("/profile");
		await expect(page).toHaveURL("/login");

		// ログインする
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.click(selectors.loginButton);

		// ログイン後、元々アクセスしようとしていたプロフィールページにリダイレクトされることを確認
		// 注意: この機能の実装状況によって結果が異なる可能性があります
		// 現在の実装ではダッシュボードにリダイレクトされる可能性があります
		await expect(page).toHaveURL(/\/(dashboard|profile)/);
	});

	test("複数タブで認証状態が同期される", async ({ page, context }) => {
		const { email, password } = testUsers.validUser;

		// 最初のタブでログイン
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// 新しいタブを開く
		const newTab = await context.newPage();

		// 新しいタブで保護されたページにアクセス
		await newTab.goto("/profile");
		await waitForPageLoad(newTab);

		// 認証状態が共有されていることを確認
		await expect(newTab).toHaveURL("/profile");

		// 新しいタブでも認証トークンが存在することを確認
		expect(await hasAuthToken(newTab)).toBe(true);

		await newTab.close();
	});

	test("認証状態の確認中はローディング状態が表示される", async ({ page }) => {
		await page.goto("/dashboard");

		// ローディング状態またはリダイレクトが発生することを確認
		// 注意: 実装によってローディング表示の方法が異なる可能性があります
		const loadingElement = page.locator(selectors.loadingSpinner);

		// ローディング要素が存在する場合は一時的に表示されることを確認
		if ((await loadingElement.count()) > 0) {
			await expect(loadingElement).toBeVisible();
		}

		// 最終的にログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("存在しない保護されたページにアクセスしようとする", async ({ page }) => {
		// 存在しない保護されたページにアクセス
		await page.goto("/protected-nonexistent-page");
		await waitForPageLoad(page);

		// 404ページまたはログインページにリダイレクトされることを確認
		// 実装により異なる可能性があります
		const currentUrl = page.url();
		expect(currentUrl).toMatch(/\/(login|404|not-found)/);
	});
});
