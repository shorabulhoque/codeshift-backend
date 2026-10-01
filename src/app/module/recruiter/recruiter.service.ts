import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../lib/fileUploader";
import type { IAuthUser } from "../auth/auth.interface";
import type { IUpdateRecruiterProfile } from "./recruiter.interface";

const updateMyProfile = async (
	authUser: IAuthUser,
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
	authUser: IAuthUser,
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

const deleteCompanyLogo = async (authUser: IAuthUser) => {
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

export const RecruiterService = {
	updateMyProfile,
	updateCompanyLogo,
	deleteCompanyLogo,
};
