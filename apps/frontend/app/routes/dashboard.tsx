import { AuthenticatedLayout } from "~/components/layout/authenticated-layout";
import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "ダッシュボード - React Router App" },
		{ name: "description", content: "ユーザーダッシュボード" },
	];
}

export default function Dashboard() {
	return (
		<AuthenticatedLayout>
			<div className="py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
						<div className="text-center">
							<h1
								className="mb-4 font-bold text-2xl text-gray-900 dark:text-gray-100"
								data-testid="dashboard-title"
							>
								ダッシュボード
							</h1>
							<p className="mb-6 text-gray-600 dark:text-gray-400">
								ここにユーザーの情報やアプリケーションのコンテンツが表示されます。
							</p>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
								<div
									className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20"
									data-testid="statistics-card"
								>
									<h3 className="mb-2 font-semibold text-blue-900 text-lg dark:text-blue-100">
										統計情報
									</h3>
									<p className="text-blue-700 dark:text-blue-300">
										ユーザーの活動統計やメトリクスを表示
									</p>
								</div>
								<div className="rounded-lg bg-green-50 p-6 dark:bg-green-900/20">
									<h3 className="mb-2 font-semibold text-green-900 text-lg dark:text-green-100">
										最近の活動
									</h3>
									<p className="text-green-700 dark:text-green-300">最近のユーザー活動を表示</p>
								</div>
								<div className="rounded-lg bg-purple-50 p-6 dark:bg-purple-900/20">
									<h3 className="mb-2 font-semibold text-lg text-purple-900 dark:text-purple-100">
										設定
									</h3>
									<p className="text-purple-700 dark:text-purple-300">
										アカウント設定とプリファレンス
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
