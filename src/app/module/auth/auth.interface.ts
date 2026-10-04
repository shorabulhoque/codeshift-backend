import type { UserRole } from "../../../../generated/prisma/enums";

export interface IRegisterPayload {
	email: string;
	password: string;
	fullName: string;
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IAuthUserPayload {
	userId: string;
	email: string;
	role: UserRole;
}

export interface IChangePasswordPayload {
	oldPassword: string;
	newPassword: string;
}