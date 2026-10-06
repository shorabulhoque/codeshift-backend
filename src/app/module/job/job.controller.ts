import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { JobService } from "./job.service";
import type { IAuthUser } from "../auth/auth.interface";

const createJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await JobService.createJob(user.userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Job posted successfully!",
		data: result,
	});
});

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
	const result = await JobService.getAllJobs(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Jobs fetched successfully!",
		meta: result.meta,
		data: result.data,
	});
});

const getMyJobs = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await JobService.getMyJobs(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My posted jobs retrieved successfully!",
		data: result,
	});
});

export const JobController = { createJob, getAllJobs, getMyJobs };
