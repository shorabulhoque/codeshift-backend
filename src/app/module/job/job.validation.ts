import { z } from "zod";
import { JobStatus } from "../../../../generated/prisma/enums";

const createJobSchema = z.object({
	body: z.object({
		title: z.string({ message: "Job title is required" }),
		description: z.string({ message: "Job description is required" }),
		assignmentDetails: z.string({
			message: "Assignment details are required",
		}),
		requirements: z.string().optional(),
		responsibilities: z.string().optional(),
		deadline: z.string().optional(),
		status: z.nativeEnum(JobStatus).optional(),
	}),
});

const updateJobSchema = z.object({
	body: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		assignmentDetails: z.string().optional(),
		requirements: z.string().optional(),
		responsibilities: z.string().optional(),
		deadline: z.string().optional(),
		status: z.nativeEnum(JobStatus).optional(),
	}),
});

export const JobValidation = {
	createJobSchema,
	updateJobSchema,
};