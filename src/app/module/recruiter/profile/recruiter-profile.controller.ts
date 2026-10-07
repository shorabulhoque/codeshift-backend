import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catch-async";
import type { IAuthUser } from "./recruiter-profile.interface";
import { recruiterProfileService } from "./recruiter-profile.service";
import sendResponse from "../../../utils/send-response";

// const getMyProfile = catchAsync(async (req: Request, res: Response) => {
//     const user = req.user as IAuthUser;
//     const result = await recruiterProfileService.getMyProfile(user);
//     const { message, data } = result;

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message,
//         data,
//     });
// });

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await recruiterProfileService.updateMyProfile(user, req.body);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const updateCompanyLogo = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await recruiterProfileService.updateCompanyLogo(
		user,
		req.file,
	);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

const deleteCompanyLogo = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await recruiterProfileService.deleteCompanyLogo(user);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message,
		data,
	});
});

export const recruiterProfileController = {
	// getMyProfile,
	updateMyProfile,
	updateCompanyLogo,
	deleteCompanyLogo,
};
