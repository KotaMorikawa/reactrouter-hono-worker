import { LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "../contexts/auth-context";

interface NavigationItem {
	to: string;
	label: string;
	requiresAuth?: boolean;
}

const navigationItems: NavigationItem[] = [
	{ to: "/", label: "ホーム" },
	{ to: "/dashboard", label: "ダッシュボード", requiresAuth: true },
	{ to: "/profile", label: "プロフィール", requiresAuth: true },
	{ to: "/settings", label: "設定", requiresAuth: true },
];

const authItems: NavigationItem[] = [
	{ to: "/login", label: "ログイン" },
	{ to: "/register", label: "登録" },
];

interface NavigationProps {
	isAuthenticated?: boolean;
}

export function Navigation({ isAuthenticated = false }: NavigationProps) {
	const auth = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const { logout, user } = auth || {};

	const itemsToShow = navigationItems.filter((item) => !item.requiresAuth || isAuthenticated);

	const handleLogout = async () => {
		if (logout) {
			await logout();
		}
	};

	return (
		<nav className="border-b bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					{/* Logo */}
					<div className="flex items-center">
						<NavLink to="/" className="font-bold text-foreground text-xl">
							React Router App
						</NavLink>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden items-center space-x-4 md:flex">
						{itemsToShow.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }: { isActive: boolean }) =>
									isActive
										? "px-3 py-2 font-medium text-primary"
										: "px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
								}
							>
								{item.label}
							</NavLink>
						))}

						{isAuthenticated ? (
							<>
								<div className="ml-4 flex items-center space-x-2">
									<User className="h-4 w-4" />
									<span className="text-muted-foreground text-sm">{user?.name}</span>
								</div>
								<Button variant="outline" size="sm" onClick={handleLogout}>
									<LogOut className="mr-2 h-4 w-4" />
									ログアウト
								</Button>
							</>
						) : (
							authItems.map((item) => (
								<Button
									key={item.to}
									variant={item.to === "/register" ? "default" : "ghost"}
									asChild
								>
									<NavLink to={item.to}>{item.label}</NavLink>
								</Button>
							))
						)}
					</div>

					{/* Mobile menu button */}
					<div className="flex items-center md:hidden">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsOpen(!isOpen)}
							aria-label="メニューを開く"
						>
							{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isOpen && (
					<div className="border-t bg-background md:hidden">
						<div className="space-y-1 px-2 pt-2 pb-3">
							{itemsToShow.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									className="block px-3 py-2 font-medium text-base text-muted-foreground hover:text-foreground"
									onClick={() => setIsOpen(false)}
								>
									{item.label}
								</NavLink>
							))}

							{isAuthenticated ? (
								<>
									<div className="px-3 py-2 text-muted-foreground text-sm">
										こんにちは、{user?.name}さん
									</div>
									<div className="px-3 py-2">
										<Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
											<LogOut className="mr-2 h-4 w-4" />
											ログアウト
										</Button>
									</div>
								</>
							) : (
								authItems.map((item) => (
									<div key={item.to} className="px-3 py-2">
										<Button
											variant={item.to === "/register" ? "default" : "ghost"}
											className="w-full"
											asChild
										>
											<NavLink to={item.to} onClick={() => setIsOpen(false)}>
												{item.label}
											</NavLink>
										</Button>
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
