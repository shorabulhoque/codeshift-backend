import type { UserRole } from "../../../../generated/prisma/enums";

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}

export interface ICreateCheckoutSessionPayload {
	amount?: number;
}
