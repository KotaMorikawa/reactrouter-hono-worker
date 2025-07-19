import type { BaseUser } from "@repo/shared";
import type { hc } from "hono/client";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from "react";
import { createApiClient } from "../lib/api";
import type { AppType } from "../../../backend/src/index";

interface AuthState {
	user: BaseUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

type AuthAction =
	| { type: "AUTH_START" }
	| { type: "AUTH_SUCCESS"; payload: { user: BaseUser } }
	| { type: "AUTH_FAILURE"; payload: { error: string } }
	| { type: "AUTH_LOGOUT" }
	| { type: "AUTH_CLEAR_ERROR" };

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
	switch (action.type) {
		case "AUTH_START":
			return {
				...state,
				isLoading: true,
				error: null,
			};
		case "AUTH_SUCCESS":
			return {
				...state,
				user: action.payload.user,
				isAuthenticated: true,
				isLoading: false,
				error: null,
			};
		case "AUTH_FAILURE":
			return {
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: action.payload.error,
			};
		case "AUTH_LOGOUT":
			return {
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,
			};
		case "AUTH_CLEAR_ERROR":
			return {
				...state,
				error: null,
			};
		default:
			return state;
	}
}

export interface AuthContextType extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		name: string,
		password: string,
		confirmPassword: string
	) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// 型安全なAPIクライアントを作成
	const typedApiClient = createApiClient() as ReturnType<typeof hc<AppType>>;

	// WebKit対応のlocalStorage安全アクセス関数
	const safeLocalStorageSet = useCallback((key: string, value: string): boolean => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				localStorage.setItem(key, value);
				return true;
			}
		} catch (error) {
			console.warn("LocalStorage access denied (WebKit):", error);
		}
		return false;
	}, []);

	const safeLocalStorageGet = useCallback((key: string): string | null => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				return localStorage.getItem(key);
			}
		} catch (error) {
			console.warn("LocalStorage access denied (WebKit):", error);
		}
		return null;
	}, []);

	const safeLocalStorageRemove = useCallback((key: string): boolean => {
		try {
			if (typeof window !== "undefined" && window.localStorage) {
				localStorage.removeItem(key);
				return true;
			}
		} catch (error) {
			console.warn("LocalStorage access denied (WebKit):", error);
		}
		return false;
	}, []);

	const login = async (email: string, password: string): Promise<void> => {
		dispatch({ type: "AUTH_START" });

		try {
			const response = await typedApiClient.auth.login.$post({
				json: { email, password },
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "ログインに失敗しました");
			}

			const { user, accessToken } = await response.json();

			// JWTトークンをlocalStorageに保存（WebKit対応）
			safeLocalStorageSet("authToken", accessToken);

			dispatch({ type: "AUTH_SUCCESS", payload: { user } });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "ログインに失敗しました";
			dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
		}
	};

	const register = async (
		email: string,
		name: string,
		password: string,
		confirmPassword: string
	): Promise<void> => {
		dispatch({ type: "AUTH_START" });

		try {
			const response = await typedApiClient.auth.register.$post({
				json: { email, name, password, confirmPassword },
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "ユーザー登録に失敗しました");
			}

			const { user, accessToken } = await response.json();

			// JWTトークンをlocalStorageに保存（WebKit対応）
			safeLocalStorageSet("authToken", accessToken);

			dispatch({ type: "AUTH_SUCCESS", payload: { user } });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "ユーザー登録に失敗しました";
			dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
		}
	};

	const logout = async (): Promise<void> => {
		try {
			// サーバーサイドでトークンを無効化
			const token = safeLocalStorageGet("authToken");
			if (token) {
				await typedApiClient.auth.logout.$post(
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
			}

			safeLocalStorageRemove("authToken");
			dispatch({ type: "AUTH_LOGOUT" });

			// ログアウト後にログインページにリダイレクト
			window.location.href = "/login";
		} catch (error) {
			console.error("Logout error:", error);
			// ローカルのクリーンアップは実行
			safeLocalStorageRemove("authToken");
			dispatch({ type: "AUTH_LOGOUT" });

			// エラーが発生してもリダイレクト
			window.location.href = "/login";
		}
	};

	const clearError = (): void => {
		dispatch({ type: "AUTH_CLEAR_ERROR" });
	};

	// 初期認証状態チェック
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = safeLocalStorageGet("authToken");
				if (token) {
					dispatch({ type: "AUTH_START" });

					// タイムアウト付きでトークンの検証とユーザー情報の取得
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 5000);

					const response = await typedApiClient.auth.me.$get(
						{},
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
							signal: controller.signal,
						}
					);

					clearTimeout(timeoutId);

					if (response.ok) {
						const { user } = await response.json();
						dispatch({ type: "AUTH_SUCCESS", payload: { user } });
					} else {
						// トークンが無効な場合はログアウト
						safeLocalStorageRemove("authToken");
						dispatch({ type: "AUTH_LOGOUT" });
					}
				} else {
					dispatch({ type: "AUTH_LOGOUT" });
				}
			} catch (error) {
				console.warn("Auth check failed:", error);
				safeLocalStorageRemove("authToken");
				dispatch({ type: "AUTH_LOGOUT" });
			}
		};

		checkAuthStatus();
	}, []); // 依存配列を空にして初回のみ実行

	const value: AuthContextType = {
		...state,
		login,
		register,
		logout,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
