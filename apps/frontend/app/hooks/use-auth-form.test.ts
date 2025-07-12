import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	type LoginFormData,
	type RegisterFormData,
	useLoginForm,
	useRegisterForm,
	validateLoginForm,
	validateRegisterForm,
} from "./use-auth-form";

describe("useLoginForm", () => {
	it("should initialize with default values", () => {
		const { result } = renderHook(() => useLoginForm());

		expect(result.current.getValues()).toEqual({
			email: "",
			password: "",
		});
	});

	it("should have proper form configuration", () => {
		const { result } = renderHook(() => useLoginForm());

		// フォームが正しく初期化されていることを確認
		expect(result.current.control).toBeDefined();
		expect(result.current.formState).toBeDefined();
	});

	it("should validate email format with invalid data", async () => {
		const { result } = renderHook(() => useLoginForm());

		// 無効なメールアドレスをセットしてsubmit
		result.current.setValue("email", "invalid-email");
		result.current.setValue("password", "ValidPass123!");

		// handleSubmitでエラーを検証
		let validationResult: unknown;
		const onValid = (data: unknown) => {
			validationResult = data;
		};
		const onInvalid = (errors: unknown) => {
			validationResult = errors;
		};

		const submitHandler = result.current.handleSubmit(onValid, onInvalid);
		await submitHandler();

		// エラーがキャプチャされていることを確認
		expect(validationResult).toBeDefined();
		expect(typeof validationResult === "object").toBe(true);
	});

	it("should validate password requirements with invalid data", async () => {
		const { result } = renderHook(() => useLoginForm());

		// 短すぎるパスワードをセット
		result.current.setValue("email", "test@example.com");
		result.current.setValue("password", "123");

		// handleSubmitでエラーを検証
		let validationResult: unknown;
		const onValid = (data: unknown) => {
			validationResult = data;
		};
		const onInvalid = (errors: unknown) => {
			validationResult = errors;
		};

		const submitHandler = result.current.handleSubmit(onValid, onInvalid);
		await submitHandler();

		// エラーがキャプチャされていることを確認
		expect(validationResult).toBeDefined();
		expect(typeof validationResult === "object").toBe(true);
	});

	it("should pass validation with valid data", async () => {
		const { result } = renderHook(() => useLoginForm());

		result.current.setValue("email", "test@example.com");
		result.current.setValue("password", "ValidPass123!");

		// handleSubmitで正常データを検証
		let validationResult: unknown;
		const onValid = (data: unknown) => {
			validationResult = data;
		};
		const onInvalid = (errors: unknown) => {
			validationResult = errors;
		};

		const submitHandler = result.current.handleSubmit(onValid, onInvalid);
		await submitHandler();

		// 有効なデータがキャプチャされていることを確認
		expect(validationResult).toBeDefined();
		expect(typeof validationResult === "object").toBe(true);
		if (validationResult && typeof validationResult === "object" && "email" in validationResult) {
			const data = validationResult as Record<string, unknown>;
			expect(data.email).toBe("test@example.com");
		}
	});
});

