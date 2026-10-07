import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { IAuthUser, ICreateJobPayload } from "./job.interface";
import { type Prisma } from "../../../../generated/prisma/client";

const createJob = async (authUser: IAuthUser, payload: ICreateJobPayload) => {
	const { userId } = authUser;
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { userId },
	});
	if (!recruiter) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	const result = await prisma.job.create({
		data: {
			title: payload.title,
			description: payload.description,
			assignmentDetails: payload.assignmentDetails,
			requirements: payload.requirements ?? null,
			responsibilities: payload.responsibilities ?? null,
			deadline: payload.deadline ? new Date(payload.deadline) : null,
			status: payload.status ?? "PUBLISHED",
			recruiterId: recruiter.id,
		},
	});
	return {
		message: "Job posted successfully!",
		data: result,
	};
};

const getAllJobs = async (query: Record<string, unknown>) => {
	const {
		searchTerm,
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = query;

	const pageNumber = Number(page) || 1;
	const limitNumber = Number(limit) || 10;
	const skip = (pageNumber - 1) * limitNumber;

	const andConditions: Prisma.JobWhereInput[] = [{ status: "PUBLISHED" }];

	if (searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: searchTerm as string, mode: "insensitive" } },
				{
					description: { contains: searchTerm as string, mode: "insensitive" },
				},
				{
					assignmentDetails: {
						contains: searchTerm as string,
						mode: "insensitive",
					},
				},
				{
					recruiter: {
						currentVersion: {
							is: {
								companyName: {
									contains: searchTerm as string,
									mode: "insensitive",
								},
							},
						},
					},
				},
			],
		});
	}

	const whereConditions: Prisma.JobWhereInput = { AND: andConditions };

	const [result, total] = await Promise.all([
		prisma.job.findMany({
			where: whereConditions,
			skip,
			take: limitNumber,
			orderBy: {
				[sortBy as string]: sortOrder === "asc" ? "asc" : "desc",
			},
			include: {
				recruiter: {
					select: {
						currentVersion: {
							select: {
								companyName: true,
								location: true,
								companyLogo: true,
							},
						},
					},
				},
			},
		}),
		prisma.job.count({ where: whereConditions }),
	]);

	return {
		message: "Jobs fetched successfully!",
		meta: {
			page: pageNumber,
			limit: limitNumber,
			total,
			totalPage: Math.ceil(total / limitNumber),
		},
		data: result,
	};
};

const getMyJobs = async (recruiterUserId: string) => {
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { userId: recruiterUserId },
	});

	if (!recruiter) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	const result = await prisma.job.findMany({
		where: { recruiterId: recruiter.id },
		include: {
			_count: {
				select: { applications: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});
	return {
		message: "My posted jobs retrieved successfully!",
		data: result,
	};
};

export const jobService = { createJob, getAllJobs, getMyJobs };
