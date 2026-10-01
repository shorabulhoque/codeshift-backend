import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { IAuthUser } from "../auth/auth.interface";
import type { IUpdateCandidateProfile } from "./candidate.interface";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../lib/fileUploader";

const updateMyProfile = async (
	authUser: IAuthUser,
	payload: IUpdateCandidateProfile,
) => {
	const user = await prisma.user.findUnique({
		where: { id: authUser.userId, isDeleted: false },
		include: { candidateProfile: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (!user.candidateProfile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found");
	}

	const updateData = Object.fromEntries(
		Object.entries(payload).filter(([_, value]) => value !== undefined),
	);

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: user.id },
		data: updateData,
	});

	return updatedProfile;
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

	return updatedProfile;
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
	// if (file.mimetype !== "application/pdf") {
	//     throw new AppError(httpStatus.BAD_REQUEST, "Only PDF files are allowed for resume!");
	// }

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

	const updatedProfile = await prisma.candidateProfile.update({
		where: { userId: authUser.userId },
		data: {
			resumeUrl: uploadResult.secure_url,
			resumePublicId: uploadResult.public_id,
		},
	});

	return updatedProfile;
};

const getCandidateById = async (id: string) => {
	const profile = await prisma.candidateProfile.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					email: true,
					role: true,
					status: true,
				},
			},
		},
	});

	if (!profile) {
		throw new AppError(httpStatus.NOT_FOUND, "Candidate profile not found!");
	}

	return profile;
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

	return updatedProfile;
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

	return updatedProfile;
};

export const CandidateService = {
	updateMyProfile,
	updateAvatar,
	updateResume,
	getCandidateById,
	deleteAvatar,
	deleteResume,
};