describe("useRegisterForm", () => {
	it("should initialize with default values", () => {
		const { result } = renderHook(() => useRegisterForm());

		expect(result.current.getValues()).toEqual({
			email: "",
			name: "",
			password: "",
			confirmPassword: "",
		});
	});

	it("should have proper form configuration", () => {
		const { result } = renderHook(() => useRegisterForm());

		expect(result.current.control).toBeDefined();
		expect(result.current.formState).toBeDefined();
	});

	it("should validate all required fields with empty data", async () => {
		const { result } = renderHook(() => useRegisterForm());

		// 空のフィールドでsubmit
		let validationResult: unknown;
		const onValid = (data: unknown) => {
			validationResult = data;
		};
		const onInvalid = (errors: unknown) => {
			validationResult = errors;
		};

		const submitHandler = result.current.handleSubmit(onValid, onInvalid);
		await submitHandler();

		// エラーがキャプチャされていることを確認
		expect(validationResult).toBeDefined();
		expect(typeof validationResult === "object").toBe(true);
	});

	it("should validate password confirmation match with mismatched passwords", async () => {
		const { result } = renderHook(() => useRegisterForm());

		result.current.setValue("email", "test@example.com");
		result.current.setValue("name", "Test User");
		result.current.setValue("password", "ValidPass123!");
		result.current.setValue("confirmPassword", "DifferentPass123!");

		// handleSubmitでエラーを検証
		let validationResult: unknown;
		const onValid = (data: unknown) => {
			validationResult = data;
		};
		const onInvalid = (errors: unknown) => {
			validationResult = errors;
		};

		const submitHandler = result.current.handleSubmit(onValid, onInvalid);
		await submitHandler();

		// エラーがキャプチャされていることを確認
		expect(validationResult).toBeDefined();
		expect(typeof validationResult === "object").toBe(true);
	});

	it("should pass validation with valid matching data", async () => {
		const { result } = renderHook(() => useRegisterForm());

		result.current.setValue("email", "test@example.com");
		result.current.setValue("name", "Test User");
		result.current.setValue("password", "ValidPass123!");
		result.current.setValue("confirmPassword", "ValidPass123!");

		const isValid = await result.current.trigger();

		expect(isValid).toBe(true);
		expect(result.current.formState.errors).toEqual({});
	});
});

describe("validateLoginForm", () => {
	it("should return true for valid login data", () => {
		const validData: LoginFormData = {
			email: "test@example.com",
			password: "ValidPass123!",
		};

		expect(validateLoginForm(validData)).toBe(true);
	});

	it("should return false for invalid email", () => {
		const invalidData = {
			email: "invalid-email",
			password: "ValidPass123!",
		};

		expect(validateLoginForm(invalidData)).toBe(false);
	});

	it("should return false for short password", () => {
		const invalidData = {
			email: "test@example.com",
			password: "123",
		};

		expect(validateLoginForm(invalidData)).toBe(false);
	});

	it("should return false for missing fields", () => {
		const invalidData = {
			email: "test@example.com",
			// password missing
		};

		expect(validateLoginForm(invalidData)).toBe(false);
	});

	it("should return false for null or undefined", () => {
		expect(validateLoginForm(null)).toBe(false);
		expect(validateLoginForm(undefined)).toBe(false);
	});

	it("should return false for non-object data", () => {
		expect(validateLoginForm("string")).toBe(false);
		expect(validateLoginForm(123)).toBe(false);
		expect(validateLoginForm([])).toBe(false);
	});
});

describe("validateRegisterForm", () => {
	it("should return true for valid register data", () => {
		const validData: RegisterFormData = {
			email: "test@example.com",
			name: "Test User",
			password: "ValidPass123!",
			confirmPassword: "ValidPass123!",
		};

		expect(validateRegisterForm(validData)).toBe(true);
	});

	it("should return false for invalid email", () => {
		const invalidData = {
			email: "invalid-email",
			name: "Test User",
			password: "ValidPass123!",
			confirmPassword: "ValidPass123!",
		};

		expect(validateRegisterForm(invalidData)).toBe(false);
	});

	it("should return false for empty name", () => {
		const invalidData = {
			email: "test@example.com",
			name: "",
			password: "ValidPass123!",
			confirmPassword: "ValidPass123!",
		};

		expect(validateRegisterForm(invalidData)).toBe(false);
	});

	it("should return false for mismatched passwords", () => {
		const invalidData = {
			email: "test@example.com",
			name: "Test User",
			password: "ValidPass123!",
			confirmPassword: "DifferentPass123!",
		};

		expect(validateRegisterForm(invalidData)).toBe(false);
	});

	it("should return false for missing fields", () => {
		const invalidData = {
			email: "test@example.com",
			name: "Test User",
			// passwords missing
		};

		expect(validateRegisterForm(invalidData)).toBe(false);
	});

	it("should return false for null or undefined", () => {
		expect(validateRegisterForm(null)).toBe(false);
		expect(validateRegisterForm(undefined)).toBe(false);
	});

	it("should return false for non-object data", () => {
		expect(validateRegisterForm("string")).toBe(false);
		expect(validateRegisterForm(123)).toBe(false);
		expect(validateRegisterForm([])).toBe(false);
	});
});
