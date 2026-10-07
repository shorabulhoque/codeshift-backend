import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { jobService } from "./job.service";
import type { IAuthUser } from "../auth/auth.interface";

const createJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await jobService.createJob(user, req.body);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message,
		data,
	});
});

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
	const result = await jobService.getAllJobs(req.query);
	const { message, meta, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		meta,
		data,
	});
});

const getMyJobs = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await jobService.getMyJobs(user.userId);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

export const jobController = { createJob, getAllJobs, getMyJobs };
