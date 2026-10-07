import { z } from "zod";
import {
	RecruiterApplicationStatus,
	UserStatus,
} from "../../../../generated/prisma/enums";

const verifyRecruiterSchema = z.object({
	body: z
		.object({
			status: z.enum([
				RecruiterApplicationStatus.APPROVED,
				RecruiterApplicationStatus.REJECTED,
			]),
			rejectionReason: z.string().trim().optional(),
		})
		.refine(
			(data) => {
				if (
					data.status === RecruiterApplicationStatus.REJECTED &&
					!data.rejectionReason
				) {
					return false;
				}
				return true;
			},
			{
				message: "Rejection reason is required when rejecting an application!",
				path: ["rejectionReason"],
			},
		),
});

const updateUserStatusSchema = z.object({
	body: z.object({
		status: z.enum(
			[UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.PENDING],
			{
				message: "Invalid user status provided!",
			},
		),
	}),
});

export const AdminValidation = {
	verifyRecruiterSchema,
	updateUserStatusSchema,
};
