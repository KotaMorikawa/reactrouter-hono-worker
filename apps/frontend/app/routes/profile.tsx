import type { BaseUser } from "@repo/shared";
import { Calendar, Mail, Shield, User } from "lucide-react";
import { redirect } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../contexts/auth-context";
import type { Route } from "./+types/profile";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プロフィール - React Router App" },
		{ name: "description", content: "ユーザープロフィール管理" },
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

		return {
			user: mockUser,
		};
	} catch (error) {
		console.error("Profile loader error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

export default function Profile() {
	const auth = useAuth();
	const { user } = auth || {};

	return (
		<div className="py-6 sm:px-6 lg:px-8">
			<div className="px-4 py-6 sm:px-0">
				<div className="mb-6">
					<h1 className="font-bold text-3xl text-gray-900 dark:text-gray-100">プロフィール</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						アカウント情報を確認・更新できます。
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* ユーザー情報カード */}
					<Card className="p-6">
						<div className="mb-4 flex items-center">
							<User className="mr-3 h-6 w-6 text-blue-600" />
							<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">基本情報</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center">
								<div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
									<User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">
										{user?.name || "未設定"}
									</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">表示名</p>
								</div>
							</div>

							<div className="flex items-center">
								<div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
									<Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">
										{user?.email || "未設定"}
									</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">メールアドレス</p>
								</div>
							</div>

							<div className="flex items-center">
								<div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
									<Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">
										{user?.role || "ユーザー"}
									</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">ロール</p>
								</div>
							</div>

							<div className="flex items-center">
								<div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
									<Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
								</div>
								<div>
									<p className="font-medium text-gray-900 dark:text-gray-100">
										{user?.createdAt
											? new Date(user.createdAt).toLocaleDateString("ja-JP")
											: "不明"}
									</p>
									<p className="text-gray-500 text-sm dark:text-gray-400">登録日</p>
								</div>
							</div>
						</div>

						<div className="mt-6">
							<Button className="w-full">プロフィールを編集</Button>
						</div>
					</Card>

					{/* アカウント統計 */}
					<Card className="p-6">
						<h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-gray-100">
							アカウント統計
						</h2>

						<div className="space-y-4">
							<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<div className="flex items-center justify-between">
									<span className="font-medium text-blue-900 dark:text-blue-100">ログイン回数</span>
									<span className="font-bold text-blue-900 text-xl dark:text-blue-100">0</span>
								</div>
							</div>

							<div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
								<div className="flex items-center justify-between">
									<span className="font-medium text-green-900 dark:text-green-100">
										最終ログイン
									</span>
									<span className="font-bold text-green-900 text-sm dark:text-green-100">
										{user?.lastLogin
											? new Date(user.lastLogin).toLocaleString("ja-JP")
											: "初回ログイン"}
									</span>
								</div>
							</div>

							<div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
								<div className="flex items-center justify-between">
									<span className="font-medium text-purple-900 dark:text-purple-100">
										アカウント状態
									</span>
									<span className="inline-flex rounded-full bg-green-100 px-2 py-1 font-semibold text-green-800 text-xs dark:bg-green-800 dark:text-green-100">
										アクティブ
									</span>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
