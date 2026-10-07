import type { UserRole } from "../../../../../generated/prisma/enums";

export interface ICreateRecruiterApplicationPayload {
	fullName: string;
	companyName: string;
	businessRegistrationNo: string;
	designation?: string;
	companyWebsite?: string;
	companySize?: string;
	location?: string;
}

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}
