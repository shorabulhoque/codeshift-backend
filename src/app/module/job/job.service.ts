import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../../../generated/prisma/client";

const createJob = async (
	userId: string,
	payload: {
		title: string;
		description: string;
		assignmentDetails: string;
		deadline?: string;
	},
) => {
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { userId },
	});
	if (!recruiter)
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");

	return await prisma.job.create({
		data: {
			title: payload.title,
			description: payload.description,
			assignmentDetails: payload.assignmentDetails,
			deadline: payload.deadline ? new Date(payload.deadline) : null,
			recruiterId: recruiter.id,
		},
	});
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

	const andConditions: Prisma.JobWhereInput[] = [];

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
						companyName: {
							contains: searchTerm as string,
							mode: "insensitive",
						},
					},
				},
			],
		});
	}

	const whereConditions: Prisma.JobWhereInput =
		andConditions.length > 0 ? { AND: andConditions } : {};

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
					select: { companyName: true, location: true, companyLogo: true },
				},
			},
		}),
		prisma.job.count({ where: whereConditions }),
	]);

	return {
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

	return await prisma.job.findMany({
		where: { recruiterId: recruiter.id },
		include: {
			_count: {
				select: { applications: true }, // জবে কতজন অ্যাপ্লাই করেছে তার কাউন্ট
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

export const JobService = { createJob, getAllJobs, getMyJobs };
