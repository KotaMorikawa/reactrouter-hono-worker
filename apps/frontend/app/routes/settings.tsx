import type { BaseUser } from "@repo/shared";
import { Bell, Globe, Palette, Shield } from "lucide-react";
import { redirect } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import type { Route } from "./+types/settings";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "設定 - React Router App" },
		{ name: "description", content: "アプリケーション設定" },
	];
}

// 認証チェック関数
function getAuthTokenFromRequest(request: Request): string | null {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return null;

	const cookies = cookieHeader.split(";").map((c) => c.trim());
	const authCookie = cookies.find((cookie) => cookie.startsWith("auth-token="));

	return authCookie ? authCookie.split("=")[1] : null;
}

// ユーザー設定の型定義
interface UserSettings {
	theme: "light" | "dark" | "auto";
	language: string;
	emailNotifications: boolean;
	pushNotifications: boolean;
}

// ローダー関数の実装
export async function loader({ request }: Route.LoaderArgs) {
	try {
		// 認証トークンを取得
		const authToken = getAuthTokenFromRequest(request);

		if (!authToken) {
			return redirect("/login");
		}

		// 異なるトークンに応じた動作をシミュレート
		if (authToken === "invalid-token") {
			return redirect("/login");
		}

		if (authToken === "api-error-token") {
			return new Response("API Error", { status: 500 });
		}

		// 正常な場合のモックユーザーデータ
		const mockUser: BaseUser = {
			id: "user-123",
			name: "Test User",
			email: "user@example.com",
			role: "viewer",
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-15"),
			emailVerified: true,
			lastLogin: new Date("2024-01-15"),
		};

		// デフォルト設定またはユーザー固有の設定
		const defaultSettings: UserSettings = {
			theme: "light",
			language: "ja",
			emailNotifications: true,
			pushNotifications: false,
		};

		return {
			user: mockUser,
			settings: defaultSettings,
		};
	} catch (error) {
		console.error("Settings loader error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

export default function Settings() {
	return (
		<div className="py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="font-bold text-3xl text-gray-900 dark:text-gray-100">設定</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						アプリケーションの設定をカスタマイズできます。
					</p>
				</div>

				<div className="space-y-6">
					{/* 通知設定 */}
					<Card className="p-6">
						<div className="mb-4 flex items-center">
							<Bell className="mr-3 h-6 w-6 text-blue-600" />
							<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">通知設定</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">メール通知</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">
										重要な更新情報をメールで受け取る
									</p>
								</div>
								<Button variant="outline" size="sm">
									有効
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">プッシュ通知</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">
										リアルタイム通知を受け取る
									</p>
								</div>
								<Button variant="outline" size="sm">
									無効
								</Button>
							</div>
						</div>
					</Card>

					{/* セキュリティ設定 */}
					<Card className="p-6">
						<div className="mb-4 flex items-center">
							<Shield className="mr-3 h-6 w-6 text-green-600" />
							<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">
								セキュリティ
							</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">二要素認証</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">
										アカウントのセキュリティを強化
									</p>
								</div>
								<Button variant="outline" size="sm">
									設定
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">パスワード変更</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">
										定期的なパスワード更新を推奨
									</p>
								</div>
								<Button variant="outline" size="sm">
									変更
								</Button>
							</div>
						</div>
					</Card>

					{/* 表示設定 */}
					<Card className="p-6">
						<div className="mb-4 flex items-center">
							<Palette className="mr-3 h-6 w-6 text-purple-600" />
							<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">表示設定</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">テーマ</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">ライト・ダーク・自動</p>
								</div>
								<Button variant="outline" size="sm">
									ライト
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">言語</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">表示言語を選択</p>
								</div>
								<Button variant="outline" size="sm">
									日本語
								</Button>
							</div>
						</div>
					</Card>

					{/* 一般設定 */}
					<Card className="p-6">
						<div className="mb-4 flex items-center">
							<Globe className="mr-3 h-6 w-6 text-orange-600" />
							<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">一般設定</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">データエクスポート</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">
										アカウントデータをダウンロード
									</p>
								</div>
								<Button variant="outline" size="sm">
									エクスポート
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-red-600 dark:text-red-400">アカウント削除</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">アカウントを完全に削除</p>
								</div>
								<Button variant="destructive" size="sm">
									削除
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
