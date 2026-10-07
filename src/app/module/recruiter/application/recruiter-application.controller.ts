import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catch-async";
import sendResponse from "../../../utils/send-response";
import { recruiterApplicationService } from "./recruiter-application.service";
import type { IAuthUser } from "./recruiter-application.interface";

const createApplication = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const file = req.file;

	const { message, data } = await recruiterApplicationService.createApplication(
		user,
		req.body,
		file,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message,
		data,
	});
});

const getMyApplication = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const { message, data } =
		await recruiterApplicationService.getMyApplication(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

export const recruiterApplicationController = {
	createApplication,
	getMyApplication,
};
