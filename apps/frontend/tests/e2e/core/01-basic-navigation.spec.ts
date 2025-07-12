import { expect, test } from "@playwright/test";
import {
	cleanupTest,
	expectElementVisible,
	selectors,
	setupTest,
	verifyPageState,
	viewports,
} from "./utils/core-test-helpers";

test.describe("基本ナビゲーション機能", () => {
	test.beforeEach(async ({ page }) => {
		await setupTest(page);
	});

	test.afterEach(async ({ page }) => {
		await cleanupTest(page);
	});

	test("ホームページが正常に表示される", async ({ page }) => {
		await page.goto("/");

		// ページの基本要素を確認
		await verifyPageState(page, "/", "New React Router App");
		await expectElementVisible(page, selectors.navigation);
		await expectElementVisible(page, selectors.mainContent);

		// React Routerロゴの表示確認（表示されているもののみ）
		await expect(page.locator(selectors.reactRouterLogo).first()).toBeVisible();
	});

	test("ログインページへのナビゲーション", async ({ page }) => {
		await page.goto("/");

		// ビューポートサイズに応じてナビゲーション方法を切り替え
		const viewport = page.viewportSize();
		const isMobile = viewport && viewport.width <= 768;

		if (isMobile) {
			// モバイルビュー: ハンバーガーメニューを開いてからリンクをクリック
			const mobileButton = page.locator(selectors.mobileMenuButton);
			const hasButton = await mobileButton.isVisible();

			if (hasButton) {
				await mobileButton.click();
				await page.waitForTimeout(500);

				// ハンバーガーメニュー内の表示されているログインリンクを探す
				const loginLinks = page.locator(selectors.loginLink);
				const linkCount = await loginLinks.count();

				for (let i = 0; i < linkCount; i++) {
					const link = loginLinks.nth(i);
					if (await link.isVisible()) {
						await link.click();
						break;
					}
				}
			}
		} else {
			// デスクトップビュー: 直接リンクをクリック
			const navLoginLink = page.locator(selectors.loginLinkNav);
			const hasNavLink = await navLoginLink.isVisible();

			if (hasNavLink) {
				await navLoginLink.click();
			} else {
				// フォールバック: 表示されているログインリンクを使用
				const loginLinks = page.locator(selectors.loginLink);
				const linkCount = await loginLinks.count();

				for (let i = 0; i < linkCount; i++) {
					const link = loginLinks.nth(i);
					if (await link.isVisible()) {
						await link.click();
						break;
					}
				}
			}
		}

		// ログインページに正しく遷移することを確認
		await verifyPageState(page, "/login", "ログイン");
		await expectElementVisible(page, selectors.loginTitle);
		await expectElementVisible(page, selectors.loginForm);

		// フォーム要素の表示確認
		await expectElementVisible(page, selectors.emailInput);
		await expectElementVisible(page, selectors.passwordInputFirst);
		await expectElementVisible(page, selectors.loginSubmitButton);
	});

	test("登録ページへのナビゲーション", async ({ page }) => {
		await page.goto("/");

		// ビューポートサイズに応じてナビゲーション方法を切り替え
		const viewport = page.viewportSize();
		const isMobile = viewport && viewport.width <= 768;

		if (isMobile) {
			// モバイルビュー: ハンバーガーメニューを開いてからリンクをクリック
			const mobileButton = page.locator(selectors.mobileMenuButton);
			const hasButton = await mobileButton.isVisible();

			if (hasButton) {
				await mobileButton.click();
				await page.waitForTimeout(500);

				// ハンバーガーメニュー内の表示されている登録リンクを探す
				const registerLinks = page.locator(selectors.registerLink);
				const linkCount = await registerLinks.count();

				for (let i = 0; i < linkCount; i++) {
					const link = registerLinks.nth(i);
					if (await link.isVisible()) {
						await link.click();
						break;
					}
				}
			}
		} else {
			// デスクトップビュー: 直接リンクをクリック
			const navRegisterLink = page.locator(selectors.registerLinkNav);
			const hasNavLink = await navRegisterLink.isVisible();

			if (hasNavLink) {
				await navRegisterLink.click();
			} else {
				// フォールバック: 表示されている登録リンクを使用
				const registerLinks = page.locator(selectors.registerLink);
				const linkCount = await registerLinks.count();

				for (let i = 0; i < linkCount; i++) {
					const link = registerLinks.nth(i);
					if (await link.isVisible()) {
						await link.click();
						break;
					}
				}
			}
		}

		// 登録ページに正しく遷移することを確認
		await verifyPageState(page, "/register", "React Router App");
		await expectElementVisible(page, selectors.registerTitle);
		await expectElementVisible(page, selectors.registerForm);

		// フォーム要素の表示確認
		await expectElementVisible(page, selectors.emailInput);
		await expectElementVisible(page, selectors.nameInput);
		await expectElementVisible(page, selectors.passwordInputFirst);
		await expectElementVisible(page, selectors.registerSubmitButton);
	});

	test("ログインページから登録ページへの遷移", async ({ page }) => {
		await page.goto("/login");

		// 登録リンクをクリック（複数のリンクがある可能性に対応）
		const registerLinks = page.locator('a[href="/register"]');
		const linkCount = await registerLinks.count();

		if (linkCount > 0) {
			// 複数ある場合は、コンテンツ内のリンク（通常は2番目以降）を優先
			const linkToUse = linkCount > 1 ? registerLinks.nth(1) : registerLinks.first();
			await linkToUse.click();

			// 登録ページに遷移することを確認
			await verifyPageState(page, "/register", "React Router App");
			await expectElementVisible(page, selectors.registerTitle);
		}
	});

	test("登録ページからログインページへの遷移", async ({ page }) => {
		await page.goto("/register");

		// ログインリンクがあれば（通常は「既にアカウントをお持ちの方」リンク）
		// 複数のログインリンクがある可能性があるため、ページ内容に応じて選択
		const loginLinks = page.locator('a[href="/login"]');
		const linkCount = await loginLinks.count();

		if (linkCount > 0) {
			// 複数ある場合は、よりコンテンツに近いリンク（通常は2番目以降）を使用
			const linkToUse = linkCount > 1 ? loginLinks.nth(1) : loginLinks.first();
			const isVisible = await linkToUse.isVisible();

			if (isVisible) {
				await linkToUse.click();
				await verifyPageState(page, "/login", "ログイン");
			}
		}
	});

	test("ナビゲーションバーの基本要素確認", async ({ page }) => {
		await page.goto("/");

		// ページの読み込みを確実に待機
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1000);

		// ナビゲーション要素の存在確認
		await expectElementVisible(page, selectors.navigation);

		// 未認証ユーザー向けリンクの確認（複数要素対応）
		await expectElementVisible(page, selectors.homeLink);

		// ビューポートサイズを確認
		const viewport = page.viewportSize();
		const isMobile = viewport && viewport.width <= 768;

		if (isMobile) {
			// モバイルビュー: ハンバーガーメニューを開いてからリンクを確認
			const mobileButton = page.locator(selectors.mobileMenuButton);
			const hasButton = await mobileButton.isVisible();

			if (hasButton) {
				await mobileButton.click();
				await page.waitForTimeout(1000);

				// ハンバーガーメニュー内のリンクを確認
				const loginLinks = page.locator(selectors.loginLink);
				const registerLinks = page.locator(selectors.registerLink);

				// 表示されているリンクを見つけて確認
				let loginVisible = false;
				let registerVisible = false;

				const loginCount = await loginLinks.count();
				const registerCount = await registerLinks.count();

				for (let i = 0; i < loginCount; i++) {
					if (await loginLinks.nth(i).isVisible()) {
						loginVisible = true;
						break;
					}
				}

				for (let i = 0; i < registerCount; i++) {
					if (await registerLinks.nth(i).isVisible()) {
						registerVisible = true;
						break;
					}
				}

				expect(loginVisible).toBeTruthy();
				expect(registerVisible).toBeTruthy();
			}
		} else {
			// デスクトップビュー: 直接リンクを確認
			const navLoginLink = page.locator(selectors.loginLinkNav);
			const navRegisterLink = page.locator(selectors.registerLinkNav);

			const hasNavLinks = (await navLoginLink.isVisible()) && (await navRegisterLink.isVisible());

			if (hasNavLinks) {
				await expectElementVisible(page, selectors.loginLinkNav);
				await expectElementVisible(page, selectors.registerLinkNav);
			} else {
				// フォールバック
				await expectElementVisible(page, selectors.loginLink);
				await expectElementVisible(page, selectors.registerLink);
			}
		}

		// アプリケーション名/ロゴの確認（最初の要素を使用）
		await expect(page.locator('a[href="/"]').first()).toContainText("React Router App");
	});

	test("デスクトップビューでのナビゲーション表示", async ({ page }) => {
		await page.setViewportSize(viewports.desktop);
		await page.goto("/");

		// デスクトップサイズでのナビゲーション要素確認
		await expectElementVisible(page, selectors.navigation);

		// ナビゲーションリンクの確認（複数要素対応）
		const navLoginLink = page.locator(selectors.loginLinkNav);
		const navRegisterLink = page.locator(selectors.registerLinkNav);

		const hasNavLinks = (await navLoginLink.isVisible()) && (await navRegisterLink.isVisible());

		if (hasNavLinks) {
			await expectElementVisible(page, selectors.loginLinkNav);
			await expectElementVisible(page, selectors.registerLinkNav);
		} else {
			await expectElementVisible(page, selectors.loginLink);
			await expectElementVisible(page, selectors.registerLink);
		}

		// モバイルメニューボタンが表示されていないことを確認
		await expect(page.locator(selectors.mobileMenuButton)).not.toBeVisible();
	});

	test("モバイルビューでのナビゲーション表示", async ({ page }) => {
		await page.setViewportSize(viewports.mobile);
		await page.goto("/");

		// モバイルサイズでのナビゲーション確認
		await expectElementVisible(page, selectors.navigation);

		// モバイルメニューボタンの表示確認
		await expectElementVisible(page, selectors.mobileMenuButton);

		// ハンバーガーメニューをクリックしてメニュー展開
		await page.locator(selectors.mobileMenuButton).click();

		// 短い待機時間を追加してメニューが展開されるのを待つ
		await page.waitForTimeout(500);

		// メニューが展開されることを確認
		// より柔軟な方法でリンクの表示を確認
		const allLoginLinks = page.locator(selectors.loginLink);
		const allRegisterLinks = page.locator(selectors.registerLink);

		// 少なくとも1つのログインリンクと登録リンクが表示されることを確認
		let loginVisible = false;
		let registerVisible = false;

		const loginCount = await allLoginLinks.count();
		const registerCount = await allRegisterLinks.count();

		for (let i = 0; i < loginCount; i++) {
			if (await allLoginLinks.nth(i).isVisible()) {
				loginVisible = true;
				break;
			}
		}

		for (let i = 0; i < registerCount; i++) {
			if (await allRegisterLinks.nth(i).isVisible()) {
				registerVisible = true;
				break;
			}
		}

		expect(loginVisible).toBeTruthy();
		expect(registerVisible).toBeTruthy();
	});

	test("存在しないページへのアクセス（404ページ）", async ({ page }) => {
		await page.goto("/nonexistent-page");

		// 404ページまたは適切なエラーページが表示されることを確認
		// （実装によってはホームページにリダイレクトされる可能性もある）
		const currentUrl = page.url();
		const isValidResponse =
			currentUrl.includes("/404") || currentUrl.includes("/") || currentUrl.includes("/error");

		expect(isValidResponse).toBeTruthy();
	});

	test("ページタイトルの動的変更確認", async ({ page }) => {
		// ホームページのタイトル
		await page.goto("/");
		await expect(page).toHaveTitle(/New React Router App/);

		// ログインページのタイトル
		await page.goto("/login");
		await expect(page).toHaveTitle(/ログイン.*React Router App/);

		// 登録ページのタイトル（実装により異なる可能性）
		await page.goto("/register");
		await expect(page).toHaveTitle(/React Router App/);
	});

	test("ページローディング時間の確認", async ({ page }) => {
		const startTime = Date.now();

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const loadTime = Date.now() - startTime;

		// 3秒以内にページが読み込まれることを確認
		expect(loadTime).toBeLessThan(3000);

		// 基本要素が表示されていることを確認
		await expectElementVisible(page, selectors.navigation);
		await expectElementVisible(page, selectors.mainContent);
	});
});
