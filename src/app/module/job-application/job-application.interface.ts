import type {
	ApplicationStatus,
	UserRole,
} from "../../../../generated/prisma/enums";

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}

export interface IApplyJobPayload {
	jobId: string;
	submissionCode: string;
}

export interface IReviewApplicationPayload {
	marks?: number;
	reviewerFeedback?: string;
	interviewDate?: string;
	status?: ApplicationStatus;
}
