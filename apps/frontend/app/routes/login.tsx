import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
// import {
// 	Form,
// 	FormControl,
// 	FormField,
// 	FormItem,
// 	FormLabel,
// 	FormMessage,
// } from "~/components/ui/form";
// import { Input } from "~/components/ui/input";
import { Navigation } from "../components/navigation";
import { useAuth } from "../contexts/auth-context";
// import { useLoginForm } from "../hooks/use-auth-form";
import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "ログイン - React Router App" },
		{ name: "description", content: "アカウントにログインしてください" },
	];
}

export default function Login() {
	const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
	// const form = useLoginForm();
	const navigate = useNavigate();

	// 一時的にシンプルなフォームに置き換え
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);
			// ログイン成功後にダッシュボードにリダイレクト
			navigate("/dashboard", { replace: true });
		} catch (err) {
			// エラーハンドリングはauth-contextで行われる
			console.error("Login error:", err);
		}
	};

	// エラーが変更された際にクリアする
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				clearError();
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	// 既にログイン済みの場合はダッシュボードにリダイレクト
	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<>
			<Navigation isAuthenticated={false} />
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="font-bold text-2xl" data-testid="login-title">
							アカウントにログイン
						</CardTitle>
						<CardDescription>アカウントの詳細を入力してログインしてください</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive" className="mb-6">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
							<div>
								<label
									htmlFor="email"
									className="block font-medium text-gray-900 text-sm leading-6"
								>
									メールアドレス
								</label>
								<div className="mt-2">
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
										placeholder="メールアドレスを入力"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="password"
									className="block font-medium text-gray-900 text-sm leading-6"
								>
									パスワード
								</label>
								<div className="mt-2">
									<input
										id="password"
										name="password"
										type="password"
										autoComplete="current-password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
										placeholder="パスワードを入力"
									/>
								</div>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={isLoading}
								data-testid="login-submit-button"
							>
								{isLoading ? "ログイン中..." : "ログイン"}
							</Button>

							<div className="text-center text-sm">
								アカウントをお持ちでない方は{" "}
								<Link to="/register" className="font-medium text-primary hover:underline">
									こちら
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
