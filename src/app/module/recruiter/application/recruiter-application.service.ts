import httpStatus from "http-status";
import AppError from "../../../errors/app-error";
import { prisma } from "../../../lib/prisma";
import { RecruiterApplicationStatus } from "../../../../../generated/prisma/enums";
import type {
    IAuthUser,
    ICreateRecruiterApplicationPayload,
} from "./recruiter-application.interface";
import { uploadToCloudinary } from "../../../lib/file-uploader";

const createApplication = async (
    user: IAuthUser,
    payload: ICreateRecruiterApplicationPayload,
    file?: Express.Multer.File,
) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: user.userId, isDeleted: false },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
    }

    const activePendingApplication = await prisma.recruiterApplication.findFirst({
        where: {
            applicantId: user.userId,
            status: RecruiterApplicationStatus.PENDING,
        },
    });

    if (activePendingApplication) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You already have a pending recruiter application. Please wait for admin approval.",
        );
    }

    const activeApprovedApplication = await prisma.recruiterApplication.findFirst({
        where: {
            applicantId: user.userId,
            status: RecruiterApplicationStatus.APPROVED,
        },
    });

    if (activeApprovedApplication) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You are already an approved recruiter!",
        );
    }

    let companyLogo: string | undefined = undefined;
    let companyLogoPublicId: string | undefined = undefined;

    if (file) {
        const uploadResult = await uploadToCloudinary(file, "company_logos", "image");
        companyLogo = uploadResult.secure_url;
        companyLogoPublicId = uploadResult.public_id;
    }

    const application = await prisma.recruiterApplication.create({
        data: {
            applicantId: user.userId,
            fullName: payload.fullName,
            companyName: payload.companyName,
            businessRegistrationNo: payload.businessRegistrationNo,
            designation: payload.designation || null,
            companyWebsite: payload.companyWebsite || null,
            companySize: payload.companySize || null,
            location: payload.location || null,
            companyLogo: companyLogo || null,
            companyLogoPublicId: companyLogoPublicId || null,
            status: RecruiterApplicationStatus.PENDING,
        },
    });

    return {
        message: "Recruiter application submitted successfully! Please wait for admin review.",
        data: application,
    };
};

const getMyApplication = async (user: IAuthUser) => {

    const applications = await prisma.recruiterApplication.findMany({
        where: { applicantId: user.userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            fullName: true,
            designation: true,
            companyName: true,
            companyWebsite: true,
            companySize: true,
            businessRegistrationNo: true,
            companyLogo: true,
            location: true,
            status: true,
            rejectionReason: true,
            reviewedBy: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        message: "Recruiter applications fetched successfully!",
        data: applications,
    };
};

export const recruiterApplicationService = {
    createApplication,
    getMyApplication,
};