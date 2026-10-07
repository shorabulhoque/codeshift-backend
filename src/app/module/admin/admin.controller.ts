import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { adminService } from "./admin.service";
import type { IAuthUser } from "./admin.interface";

const getPendingRecruiters = catchAsync(async (_req: Request, res: Response) => {
	const result = await adminService.getPendingRecruiters();
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const verifyRecruiter = catchAsync(async (req: Request, res: Response) => {
	const authUser = req.user as IAuthUser;
	const { id } = req.params;
	const result = await adminService.verifyRecruiter(
		authUser,
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

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await adminService.updateUserStatus(
		id as string,
		req.body.status,
	);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const getPlatformStats = catchAsync(async (_req: Request, res: Response) => {
	const result = await adminService.getPlatformStats();
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

export const adminController = {
	getPendingRecruiters,
	verifyRecruiter,
	updateUserStatus,
	getPlatformStats,
};