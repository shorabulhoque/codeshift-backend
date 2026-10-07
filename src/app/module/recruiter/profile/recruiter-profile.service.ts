import httpStatus from "http-status";
import type {
	IAuthUser,
	IUpdateRecruiterProfile,
} from "./recruiter-profile.interface";
import { prisma } from "../../../lib/prisma";
import AppError from "../../../errors/app-error";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../../lib/file-uploader";

// const getMyProfile = async (authUser: IAuthUser) => {
//     const profile = await prisma.recruiterProfile.findUnique({
//         where: { userId: authUser.userId },
//         include: {
//             currentVersion: true,
//             versions: {
//                 orderBy: { version: "desc" },
//                 take: 5,
//             },
//             user: {
//                 select: {
//                     id: true,
//                     email: true,
//                     roles: true,
//                     activeRole: true,
//                     status: true,
//                 },
//             },
//         },
//     });

//     if (!profile) {
//         throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
//     }

//     return {
//         message: "Recruiter profile fetched successfully!",
//         data: profile,
//     };
// };

const updateMyProfile = async (
	authUser: IAuthUser,
	payload: IUpdateRecruiterProfile,
) => {
	const profile = await prisma.recruiterProfile.findUnique({
		where: { userId: authUser.userId },
		include: { currentVersion: true },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	const result = await prisma.$transaction(async (tx) => {
		const nextVersion = (profile.currentVersion?.version || 0) + 1;

		const newVersion = await tx.recruiterProfileVersion.create({
			data: {
				recruiterProfileId: profile.id,
				version: nextVersion,
				fullName: payload.fullName ?? profile.currentVersion?.fullName ?? null,
				designation:
					payload.designation ?? profile.currentVersion?.designation ?? null,
				companyName:
					payload.companyName ?? profile.currentVersion?.companyName ?? "",
				companyWebsite:
					payload.companyWebsite ??
					profile.currentVersion?.companyWebsite ??
					null,
				companySize:
					payload.companySize ?? profile.currentVersion?.companySize ?? null,
				businessRegistrationNo: payload.businessRegistrationNo
					? payload.businessRegistrationNo
					: profile.currentVersion?.businessRegistrationNo
						? profile.currentVersion?.businessRegistrationNo
						: "",
				location: payload.location ?? profile.currentVersion?.location ?? null,
				companyLogo: profile.currentVersion?.companyLogo ?? null,
				companyLogoPublicId:
					profile.currentVersion?.companyLogoPublicId ?? null,
			},
		});

		const updatedProfile = await tx.recruiterProfile.update({
			where: { id: profile.id },
			data: {
				currentVersionId: newVersion.id,
			},
			include: {
				currentVersion: true,
			},
		});

		return updatedProfile;
	});

	return {
		message: "Recruiter profile updated successfully!",
		data: result,
	};
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
		include: { currentVersion: true },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	if (profile.currentVersion?.companyLogoPublicId) {
		await deleteFromCloudinary(
			profile.currentVersion.companyLogoPublicId,
			"image",
		);
	}

	const uploadResult = await uploadToCloudinary(file, "company_logos", "image");

	const result = await prisma.$transaction(async (tx) => {
		const nextVersion = (profile.currentVersion?.version || 0) + 1;

		const newVersion = await tx.recruiterProfileVersion.create({
			data: {
				recruiterProfileId: profile.id,
				version: nextVersion,
				fullName: profile.currentVersion?.fullName ?? null,
				designation: profile.currentVersion?.designation ?? null,
				companyName: profile.currentVersion?.companyName ?? "",
				companyWebsite: profile.currentVersion?.companyWebsite ?? null,
				companySize: profile.currentVersion?.companySize ?? null,
				businessRegistrationNo:
					profile.currentVersion?.businessRegistrationNo ?? "",
				location: profile.currentVersion?.location ?? null,
				companyLogo: uploadResult.secure_url,
				companyLogoPublicId: uploadResult.public_id,
			},
		});

		const updatedProfile = await tx.recruiterProfile.update({
			where: { id: profile.id },
			data: {
				currentVersionId: newVersion.id,
			},
			include: {
				currentVersion: true,
			},
		});

		return updatedProfile;
	});

	return {
		message: "Company logo updated successfully!",
		data: result,
	};
};

const deleteCompanyLogo = async (authUser: IAuthUser) => {
	const profile = await prisma.recruiterProfile.findUnique({
		where: { userId: authUser.userId },
		include: { currentVersion: true },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	if (!profile.currentVersion?.companyLogoPublicId) {
		throw new AppError(httpStatus.BAD_REQUEST, "No logo found to delete!");
	}

	await deleteFromCloudinary(
		profile.currentVersion.companyLogoPublicId,
		"image",
	);

	const result = await prisma.$transaction(async (tx) => {
		const nextVersion = (profile.currentVersion?.version || 0) + 1;

		const newVersion = await tx.recruiterProfileVersion.create({
			data: {
				recruiterProfileId: profile.id,
				version: nextVersion,
				fullName: profile.currentVersion?.fullName ?? null,
				designation: profile.currentVersion?.designation ?? null,
				companyName: profile.currentVersion?.companyName ?? "",
				companyWebsite: profile.currentVersion?.companyWebsite ?? null,
				companySize: profile.currentVersion?.companySize ?? null,
				businessRegistrationNo:
					profile.currentVersion?.businessRegistrationNo ?? "",
				location: profile.currentVersion?.location ?? null,
				companyLogo: null,
				companyLogoPublicId: null,
			},
		});

		const updatedProfile = await tx.recruiterProfile.update({
			where: { id: profile.id },
			data: {
				currentVersionId: newVersion.id,
			},
			include: {
				currentVersion: true,
			},
		});

		return updatedProfile;
	});

	return {
		message: "Company logo removed successfully!",
		data: result,
	};
};

export const recruiterProfileService = {
	// getMyProfile,
	updateMyProfile,
	updateCompanyLogo,
	deleteCompanyLogo,
};
