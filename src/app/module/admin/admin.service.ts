import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import {
	PaymentStatus,
	RecruiterApplicationStatus,
	UserRole,
	UserStatus,
} from "../../../../generated/prisma/enums";
import type { IAuthUser, IVerifyRecruiterPayload } from "./admin.interface";

const getPendingRecruiters = async () => {
	const pendingRecruiters = await prisma.recruiterApplication.findMany({
		where: {
			status: RecruiterApplicationStatus.PENDING,
		},
		include: {
			applicant: {
				select: {
					id: true,
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

	return {
		message: "Pending recruiters fetched successfully!",
		data: pendingRecruiters,
	};
};

const verifyRecruiter = async (
	authUser: IAuthUser,
	applicationId: string,
	payload: IVerifyRecruiterPayload,
) => {
	const { userId } = authUser;
	const application = await prisma.recruiterApplication.findUnique({
		where: { id: applicationId },
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter Application not found!");
	}

	if (application.status === RecruiterApplicationStatus.APPROVED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Recruiter Application is already approved!",
		);
	}

	if (application.status === RecruiterApplicationStatus.REJECTED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Recruiter Application is already rejected!",
		);
	}

	if (payload.status === RecruiterApplicationStatus.REJECTED) {
		if (!payload.rejectionReason) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Rejection reason is required when rejecting an application!",
			);
		}

		const rejectedApplication = await prisma.recruiterApplication.update({
			where: { id: applicationId },
			data: {
				status: RecruiterApplicationStatus.REJECTED,
				rejectionReason: payload.rejectionReason,
				reviewedById: userId,
				reviewedAt: new Date(),
			},
		});

		return {
			message: "Recruiter application rejected successfully!",
			data: rejectedApplication,
		};
	}

	if (payload.status === RecruiterApplicationStatus.APPROVED) {
		const result = await prisma.$transaction(async (tx) => {
			const updatedApp = await tx.recruiterApplication.update({
				where: { id: applicationId },
				data: {
					status: RecruiterApplicationStatus.APPROVED,
					reviewedById: userId,
					reviewedAt: new Date(),
				},
			});

			const user = await tx.user.findUnique({
				where: { id: application.applicantId },
			});

			if (!user) {
				throw new AppError(httpStatus.NOT_FOUND, "Applicant user not found!");
			}

			const updatedRoles = Array.from(
				new Set([...user.roles, UserRole.RECRUITER]),
			);

			await tx.user.update({
				where: { id: application.applicantId },
				data: {
					roles: updatedRoles,
				},
			});

			let recruiterProfile = await tx.recruiterProfile.findUnique({
				where: { userId: application.applicantId },
			});

			if (!recruiterProfile) {
				recruiterProfile = await tx.recruiterProfile.create({
					data: {
						userId: application.applicantId,
					},
				});
			}

			const profileVersion = await tx.recruiterProfileVersion.create({
				data: {
					recruiterProfileId: recruiterProfile.id,
					version: 1,
					fullName: application.fullName,
					designation: application.designation,
					companyName: application.companyName,
					companyWebsite: application.companyWebsite,
					companySize: application.companySize,
					businessRegistrationNo: application.businessRegistrationNo,
					location: application.location,
					companyLogo: application.companyLogo,
					companyLogoPublicId: application.companyLogoPublicId,
				},
			});

			await tx.recruiterProfile.update({
				where: { id: recruiterProfile.id },
				data: {
					currentVersionId: profileVersion.id,
				},
			});

			return updatedApp;
		});

		return {
			message: "Recruiter application approved successfully!",
			data: result,
		};
	}

	throw new AppError(httpStatus.BAD_REQUEST, "Invalid status payload provided!");
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
	const user = await prisma.user.findUnique({
		where: { id: userId, isDeleted: false },
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
			roles: true,
			activeRole: true,
			status: true,
			updatedAt: true,
		},
	});

	return {
		message: `User status updated to ${status} successfully!`,
		data: updatedUser,
	};
};


const getPlatformStats = async () => {
	const [
		totalUsers,
		totalRecruiters,
		totalCandidates,
		pendingApplications,
		totalJobs,
		totalJobApplications,
		totalPayments,
	] = await Promise.all([
		prisma.user.count({ where: { isDeleted: false } }),
		prisma.recruiterProfile.count(),
		prisma.candidateProfile.count(),
		prisma.recruiterApplication.count({
			where: { status: RecruiterApplicationStatus.PENDING },
		}),
		prisma.job.count(),
		prisma.jobApplication.count(),
		prisma.payment.aggregate({
			where: { status: PaymentStatus.COMPLETED },
			_sum: { amount: true },
			_count: { id: true },
		}),
	]);

	return {
		message: "Platform stats retrieved successfully!",
		data: {
			totalUsers,
			totalRecruiters,
			totalCandidates,
			pendingRecruiterApplications: pendingApplications,
			totalJobs,
			totalJobApplications,
			successfulPaymentsCount: totalPayments._count.id,
			totalRevenue: totalPayments._sum.amount || 0,
		},
	};
};

export const adminService = {
	getPendingRecruiters,
	verifyRecruiter,
	updateUserStatus,
	getPlatformStats,
};
