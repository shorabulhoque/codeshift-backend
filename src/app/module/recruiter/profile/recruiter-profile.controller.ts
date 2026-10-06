import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catch-async";
import type { IUserPayload } from "./recruiter-profile.interface";
import { recruiterProfileService } from "./recruiter-profile.service";
import sendResponse from "../../../utils/send-response";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUserPayload;
    const result = await recruiterProfileService.updateMyProfile(user, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Recruiter profile updated successfully!",
        data: result,
    });
});

const updateCompanyLogo = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUserPayload;
    const result = await recruiterProfileService.updateCompanyLogo(user, req.file);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Company logo updated successfully!",
        data: result,
    });
});

const deleteCompanyLogo = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUserPayload;
    const result = await recruiterProfileService.deleteCompanyLogo(user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Company logo removed successfully!",
        data: result,
    });
});

export const recruiterProfileController = {
    updateMyProfile,
    updateCompanyLogo,
    deleteCompanyLogo,
};
