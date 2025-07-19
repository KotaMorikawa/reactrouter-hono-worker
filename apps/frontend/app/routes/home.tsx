import { Link, Navigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Navigation } from "../components/navigation";
import { useAuth } from "../contexts/auth-context";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "ホーム - React Router App" },
		{ name: "description", content: "React RouterとHonoを使用したモノレポ認証アプリケーション" },
	];
}

export default function Home() {
	const { isAuthenticated } = useAuth();

	// 認証済みユーザーはダッシュボードにリダイレクト
	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<>
			<Navigation isAuthenticated={false} />
			<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					{/* ヒーローセクション */}
					<div className="text-center">
						<h1 className="font-bold text-4xl text-gray-900 sm:text-6xl dark:text-white">
							React Router + Hono
						</h1>
						<h2 className="mt-4 font-semibold text-2xl text-blue-600 dark:text-blue-400">
							モノレポ認証アプリケーション
						</h2>
						<p className="mx-auto mt-6 max-w-2xl text-gray-600 text-lg dark:text-gray-300">
							Cloudflare Workers上で動作するReact Router v7とHonoを使用した
							最新のフルスタック認証システムです。
						</p>

						{/* CTAボタン */}
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<Link to="/register">
								<Button size="lg" className="px-8 py-3">
									無料でアカウント作成
								</Button>
							</Link>
							<Link to="/login">
								<Button variant="outline" size="lg" className="px-8 py-3">
									ログイン
								</Button>
							</Link>
						</div>
					</div>

					{/* 特徴セクション */}
					<div className="mt-24">
						<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle className="text-xl">🚀 高速なパフォーマンス</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">
										Cloudflare
										Workersで動作し、世界中のエッジサーバーから高速にレスポンスを提供します。
									</CardDescription>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-xl">🔒 セキュアな認証</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">
										JWT、RBAC、レート制限、CSRF保護など、最新のセキュリティ機能を実装しています。
									</CardDescription>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-xl">⚡ モダンな技術スタック</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">
										React Router v7、Hono、TypeScript、Tailwind CSSを使用した最新の開発体験。
									</CardDescription>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* 技術スタックセクション */}
					<div className="mt-24">
						<h3 className="mb-8 text-center font-bold text-2xl text-gray-900 dark:text-white">
							技術スタック
						</h3>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							{[
								"React Router v7",
								"Hono Framework",
								"Cloudflare Workers",
								"TypeScript",
								"Tailwind CSS",
								"PostgreSQL",
								"Drizzle ORM",
								"Vitest",
							].map((tech) => (
								<div
									key={tech}
									className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-gray-800"
								>
									<span className="font-medium text-gray-900 text-sm dark:text-gray-100">
										{tech}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
