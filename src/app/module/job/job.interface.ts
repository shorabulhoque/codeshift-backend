import type { JobStatus, UserRole } from "../../../../generated/prisma/enums";

export interface ICreateJobPayload {
	title: string;
	description: string;
	assignmentDetails: string;
	requirements?: string;
	responsibilities?: string;
	deadline?: string;
	status?: JobStatus;
}

export interface IUpdateJobPayload {
	title?: string;
	description?: string;
	assignmentDetails?: string;
	requirements?: string;
	responsibilities?: string;
	deadline?: string;
	status?: JobStatus;
}

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}
