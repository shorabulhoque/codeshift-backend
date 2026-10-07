import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { jobApplicationService } from "./job-application.service";
import type { IAuthUser } from "./job-application.interface";

const applyJob = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await jobApplicationService.applyJob(user, req.body);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message,
		data,
	});
});

const reviewApplication = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await jobApplicationService.reviewApplication(
		id as string,
		req.body,
	);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await jobApplicationService.getMyApplications(user);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const getJobApplications = catchAsync(async (req: Request, res: Response) => {
	const { jobId } = req.params;
	const user = req.user as IAuthUser;
	const result = await jobApplicationService.getJobApplications(
		user,
		jobId as string,
	);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

export const jobApplicationController = {
	applyJob,
	reviewApplication,
	getMyApplications,
	getJobApplications,
};
