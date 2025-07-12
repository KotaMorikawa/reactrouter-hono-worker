interface LoadingProps {
	message?: string;
	size?: "sm" | "md" | "lg";
	fullScreen?: boolean;
}

export function Loading({
	message = "読み込み中...",
	size = "md",
	fullScreen = false,
}: LoadingProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	const spinnerSize = sizeClasses[size];

	if (fullScreen) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="text-center">
					<div
						className={`animate-spin rounded-full border-blue-600 border-b-2 ${spinnerSize} mx-auto`}
					></div>
					<p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center p-4">
			<div className="text-center">
				<div
					className={`animate-spin rounded-full border-blue-600 border-b-2 ${spinnerSize} mx-auto`}
				></div>
				<p className="mt-2 text-gray-600 text-sm dark:text-gray-400">{message}</p>
			</div>
		</div>
	);
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	return (
		<div
			className={`animate-spin rounded-full border-blue-600 border-b-2 ${sizeClasses[size]}`}
		></div>
	);
}
