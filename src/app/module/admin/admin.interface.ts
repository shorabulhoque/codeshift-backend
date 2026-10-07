import type {
	RecruiterApplicationStatus,
	UserRole,
} from "../../../../generated/prisma/enums";

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}

export interface IVerifyRecruiterPayload {
	status: RecruiterApplicationStatus;
	rejectionReason?: string;
}
