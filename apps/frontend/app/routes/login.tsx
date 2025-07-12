import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Navigation } from "../components/navigation";
import { useAuth } from "../contexts/auth-context";
import { useLoginForm } from "../hooks/use-auth-form";
import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "ログイン - React Router App" },
		{ name: "description", content: "アカウントにログインしてください" },
	];
}

export default function Login() {
	const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
	const form = useLoginForm();

	const onSubmit = (data: { email: string; password: string }) => {
		login(data.email, data.password);
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

						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
								data-testid="login-form"
							>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>メールアドレス</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="メールアドレスを入力"
													autoComplete="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>パスワード</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="パスワードを入力"
													autoComplete="current-password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									className="w-full"
									disabled={form.formState.isSubmitting || isLoading}
									data-testid="login-submit-button"
								>
									{form.formState.isSubmitting || isLoading ? "ログイン中..." : "ログイン"}
								</Button>

								<div className="text-center text-sm">
									アカウントをお持ちでない方は{" "}
									<Link to="/register" className="font-medium text-primary hover:underline">
										こちら
									</Link>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
