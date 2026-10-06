import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import {
	RecruiterVerificationStatus,
	UserStatus,
} from "../../../../generated/prisma/enums";

const getPendingRecruiters = async () => {
	const pendingRecruiters = await prisma.recruiterProfile.findMany({
		where: {
			verificationStatus: RecruiterVerificationStatus.PENDING,
		},
		include: {
			user: {
				select: {
					email: true,
					status: true,
					createdAt: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return pendingRecruiters;
};

const verifyRecruiter = async (
	recruiterId: string,
	payload: { status: RecruiterVerificationStatus; rejectionReason?: string },
) => {
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { id: recruiterId },
	});

	if (!recruiter) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	return await prisma.$transaction(async (tx) => {
		const updatedProfile = await tx.recruiterProfile.update({
			where: { id: recruiterId },
			data: {
				verificationStatus: payload.status,
				rejectionReason:
					payload.status === RecruiterVerificationStatus.REJECTED
						? (payload.rejectionReason ?? null)
						: null,
			},
		});

		if (payload.status === RecruiterVerificationStatus.APPROVED) {
			await tx.user.update({
				where: { id: recruiter.userId },
				data: { status: UserStatus.ACTIVE },
			});
		}

		return updatedProfile;
	});
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { status },
		select: {
			id: true,
			email: true,
			role: true,
			status: true,
			updatedAt: true,
		},
	});

	return updatedUser;
};

const getPlatformStats = async () => {
	const [
		totalUsers,
		totalRecruiters,
		totalCandidates,
		totalJobs,
		totalApplications,
	] = await Promise.all([
		prisma.user.count({ where: { isDeleted: false } }),
		prisma.recruiterProfile.count(),
		prisma.candidateProfile.count(),
		prisma.job.count(),
		prisma.jobApplication.count(),
	]);

	return {
		totalUsers,
		totalRecruiters,
		totalCandidates,
		totalJobs,
		totalApplications,
	};
};

export const AdminService = {
	getPendingRecruiters,
	verifyRecruiter,
	updateUserStatus,
	getPlatformStats,
};
