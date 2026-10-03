import { z } from "zod";

const passwordValidation = z
	.string({ message: "Password is required" })
	.min(8, "Password must be at least 8 characters long")
	.max(32, "Password cannot exceed 32 characters")
	.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
	.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
	.regex(/[0-9]/, "Password must contain at least 1 number")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");

export const registerValidationSchema = z.object({
	body: z.object({
		email: z
			.string({ message: "Email is required" })
			.email("Invalid email address format"),

		password: passwordValidation,

		fullName: z
			.string({ message: "Full name is required" })
			.min(3, "Full name must be at least 3 characters long")
			.max(50, "Full name cannot exceed 50 characters"),
	}),
});

export const verifyEmailValidationSchema = z.object({
	body: z.object({
		email: z
			.string({ message: "Email is required" })
			.email("Invalid email address format"),
		otp: z
			.string({ message: "OTP is required" })
			.length(6, "OTP must be exactly 6 digits"),
	}),
});

const loginValidationSchema = z.object({
	body: z.object({
		email: z
			.string({
				message: "Email is required",
			})
			.email("Invalid email address"),
		password: z
			.string({
				message: "Password is required",
			})
			.min(1, "Password cannot be empty"),
	}),
});

const GoogleLoginZodSchema = z.object({
	body: z.object({
		idToken: z.string({
			message: "Google ID Token is required",
		}),
	}),
});

const forgotPasswordSchema = z.object({
	body: z.object({
		email: z
			.string({ message: "Email is required" })
			.email("Invalid email address format"),
	}),
});

const resetPasswordSchema = z.object({
	body: z.object({
		email: z
			.string({ message: "Email is required" })
			.email("Invalid email address format"),
		otp: z
			.string({ message: "OTP is required" })
			.length(6, "OTP must be exactly 6 digits"),
		newPassword: z
			.string({ message: "New password is required" })
			.min(8, "Password must be at least 8 characters long")
			.max(32, "Password cannot exceed 32 characters"),
	}),
});

const changePasswordSchema = z.object({
	body: z.object({
		oldPassword: z.string({ message: "Old password is required" }),
		newPassword: z
			.string({ message: "New password is required" })
			.min(8, "Password must be at least 8 characters long")
			.max(32, "Password cannot exceed 32 characters"),
	}),
});

export const AuthValidation = {
	registerValidationSchema,
	verifyEmailValidationSchema,
	loginValidationSchema,
	GoogleLoginZodSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	changePasswordSchema,
};
