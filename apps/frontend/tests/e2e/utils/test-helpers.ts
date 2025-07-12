import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * テスト用のユーザーデータ
 */
export const testUsers = {
	validUser: {
		email: "test@example.com",
		name: "テストユーザー",
		password: "Password123!",
	},
	invalidUser: {
		email: "invalid@example.com",
		password: "wrongpassword",
	},
} as const;

/**
 * ページセレクター
 */
export const selectors = {
	// 共通
	loadingSpinner: '[data-testid="loading"]',
	errorAlert: '[role="alert"]',

	// ナビゲーション
	loginLink: 'a[href="/login"]',
	registerLink: 'a[href="/register"]',
	logoutButton: 'button:has-text("ログアウト")',
	dashboardLink: 'a[href="/dashboard"]',

	// ログインフォーム
	emailInput: 'input[type="email"]',
	passwordInput: 'input[type="password"]',
	loginButton: 'button[type="submit"]:has-text("ログイン")',

	// 登録フォーム
	nameInput: 'input[autocomplete="name"]',
	confirmPasswordInput: 'input[autocomplete="new-password"]:nth-of-type(2)',
	registerButton: 'button[type="submit"]:has-text("アカウント作成")',

	// ダッシュボード
	dashboardTitle: 'h2:has-text("ようこそ、ダッシュボードへ")',
	statisticsCard: 'div:has-text("統計情報")',

	// ホームページ
	homeTitle: 'img[alt="React Router"]',
} as const;

/**
 * ユーザーをログインさせる
 */
export async function loginUser(page: Page, email: string, password: string) {
	await page.goto("/login");
	await page.fill(selectors.emailInput, email);
	await page.fill(selectors.passwordInput, password);
	await page.click(selectors.loginButton);

	// ログイン完了まで待機
	await expect(page).toHaveURL("/dashboard");
}

/**
 * ユーザーを登録する
 */
export async function registerUser(page: Page, email: string, name: string, password: string) {
	await page.goto("/register");
	await page.fill(selectors.emailInput, email);
	await page.fill(selectors.nameInput, name);
	await page.fill(selectors.passwordInput, password);
	await page.fill(selectors.confirmPasswordInput, password);
	await page.click(selectors.registerButton);

	// 登録完了まで待機
	await expect(page).toHaveURL("/dashboard");
}

/**
 * ログアウトする
 */
export async function logoutUser(page: Page) {
	await page.click(selectors.logoutButton);
	await expect(page).toHaveURL("/");
}

/**
 * ローカルストレージをクリア
 */
export async function clearAuth(page: Page) {
	await page.evaluate(() => {
		localStorage.removeItem("authToken");
	});
}

/**
 * 認証トークンが存在するかチェック
 */
export async function hasAuthToken(page: Page): Promise<boolean> {
	return await page.evaluate(() => {
		return localStorage.getItem("authToken") !== null;
	});
}

/**
 * エラーメッセージが表示されるのを待つ
 */
export async function waitForErrorMessage(page: Page, expectedMessage?: string) {
	if (expectedMessage) {
		await expect(page.locator(selectors.errorAlert)).toContainText(expectedMessage);
	} else {
		await expect(page.locator(selectors.errorAlert)).toBeVisible();
	}
}

/**
 * ページ読み込み完了を待つ
 */
export async function waitForPageLoad(page: Page) {
	await page.waitForLoadState("networkidle");
	await page.waitForLoadState("domcontentloaded");
}

/**
 * フォームの送信完了を待つ
 */
export async function waitForFormSubmit(page: Page) {
	// 送信ボタンが無効化される間を待つ
	await page.waitForFunction(() => {
		const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
		return submitButton && !submitButton.disabled;
	});
}
