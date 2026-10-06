import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import type { IAuthUser } from "../auth/auth.interface";
import { CandidateService } from "./candidate.service";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await CandidateService.updateMyProfile(user, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Candidate profile updated successfully!",
		data: result,
	});
});

const updateAvatar = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await CandidateService.updateAvatar(user, req.file);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Avatar updated successfully!",
		data: result,
	});
});

const updateResume = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await CandidateService.updateResume(user, req.file);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Resume updated successfully!",
		data: result,
	});
});

const getCandidateById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await CandidateService.getCandidateById(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Candidate profile fetched successfully!",
		data: result,
	});
});

const deleteAvatar = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await CandidateService.deleteAvatar(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Avatar removed successfully!",
		data: result,
	});
});

const deleteResume = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await CandidateService.deleteResume(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Resume removed successfully!",
		data: result,
	});
});

export const CandidateController = {
	updateMyProfile,
	updateAvatar,
	updateResume,
	getCandidateById,
	deleteAvatar,
	deleteResume,
};
