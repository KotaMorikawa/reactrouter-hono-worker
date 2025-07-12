import { expect, test } from "@playwright/test";
import {
	clearAuth,
	hasAuthToken,
	loginUser,
	logoutUser,
	selectors,
	testUsers,
	waitForPageLoad,
} from "./utils/test-helpers";

test.describe("ログアウトフロー", () => {
	test.beforeEach(async ({ page }) => {
		// 各テストの前に認証状態をクリア
		await clearAuth(page);
	});

	test("デスクトップ版でログアウトボタンをクリックしてログアウトできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログアウトボタンが表示されることを確認
		const logoutButton = page.locator('button:has-text("ログアウト")').first();
		await expect(logoutButton).toBeVisible();

		// ユーザー名が表示されることを確認
		await expect(page.locator('span:has-text("テストユーザー")')).toBeVisible();

		// ログアウトボタンをクリック
		await logoutButton.click();

		// ホームページにリダイレクトされることを確認
		await expect(page).toHaveURL("/");

		// 認証トークンが削除されていることを確認
		expect(await hasAuthToken(page)).toBe(false);

		// ログインボタンが表示されることを確認（認証状態がクリアされた証拠）
		await expect(page.locator('a[href="/login"]')).toBeVisible();
		await expect(page.locator('a[href="/register"]')).toBeVisible();
	});

	test("モバイル版でログアウトボタンをクリックしてログアウトできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// モバイルビューポートに設定
		await page.setViewportSize({ width: 375, height: 667 });

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// モバイルメニューボタンをクリック
		const menuButton = page.locator('button[aria-label="メニューを開く"]');
		await expect(menuButton).toBeVisible();
		await menuButton.click();

		// モバイルメニューが開かれることを確認
		await expect(page.locator("text=こんにちは、テストユーザーさん")).toBeVisible();

		// モバイル版のログアウトボタンをクリック
		const mobileLogoutButton = page.locator('button:has-text("ログアウト")').last();
		await expect(mobileLogoutButton).toBeVisible();
		await mobileLogoutButton.click();

		// ホームページにリダイレクトされることを確認
		await expect(page).toHaveURL("/");

		// 認証トークンが削除されていることを確認
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("ログアウト後に保護されたページにアクセスしようとするとログインページにリダイレクトされる", async ({
		page,
	}) => {
		const { email, password } = testUsers.validUser;

		// ログインしてダッシュボードに移動
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログアウト
		await logoutUser(page);
		await expect(page).toHaveURL("/");

		// 保護されたページにアクセスしようとする
		await page.goto("/dashboard");

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL("/login");
	});

	test("ログアウト後にナビゲーションが正しく更新される", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// 認証済みナビゲーション要素の確認
		await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
		await expect(page.locator('a[href="/profile"]')).toBeVisible();
		await expect(page.locator('a[href="/settings"]')).toBeVisible();
		await expect(page.locator('button:has-text("ログアウト")')).toBeVisible();

		// ログインリンクが表示されていないことを確認
		await expect(page.locator('a[href="/login"]')).not.toBeVisible();
		await expect(page.locator('a[href="/register"]')).not.toBeVisible();

		// ログアウト
		await logoutUser(page);
		await expect(page).toHaveURL("/");

		// 未認証ナビゲーション要素の確認
		await expect(page.locator('a[href="/login"]')).toBeVisible();
		await expect(page.locator('a[href="/register"]')).toBeVisible();

		// 認証が必要なリンクが表示されていないことを確認
		await expect(page.locator('a[href="/dashboard"]')).not.toBeVisible();
		await expect(page.locator('a[href="/profile"]')).not.toBeVisible();
		await expect(page.locator('a[href="/settings"]')).not.toBeVisible();
		await expect(page.locator('button:has-text("ログアウト")')).not.toBeVisible();
	});

	test("ログアウト後に再度ログインできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// 最初のログイン
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログアウト
		await logoutUser(page);
		await expect(page).toHaveURL("/");

		// 再度ログイン
		await page.goto("/login");
		await page.fill(selectors.emailInput, email);
		await page.fill(selectors.passwordInput, password);
		await page.click(selectors.loginButton);

		// 再度ダッシュボードにアクセスできることを確認
		await expect(page).toHaveURL("/dashboard");
		await expect(page.locator(selectors.dashboardTitle)).toBeVisible();

		// 認証トークンが再度保存されていることを確認
		expect(await hasAuthToken(page)).toBe(true);
	});

	test("複数タブでログアウトした場合、他のタブの認証状態も無効になる", async ({
		page,
		context,
	}) => {
		const { email, password } = testUsers.validUser;

		// 最初のタブでログイン
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// 新しいタブを開き、保護されたページにアクセス
		const newTab = await context.newPage();
		await newTab.goto("/profile");
		await waitForPageLoad(newTab);
		await expect(newTab).toHaveURL("/profile");

		// 最初のタブでログアウト
		await logoutUser(page);
		await expect(page).toHaveURL("/");

		// 新しいタブで保護されたページにアクセスしようとする
		await newTab.goto("/dashboard");

		// ログインページにリダイレクトされることを確認
		await expect(newTab).toHaveURL("/login");

		// 新しいタブでも認証トークンが削除されていることを確認
		expect(await hasAuthToken(newTab)).toBe(false);

		await newTab.close();
	});

	test("ブラウザの戻るボタンでログアウト前の状態に戻ろうとしても認証が無効", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインしてダッシュボードに移動
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// プロフィールページに移動
		await page.goto("/profile");
		await expect(page).toHaveURL("/profile");

		// ログアウト
		await logoutUser(page);
		await expect(page).toHaveURL("/");

		// ブラウザの戻るボタンを使用
		await page.goBack();

		// ログインページにリダイレクトされることを確認（認証が無効なため）
		await expect(page).toHaveURL("/login");
	});

	test("ログアウトボタンにキーボードでアクセスできる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// Tabキーでログアウトボタンにフォーカス
		const logoutButton = page.locator('button:has-text("ログアウト")').first();
		await logoutButton.focus();

		// Enterキーでログアウト
		await page.keyboard.press("Enter");

		// ログアウトが実行されることを確認
		await expect(page).toHaveURL("/");
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("ログアウト処理中にページを離れても認証状態がクリアされる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ログアウトボタンをクリックし、即座に別のページに移動
		const logoutButton = page.locator('button:has-text("ログアウト")').first();
		await logoutButton.click();

		// 即座に別のページに移動（ログアウト処理を中断）
		await page.goto("/");

		// 認証トークンが削除されていることを確認
		await page.waitForTimeout(1000); // 少し待機
		expect(await hasAuthToken(page)).toBe(false);
	});

	test("ログアウト中にエラーが発生してもローカルの認証状態はクリアされる", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインする
		await loginUser(page, email, password);
		await expect(page).toHaveURL("/dashboard");

		// ネットワークを無効化してログアウトAPIエラーをシミュレート
		await page.route("**/logout", (route) => route.abort());

		// ログアウトボタンをクリック
		const logoutButton = page.locator('button:has-text("ログアウト")').first();
		await logoutButton.click();

		// ローカルの認証状態がクリアされることを確認
		await expect(page).toHaveURL("/");
		expect(await hasAuthToken(page)).toBe(false);
	});
});
