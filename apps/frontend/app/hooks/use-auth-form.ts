import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, registerRequestSchema } from "@repo/shared";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export type LoginFormData = z.infer<typeof loginRequestSchema>;
export type RegisterFormData = z.infer<typeof registerRequestSchema>;

export function useLoginForm() {
	return useForm({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: {
			email: "",
			password: "",
		},
		mode: "onChange",
	});
}

export function useRegisterForm() {
	return useForm({
		resolver: zodResolver(registerRequestSchema),
		defaultValues: {
			email: "",
			name: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onChange",
	});
}

// フォームバリデーション関数
export function validateLoginForm(data: unknown): data is LoginFormData {
	try {
		loginRequestSchema.parse(data);
		return true;
	} catch {
		return false;
	}
}

export function validateRegisterForm(data: unknown): data is RegisterFormData {
	try {
		registerRequestSchema.parse(data);
		return true;
	} catch {
		return false;
	}
}
