import { z } from "zod";
import { ApplicationStatus } from "../../../../generated/prisma/enums";

const applyJobSchema = z.object({
	body: z.object({
		jobId: z.string({ message: "Job ID is required" }),
		submissionCode: z.string({ message: "Submission code is required" }),
	}),
});

const reviewApplicationSchema = z.object({
	body: z.object({
		marks: z.number().optional(),
		reviewerFeedback: z.string().optional(),
		interviewDate: z.string().optional(),
		status: z.nativeEnum(ApplicationStatus).optional(),
	}),
});

export const ApplicationValidation = {
	applyJobSchema,
	reviewApplicationSchema,
};
