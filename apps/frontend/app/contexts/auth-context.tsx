import type { BaseUser } from "@repo/shared";
import { createContext, type ReactNode, useContext, useEffect, useReducer } from "react";

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
	isLoading: true,
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

interface AuthContextType extends AuthState {
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

	// TODO: 実際のAPI統合時に実装
	const login = async (email: string, password: string): Promise<void> => {
		dispatch({ type: "AUTH_START" });

		try {
			// モック実装 - 実際のAPI呼び出しに置き換える
			console.log("Login attempt:", { email, password });

			// 成功をシミュレート
			const mockUser: BaseUser = {
				id: "mock-user-id",
				email,
				name: "Test User",
				role: "viewer",
				createdAt: new Date(),
				updatedAt: new Date(),
				emailVerified: true,
				lastLogin: new Date(),
			};

			// JWTトークンをlocalStorageに保存（モック）
			localStorage.setItem("authToken", "mock-jwt-token");

			dispatch({ type: "AUTH_SUCCESS", payload: { user: mockUser } });
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
			// モック実装 - 実際のAPI呼び出しに置き換える
			console.log("Register attempt:", { email, name, password, confirmPassword });

			// 成功をシミュレート
			const mockUser: BaseUser = {
				id: "mock-user-id",
				email,
				name,
				role: "viewer",
				createdAt: new Date(),
				updatedAt: new Date(),
				emailVerified: false,
				lastLogin: undefined,
			};

			// JWTトークンをlocalStorageに保存（モック）
			localStorage.setItem("authToken", "mock-jwt-token");

			dispatch({ type: "AUTH_SUCCESS", payload: { user: mockUser } });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "ユーザー登録に失敗しました";
			dispatch({ type: "AUTH_FAILURE", payload: { error: errorMessage } });
		}
	};

	const logout = async (): Promise<void> => {
		try {
			// TODO: APIで無効化
			localStorage.removeItem("authToken");
			dispatch({ type: "AUTH_LOGOUT" });
		} catch (error) {
			console.error("Logout error:", error);
			// ローカルのクリーンアップは実行
			localStorage.removeItem("authToken");
			dispatch({ type: "AUTH_LOGOUT" });
		}
	};

	const clearError = (): void => {
		dispatch({ type: "AUTH_CLEAR_ERROR" });
	};

	// 初期認証状態チェック
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const token = localStorage.getItem("authToken");
				if (token) {
					// TODO: トークンの検証とユーザー情報の取得
					const mockUser: BaseUser = {
						id: "mock-user-id",
						email: "user@example.com",
						name: "Test User",
						role: "viewer",
						createdAt: new Date(),
						updatedAt: new Date(),
						emailVerified: true,
						lastLogin: new Date(),
					};
					dispatch({ type: "AUTH_SUCCESS", payload: { user: mockUser } });
				} else {
					dispatch({ type: "AUTH_LOGOUT" });
				}
			} catch (_error) {
				localStorage.removeItem("authToken");
				dispatch({ type: "AUTH_LOGOUT" });
			}
		};

		checkAuthStatus();
	}, []);

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
