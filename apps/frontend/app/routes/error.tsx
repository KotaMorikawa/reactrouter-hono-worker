export function meta() {
	return [
		{ title: "Error - React Router App" },
		{ name: "description", content: "An error occurred" },
	];
}

export default function ErrorPage() {
	return (
		<main className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="font-bold text-4xl text-gray-900 dark:text-gray-100">
					Something went wrong
				</h1>
				<p className="mt-4 text-gray-600 dark:text-gray-400">
					We're sorry, but an unexpected error occurred.
				</p>
				<div className="mt-6">
					<a
						href="/"
						className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						Go Home
					</a>
				</div>
			</div>
		</main>
	);
}
