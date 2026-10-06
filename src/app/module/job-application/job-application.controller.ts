import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { ApplicationService } from "./job-application.service";
import type { IAuthUser } from "../auth/auth.interface";

const applyJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await ApplicationService.applyJob(user.userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Applied and code submitted successfully!",
		data: result,
	});
});

const reviewApplication = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await ApplicationService.reviewApplication(
		id as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application reviewed successfully!",
		data: result,
	});
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await ApplicationService.getMyApplications(user.userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My applications retrieved successfully!",
		data: result,
	});
});

const getJobApplications = catchAsync(async (req: Request, res: Response) => {
	const { jobId } = req.params;
	const user = req.user as IAuthUser;
	const result = await ApplicationService.getJobApplications(
		user.userId,
		jobId as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Job applications retrieved successfully!",
		data: result,
	});
});

export const ApplicationController = {
	applyJob,
	reviewApplication,
	getMyApplications,
	getJobApplications,
};
