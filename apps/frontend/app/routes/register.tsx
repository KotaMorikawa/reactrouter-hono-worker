import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useAuth } from "../contexts/auth-context";
import { useRegisterForm } from "../hooks/use-auth-form";
import type { Route } from "./+types/register";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "ユーザー登録 - React Router App" },
		{ name: "description", content: "新しいアカウントを作成してください" },
	];
}

export default function Register() {
	const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
	const form = useRegisterForm();

	const onSubmit = (data: {
		email: string;
		name: string;
		password: string;
		confirmPassword: string;
	}) => {
		register(data.email, data.name, data.password, data.confirmPassword);
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
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="font-bold text-2xl">新しいアカウントを作成</CardTitle>
					<CardDescription>アカウント情報を入力して登録してください</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-6">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>お名前</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="お名前を入力"
												autoComplete="name"
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
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>パスワード確認</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="パスワードを再入力"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											パスワードは8文字以上で、大文字・小文字・数字・特殊文字を含む必要があります
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={form.formState.isSubmitting || isLoading}
							>
								{form.formState.isSubmitting || isLoading ? "登録中..." : "アカウント作成"}
							</Button>

							<div className="text-center text-sm">
								既にアカウントをお持ちの方は{" "}
								<Link to="/login" className="font-medium text-primary hover:underline">
									こちら
								</Link>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
