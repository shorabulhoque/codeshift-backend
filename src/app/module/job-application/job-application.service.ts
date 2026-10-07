import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { sendEmailWithTemplate } from "../../lib/email/index";
import type {
	IAuthUser,
	IApplyJobPayload,
	IReviewApplicationPayload,
} from "./job-application.interface";
import type { ApplicationStatus } from "../../../../generated/prisma/enums";

const applyJob = async (authUser: IAuthUser, payload: IApplyJobPayload) => {
	const candidate = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!candidate) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	const result = await prisma.jobApplication.create({
		data: {
			jobId: payload.jobId,
			candidateId: candidate.id,
			submissionCode: payload.submissionCode,
		},
	});

	return {
		message: "Applied and code submitted successfully!",
		data: result,
	};
};

const reviewApplication = async (
	applicationId: string,
	payload: IReviewApplicationPayload,
) => {
	const application = await prisma.jobApplication.findUnique({
		where: { id: applicationId },
		include: {
			candidate: {
				include: {
					user: { select: { email: true } },
				},
			},
			job: {
				include: {
					recruiter: {
						select: {
							currentVersion: {
								select: { companyName: true },
							},
						},
					},
				},
			},
		},
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found!");
	}

	const updateData: {
		marks?: number;
		reviewerFeedback?: string;
		interviewDate?: Date;
		status?: ApplicationStatus;
	} = {};

	if (payload.marks !== undefined) updateData.marks = payload.marks;
	if (payload.reviewerFeedback !== undefined)
		updateData.reviewerFeedback = payload.reviewerFeedback;
	if (payload.interviewDate !== undefined)
		updateData.interviewDate = new Date(payload.interviewDate);
	if (payload.status !== undefined) updateData.status = payload.status;

	const updatedApplication = await prisma.jobApplication.update({
		where: { id: applicationId },
		data: updateData,
	});

	if (payload.status === "INTERVIEW_SCHEDULED") {
		const formattedDate = updateData.interviewDate
			? new Date(updateData.interviewDate).toLocaleString()
			: "To be announced";

		const companyName =
			application.job.recruiter.currentVersion?.companyName ?? "N/A";

		await sendEmailWithTemplate(
			application.candidate.user.email,
			`Interview Invitation for ${application.job.title}`,
			"interviewScheduledEmail",
			{
				candidateName: application.candidate.fullName,
				jobTitle: application.job.title,
				companyName,
				marks: updateData.marks ?? application.marks ?? "N/A",
				reviewerFeedback:
					updateData.reviewerFeedback ?? application.reviewerFeedback ?? "N/A",
				interviewDate: formattedDate,
			},
		);
	}

	return {
		message: "Application reviewed successfully!",
		data: updatedApplication,
	};
};

const getMyApplications = async (authUser: IAuthUser) => {
	const candidate = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!candidate) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	const applications = await prisma.jobApplication.findMany({
		where: { candidateId: candidate.id },
		include: {
			job: {
				select: {
					id: true,
					title: true,
					description: true,
					assignmentDetails: true,
					deadline: true,
					recruiter: {
						select: {
							currentVersion: {
								select: {
									companyName: true,
									companyLogo: true,
									location: true,
								},
							},
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return {
		message: "My applications retrieved successfully!",
		data: applications,
	};
};

const getJobApplications = async (authUser: IAuthUser, jobId: string) => {
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!recruiter) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	const job = await prisma.job.findFirst({
		where: {
			id: jobId,
			recruiterId: recruiter.id,
		},
	});

	if (!job) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not authorized to view applications for this job!",
		);
	}

	const applications = await prisma.jobApplication.findMany({
		where: { jobId },
		include: {
			candidate: {
				select: {
					id: true,
					fullName: true,
					phone: true,
					headline: true,
					githubUrl: true,
					linkedinUrl: true,
					resumeUrl: true,
					skills: true,
					user: {
						select: {
							email: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return {
		message: "Job applications retrieved successfully!",
		data: applications,
	};
};

export const jobApplicationService = {
	applyJob,
	reviewApplication,
	getMyApplications,
	getJobApplications,
};
