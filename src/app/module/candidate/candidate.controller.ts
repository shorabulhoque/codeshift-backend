import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import type { IAuthUser } from "../auth/auth.interface";
import { candidateService } from "./candidate.service";

// const getMyProfile = catchAsync(async (req: Request, res: Response) => {
// 	const user = req.user as IAuthUser;
// 	const result = await candidateService.getMyProfile(user);
// 	const { message, data } = result;

// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: message,
// 		data: data,
// 	});
// });

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await candidateService.updateMyProfile(user, req.body);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const updateAvatar = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await candidateService.updateAvatar(user, req.file);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const updateResume = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await candidateService.updateResume(user, req.file);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const getCandidateById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await candidateService.getCandidateById(id as string);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const deleteAvatar = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await candidateService.deleteAvatar(user);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const deleteResume = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await candidateService.deleteResume(user);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

export const candidateController = {
	// getMyProfile,
	updateMyProfile,
	updateAvatar,
	updateResume,
	getCandidateById,
	deleteAvatar,
	deleteResume,
};