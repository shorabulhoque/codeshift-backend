import httpStatus from "http-status";
import type { IUserPayload, IUpdateRecruiterProfile } from "./recruiter-profile.interface";
import { prisma } from "../../../lib/prisma";
import AppError from "../../../errors/app-error";
import { deleteFromCloudinary, uploadToCloudinary } from "../../../lib/file-uploader";

const updateMyProfile = async (
    authUser: IUserPayload,
    payload: IUpdateRecruiterProfile,
) => {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: authUser.userId },
    });

    if (!profile) {
        throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
    }

    const updateData = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined),
    );

    const updatedProfile = await prisma.recruiterProfile.update({
        where: { userId: authUser.userId },
        data: updateData,
    });

    return updatedProfile;
};

const updateCompanyLogo = async (
    authUser: IUserPayload,
    file?: Express.Multer.File,
) => {
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, "Please upload an image file!");
    }

    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: authUser.userId },
    });

    if (!profile) {
        throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
    }

    if (profile.companyLogoPublicId) {
        await deleteFromCloudinary(profile.companyLogoPublicId, "image");
    }

    const uploadResult = await uploadToCloudinary(file, "company_logos", "image");

    const updatedProfile = await prisma.recruiterProfile.update({
        where: { userId: authUser.userId },
        data: {
            companyLogo: uploadResult.secure_url,
            companyLogoPublicId: uploadResult.public_id,
        },
    });

    return updatedProfile;
};

const deleteCompanyLogo = async (authUser: IUserPayload) => {
    const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: authUser.userId },
    });

    if (!profile) {
        throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
    }

    if (!profile.companyLogoPublicId) {
        throw new AppError(httpStatus.BAD_REQUEST, "No logo found to delete!");
    }

    await deleteFromCloudinary(profile.companyLogoPublicId, "image");

    const updatedProfile = await prisma.recruiterProfile.update({
        where: { userId: authUser.userId },
        data: {
            companyLogo: null,
            companyLogoPublicId: null,
        },
    });

    return updatedProfile;
};

export const recruiterProfileService = {
    updateMyProfile,
    updateCompanyLogo,
    deleteCompanyLogo,
};
