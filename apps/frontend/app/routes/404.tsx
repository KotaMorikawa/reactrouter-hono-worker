import { Navigation } from "../components/navigation";

export function meta() {
	return [
		{ title: "404 - ページが見つかりません" },
		{ name: "description", content: "お探しのページは見つかりませんでした" },
	];
}

export default function NotFound() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navigation isAuthenticated={false} />
			<main className="flex flex-1 items-center justify-center px-4 py-16">
				<div className="text-center">
					<h1 className="font-bold text-9xl text-gray-300 dark:text-gray-600">404</h1>
					<h2 className="mb-4 font-bold text-2xl text-gray-900 dark:text-gray-100">
						ページが見つかりません
					</h2>
					<p className="mb-8 text-gray-600 dark:text-gray-400">
						お探しのページは存在しないか、移動された可能性があります。
					</p>
					<div className="space-x-4">
						<a
							href="/"
							className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							ホームに戻る
						</a>
						<button
							type="button"
							onClick={() => window.history.back()}
							className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							前のページに戻る
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}
