import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { IAuthUser } from "./candidate.interface";
import type { IUpdateCandidateProfile } from "./candidate.interface";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../lib/file-uploader";

// const getMyProfile = async (authUser: IAuthUser) => {
// 	const profile = await prisma.candidateProfile.findUnique({
// 		where: { userId: authUser.userId },
// 		include: {
// 			user: {
// 				select: {
// 					id: true,
// 					email: true,
// 					roles: true,
// 					activeRole: true,
// 					status: true,
// 					isEmailVerified: true,
// 				},
// 			},
// 		},
// 	});

// 	if (!profile) {
// 		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
// 	}

// 	return {
// 		message: "Candidate profile fetched successfully!",
// 		data: profile,
// 	};
// };

const updateMyProfile = async (
	authUser: IAuthUser,
	payload: IUpdateCandidateProfile,
) => {
	const user = await prisma.user.findUnique({
		where: { id: authUser.userId, isDeleted: false },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
	}

	const updateData = Object.fromEntries(
		Object.entries(payload).filter(([_, value]) => value !== undefined),
	);

	const updatedProfile = await prisma.candidateProfile.upsert({
		where: { userId: authUser.userId },
		update: updateData,
		create: {
			userId: authUser.userId,
			fullName: payload.fullName || "Candidate",
			...updateData,
		},
	});

	return {
		message: "Candidate profile updated successfully!",
		data: updatedProfile,
	};
};

const updateAvatar = async (
	authUser: IAuthUser,
	file?: Express.Multer.File,
) => {
	if (!file) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please upload an image file!");
	}

	const profile = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	if (profile.avatarPublicId) {
		await deleteFromCloudinary(profile.avatarPublicId, "image");
	}

	const uploadResult = await uploadToCloudinary(file, "avatars", "image");

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: authUser.userId },
		data: {
			avatar: uploadResult.secure_url,
			avatarPublicId: uploadResult.public_id,
		},
	});

	return {
		message: "Avatar updated successfully!",
		data: updatedProfile,
	};
};

const updateResume = async (
	authUser: IAuthUser,
	file?: Express.Multer.File,
) => {
	if (!file) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please upload a resume file!");
	}

	const isPdfMimetype = file.mimetype.includes("pdf");
	const isPdfExtension = file.originalname.toLowerCase().endsWith(".pdf");

	if (!isPdfMimetype && !isPdfExtension) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only PDF files are allowed for resume!",
		);
	}

	const profile = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	if (profile.resumePublicId) {
		await deleteFromCloudinary(profile.resumePublicId, "raw");
	}

	const uploadResult = await uploadToCloudinary(file, "resumes", "raw");

	// const viewablePdfUrl = uploadResult.secure_url.includes("/upload/fl_inline/")
	// 	? uploadResult.secure_url
	// 	: uploadResult.secure_url.replace("/upload/", "/upload/fl_inline/");

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: authUser.userId },
		data: {
			resumeUrl: uploadResult.secure_url,
			resumePublicId: uploadResult.public_id,
		},
	});

	return {
		message: "Resume updated successfully!",
		data: updatedProfile,
	};
};

const getCandidateById = async (id: string) => {
	const profile = await prisma.candidateProfile.findFirst({
		where: {
			id: id,
		},
		include: {
			user: {
				select: {
					email: true,
				},
			},
		},
		omit: {
			resumePublicId: true,
			avatarPublicId: true,
			createdAt: true,
			updatedAt: true,
		}
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	return {
		message: "Candidate profile fetched successfully!",
		data: profile,
	};
};

const deleteAvatar = async (authUser: IAuthUser) => {
	const profile = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	if (!profile.avatarPublicId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"No avatar image found to delete!",
		);
	}

	await deleteFromCloudinary(profile.avatarPublicId, "image");

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: authUser.userId },
		data: {
			avatar: null,
			avatarPublicId: null,
		},
	});

	return {
		message: "Avatar removed successfully!",
		data: updatedProfile,
	};
};

const deleteResume = async (authUser: IAuthUser) => {
	const profile = await prisma.candidateProfile.findUnique({
		where: { userId: authUser.userId },
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	if (!profile.resumePublicId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"No resume file found to delete!",
		);
	}

	await deleteFromCloudinary(profile.resumePublicId, "raw");

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: authUser.userId },
		data: {
			resumeUrl: null,
			resumePublicId: null,
		},
	});

	return {
		message: "Resume removed successfully!",
		data: updatedProfile
	};
};

export const candidateService = {
	// getMyProfile,
	updateMyProfile,
	updateAvatar,
	updateResume,
	getCandidateById,
	deleteAvatar,
	deleteResume,
};