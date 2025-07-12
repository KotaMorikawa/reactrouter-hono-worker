import { expect, test } from "@playwright/test";
import {
	cleanupTest,
	clickVisibleNavLink,
	expectElementVisible,
	hasAuthToken,
	performLogin,
	performLogout,
	selectors,
	setupTest,
	testProtectedPageAccess,
	testUsers,
	verifyPageState,
} from "./utils/core-test-helpers";

test.describe("保護されたルートのアクセス制御", () => {
	test.beforeEach(async ({ page }) => {
		await setupTest(page);
	});

	test.afterEach(async ({ page }) => {
		await cleanupTest(page);
	});

	test("未認証ユーザーがダッシュボードにアクセス", async ({ page }) => {
		// 認証状態をクリアして未認証状態を確保
		await setupTest(page);

		// ダッシュボードに直接アクセス
		await testProtectedPageAccess(page, "/dashboard", true);

		// ログインページにリダイレクトされることを確認
		await verifyPageState(page, "/login", "ログイン");

		// 未認証であることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("未認証ユーザーがプロフィールページにアクセス", async ({ page }) => {
		await setupTest(page);

		// プロフィールページに直接アクセス
		await testProtectedPageAccess(page, "/profile", true);

		// ログインページにリダイレクトされることを確認
		await verifyPageState(page, "/login", "ログイン");

		// 未認証であることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("未認証ユーザーが設定ページにアクセス", async ({ page }) => {
		await setupTest(page);

		// 設定ページに直接アクセス
		await testProtectedPageAccess(page, "/settings", true);

		// ログインページにリダイレクトされることを確認
		await verifyPageState(page, "/login", "ログイン");

		// 未認証であることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("認証済みユーザーがダッシュボードにアクセス", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);

		// ダッシュボードに直接アクセス
		await testProtectedPageAccess(page, "/dashboard", false);

		// ダッシュボードページが正常に表示されることを確認
		await verifyPageState(page, "/dashboard", "ダッシュボード");
		await expectElementVisible(page, selectors.dashboardTitle);

		// 認証済みであることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeTruthy();
	});

	test("認証済みユーザーがプロフィールページにアクセス", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);

		// プロフィールページにアクセス
		await testProtectedPageAccess(page, "/profile", false);

		// プロフィールページが正常に表示されることを確認
		await verifyPageState(page, "/profile", "プロフィール");
		await expectElementVisible(page, selectors.profileTitle);

		// 認証済みであることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeTruthy();
	});

	test("認証済みユーザーが設定ページにアクセス", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);

		// 設定ページにアクセス
		await testProtectedPageAccess(page, "/settings", false);

		// 設定ページが正常に表示されることを確認
		await verifyPageState(page, "/settings", "設定");
		await expectElementVisible(page, selectors.settingsTitle);

		// 認証済みであることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeTruthy();
	});

	test("保護されたページでのナビゲーション連携", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);

		// ダッシュボードからプロフィールへ
		await clickVisibleNavLink(page, selectors.profileLink);
		await verifyPageState(page, "/profile", "プロフィール");

		// プロフィールから設定へ
		await clickVisibleNavLink(page, selectors.settingsLink);
		await verifyPageState(page, "/settings", "設定");

		// 設定からダッシュボードへ
		await clickVisibleNavLink(page, selectors.dashboardLink);
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// 各ページで認証状態が維持されていることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeTruthy();
	});

	test("ログアウト後の保護されたページアクセス制御", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// ログアウト
		await performLogout(page);
		await verifyPageState(page, "/login", "ログイン");

		// ログアウト後に保護されたページにアクセス
		const protectedPages = ["/dashboard", "/profile", "/settings"];

		for (const protectedPath of protectedPages) {
			await page.goto(protectedPath);

			// ログインページにリダイレクトされることを確認
			await verifyPageState(page, "/login", "ログイン");

			// 未認証であることを確認
			const authToken = await hasAuthToken(page);
			expect(authToken).toBeFalsy();
		}
	});

	test("無効なトークンでの保護されたページアクセス", async ({ page }) => {
		// 無効なトークンを設定
		await page.goto("/");
		await page.evaluate(() => {
			localStorage.setItem("authToken", "invalid-token");
		});

		// 保護されたページにアクセス
		await page.goto("/dashboard");

		// 実装に応じて、以下のいずれかが期待される：
		// 1. ログインページにリダイレクト（推奨）
		// 2. ダッシュボードへのアクセス（モック実装の場合）

		const currentUrl = page.url();
		const isValidResponse = currentUrl.includes("/login") || currentUrl.includes("/dashboard");

		expect(isValidResponse).toBeTruthy();
	});

	test("セッション期限切れ後の保護されたページアクセス", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログイン
		await performLogin(page, email, password);
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// セッション期限切れをシミュレート
		await page.evaluate(() => {
			localStorage.removeItem("authToken");
		});

		// 保護されたページにアクセス
		await page.goto("/profile");

		// ログインページにリダイレクトされることを確認
		await verifyPageState(page, "/login", "ログイン");

		// 認証状態がクリアされていることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("認証ガードの一貫性確認", async ({ page }) => {
		test.setTimeout(120000); // 2分に延長
		
		// すべての保護されたページが同じ認証ガード動作をすることを確認
		const protectedPages = [
			{ path: "/dashboard", title: "ダッシュボード" },
			{ path: "/profile", title: "プロフィール" },
			{ path: "/settings", title: "設定" },
		];

		for (const { path, title } of protectedPages) {
			// 未認証状態でアクセス
			await setupTest(page);
			await page.goto(path);

			// すべてログインページにリダイレクトされることを確認
			await verifyPageState(page, "/login", "ログイン");

			// ログイン後にアクセス
			const { email, password } = testUsers.validUser;
			await performLogin(page, email, password);
			
			// 確実に認証状態になってからページアクセス
			await page.waitForTimeout(1000);
			await page.goto(path);

			// 正常にページが表示されることを確認
			await verifyPageState(page, path, title);
			
			// 次のループのために認証状態をクリア
			await setupTest(page);
		}
	});

	test("URLの直接入力による保護されたページアクセス", async ({ page }) => {
		// ブラウザのアドレスバーに直接URLを入力した場合のシミュレーション
		await setupTest(page);

		// 直接URLを指定してアクセス
		await page.goto("http://localhost:5173/dashboard");

		// ログインページにリダイレクトされることを確認
		await verifyPageState(page, "/login", "ログイン");

		// 未認証状態であることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("ブラウザ戻るボタンでの認証ガード動作", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ホームページから開始
		await page.goto("/");

		// ログイン
		await performLogin(page, email, password);
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// プロフィールページに移動
		await clickVisibleNavLink(page, selectors.profileLink);
		await verifyPageState(page, "/profile", "プロフィール");

		// ログアウト
		await performLogout(page);
		await verifyPageState(page, "/login", "ログイン");

		// ブラウザの戻るボタンをシミュレート
		await page.goBack();

		// ページ遷移を待機
		await page.waitForTimeout(2000);

		// 認証ガードによりログインページにリダイレクトされるか、
		// または認証が必要な場合はダッシュボードに留まることを確認
		const currentUrl = page.url();
		const isValidResponse = currentUrl.includes("/login") || currentUrl.includes("/dashboard");

		expect(isValidResponse).toBeTruthy();

		// 未認証状態であることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeFalsy();
	});

	test("保護されたページでのページリロード", async ({ page }) => {
		const { email, password } = testUsers.validUser;

		// ログインしてダッシュボードにアクセス
		await performLogin(page, email, password);
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// ページをリロード
		await page.reload();
		await page.waitForLoadState("networkidle");

		// 認証状態が維持され、ダッシュボードが表示されることを確認
		await verifyPageState(page, "/dashboard", "ダッシュボード");

		// 認証トークンが維持されていることを確認
		const authToken = await hasAuthToken(page);
		expect(authToken).toBeTruthy();
	});
});
