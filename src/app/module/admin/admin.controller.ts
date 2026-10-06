import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { AdminService } from "./admin.service";

const getPendingRecruiters = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getPendingRecruiters();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Pending recruiters fetched successfully!",
		data: result,
	});
});

const verifyRecruiter = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await AdminService.verifyRecruiter(id as string, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Recruiter status updated to ${req.body.status}!`,
		data: result,
	});
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await AdminService.updateUserStatus(
		id as string,
		req.body.status,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `User status changed to ${req.body.status}!`,
		data: result,
	});
});

const getPlatformStats = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getPlatformStats();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Platform stats retrieved successfully!",
		data: result,
	});
});

export const AdminController = {
	getPendingRecruiters,
	verifyRecruiter,
	updateUserStatus,
	getPlatformStats,
};
