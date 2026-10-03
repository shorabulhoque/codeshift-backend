import bcrypt from "bcryptjs";
import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import redisClient from "../../lib/redis";
import { sendEmailWithTemplate } from "../../lib/email/index";
import type {
	IAuthUser,
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	// IRegisterCandidatePayload,
	IRegisterPayload,
	// IRegisterRecruiterPayload,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import {
	AuthProvider,
	RecruiterVerificationStatus,
	UserRole,
	UserStatus,
} from "../../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { AUTH_ERROR_MESSAGES } from "../../constants/auth.constant";
import type { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import type { Prisma } from "../../../../generated/prisma/client";

const register = async (payload: IRegisterPayload) => {
	const { email, password, fullName } = payload;
	const normalizedEmail = email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({
		where: {
			email: normalizedEmail,
		},
	});

	if (existingUser) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists!",
		);
	}

	const hashedPassword = await bcrypt.hash(
		password,
		config.bcrypt_salt_rounds,
	);

	const otp = crypto.randomInt(100000, 1000000).toString();

	const expirationSeconds = 5 * 60;

	const registrationPayload = {
		otp,
		email: normalizedEmail,
		password: hashedPassword,
		fullName: fullName,
	};

	await redisClient.setEx(
		`user-registration:${normalizedEmail}`,
		expirationSeconds,
		JSON.stringify(registrationPayload),
	);

	if (config.isDevelopment) {
		console.log("\n========================================");
		console.log(`📩 [DEV ONLY] Registration OTP for: ${normalizedEmail}`);
		console.log(`🔢 Verification Code: ${otp}`);
		console.log("========================================\n");
	}

	await sendEmailWithTemplate(
		normalizedEmail,
		"Email Verification OTP",
		"otpEmail",
		{
			otp,
			expirationMinutes: 5,
		},
	);

	return {
		message:
			"Verification code sent to your email. Please verify to complete registration.",
	};
};

// const registerCandidate = async (payload: IRegisterCandidatePayload) => {
// 	const normalizedEmail = payload.email.trim().toLowerCase();

// 	const existingUser = await prisma.user.findUnique({
// 		where: { email: normalizedEmail },
// 	});

// 	if (existingUser) {
// 		throw new AppError(
// 			httpStatus.CONFLICT,
// 			"User with this email already exists!",
// 		);
// 	}

// 	const hashedPassword = await bcrypt.hash(
// 		payload.password,
// 		config.bcrypt_salt_rounds,
// 	);
// 	const otp = crypto.randomInt(100000, 1000000).toString();
// 	const expirationSeconds = 5 * 60;

// 	const registrationPayload = {
// 		otp,
// 		email: normalizedEmail,
// 		password: hashedPassword,
// 		role: "CANDIDATE",
// 		fullName: payload.fullName,
// 	};

// 	await redisClient.setEx(
// 		`user-registration:${normalizedEmail}`,
// 		expirationSeconds,
// 		JSON.stringify(registrationPayload),
// 	);

// 	await sendEmailWithTemplate(
// 		normalizedEmail,
// 		"Email Verification OTP",
// 		"otpEmail",
// 		{
// 			otp,
// 			expirationMinutes: 5,
// 		},
// 	);

// 	return {
// 		message:
// 			"Verification code sent to your email. Please verify to complete registration.",
// 	};
// };

// const registerRecruiter = async (payload: IRegisterRecruiterPayload) => {
// 	const normalizedEmail = payload.email.trim().toLowerCase();

// 	const existingUser = await prisma.user.findUnique({
// 		where: { email: normalizedEmail },
// 	});

// 	if (existingUser) {
// 		throw new AppError(
// 			httpStatus.CONFLICT,
// 			"User with this email already exists!",
// 		);
// 	}

// 	const hashedPassword = await bcrypt.hash(
// 		payload.password,
// 		config.bcrypt_salt_rounds,
// 	);
// 	const otp = crypto.randomInt(100000, 1000000).toString();
// 	const expirationSeconds = 5 * 60;

// 	const registrationPayload = {
// 		otp,
// 		email: normalizedEmail,
// 		password: hashedPassword,
// 		role: "RECRUITER",
// 		fullName: payload.fullName,
// 		companyName: payload.companyName,
// 		businessRegistrationNo: payload.businessRegistrationNo,
// 	};

// 	await redisClient.setEx(
// 		`user-registration:${normalizedEmail}`,
// 		expirationSeconds,
// 		JSON.stringify(registrationPayload),
// 	);

// 	await sendEmailWithTemplate(
// 		normalizedEmail,
// 		"Email Verification OTP",
// 		"otpEmail",
// 		{
// 			otp,
// 			expirationMinutes: 5,
// 		},
// 	);

// 	return {
// 		message:
// 			"Verification code sent to your email. Please verify to complete registration.",
// 	};
// };

const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const { email, otp } = payload;
	const normalizedEmail = email.trim().toLowerCase();
	const redisKey = `user-registration:${normalizedEmail}`;

	const redisData = await redisClient.get(redisKey);

	if (!redisData) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"OTP has expired or registration session is invalid. Please register again.",
		);
	}

	const userData = JSON.parse(redisData);

	if (userData.otp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP code.");
	}

	const existingUser = await prisma.user.findUnique({
		where: {
			email: normalizedEmail,
		},
	});

	if (existingUser) {
		throw new AppError(httpStatus.CONFLICT, "User already exists with this email",);
	}

	const result = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				email: userData.email,
				password: userData.password,
				roles: [UserRole.CANDIDATE],
				activeRole: UserRole.CANDIDATE,
				status: UserStatus.ACTIVE,
				isEmailVerified: true,
			},
			select: {
				id: true,
				email: true,
				roles: true,
				activeRole: true,
				status: true,
				isEmailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await tx.account.create({
			data: {
				userId: user.id,
				provider: AuthProvider.CREDENTIALS,
				providerId: user.id,
			},
		});

		const profile = await tx.candidateProfile.create({
			data: {
				userId: user.id,
				fullName: userData.fullName,
			},
		});

		return { user, profile };
	});

	await redisClient.del(redisKey);

	await sendEmailWithTemplate(
		userData.email,
		"Welcome to CodeShift!",
		"candidateWelcomeEmail",
		{ fullName: userData.fullName },
	);

	return {
		message: "Email verified successfully! Your account is now active.",
		data: result,
	};
};

// const verifyEmail = async (payload: IVerifyEmailPayload) => {
// 	const normalizedEmail = payload.email.trim().toLowerCase();
// 	const stagingKey = `user-registration:${normalizedEmail}`;

// 	const redisData = await redisClient.get(stagingKey);

// 	if (!redisData) {
// 		throw new AppError(
// 			httpStatus.BAD_REQUEST,
// 			"OTP has expired or registration session is invalid.",
// 		);
// 	}

// 	const userData = JSON.parse(redisData);

// 	if (userData.otp !== payload.otp) {
// 		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP code.");
// 	}

// 	const result = await prisma.$transaction(async (tx) => {
// 		const user = await tx.user.create({
// 			data: {
// 				email: userData.email,
// 				password: userData.password,
// 				role: userData.role,
// 				status: "ACTIVE",
// 				isEmailVerified: true,
// 			},
// 			select: {
// 				id: true,
// 				email: true,
// 				role: true,
// 				status: true,
// 				isEmailVerified: true,
// 				createdAt: true,
// 				updatedAt: true,
// 			},
// 		});

// 		let profile = null;

// 		if (userData.role === "CANDIDATE") {
// 			profile = await tx.candidateProfile.create({
// 				data: {
// 					userId: user.id,
// 					fullName: userData.fullName,
// 				},
// 			});
// 		} else if (userData.role === "RECRUITER") {
// 			profile = await tx.recruiterProfile.create({
// 				data: {
// 					userId: user.id,
// 					fullName: userData.fullName,
// 					companyName: userData.companyName,
// 					businessRegistrationNo: userData.businessRegistrationNo,
// 					verificationStatus: "PENDING",
// 				},
// 			});
// 		}

// 		return { user, profile };
// 	});

// 	await redisClient.del(stagingKey);

// 	if (userData.role === "CANDIDATE") {
// 		await sendEmailWithTemplate(
// 			userData.email,
// 			"Welcome to CodeShift!",
// 			"candidateWelcomeEmail",
// 			{ fullName: userData.fullName },
// 		);
// 	} else if (userData.role === "RECRUITER") {
// 		await sendEmailWithTemplate(
// 			userData.email,
// 			"CodeShift Recruiter Registration Under Review",
// 			"recruiterWelcomeEmail",
// 			{
// 				fullName: userData.fullName,
// 				companyName: userData.companyName,
// 				businessRegistrationNo: userData.businessRegistrationNo,
// 			},
// 		);
// 	}

// 	const responseMessage =
// 		userData.role === "RECRUITER"
// 			? "Email verified successfully! Your profile is pending admin approval."
// 			: "Email verified successfully! Your account is now active.";

// 	return {
// 		message: responseMessage,
// 		data: result,
// 	};
// };

const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const normalizedEmail = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail },
		include: {
			recruiterProfile: true,
			candidateProfile: true,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
	}

	if (!user.isEmailVerified) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your email is not verified. Please verify your email first.",
		);
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}

	if (user.status === UserStatus.PENDING) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account registration is pending.",
		);
	}

	if (user.role === "RECRUITER" && user.recruiterProfile) {
		const { verificationStatus, rejectionReason } = user.recruiterProfile;

		if (verificationStatus === RecruiterVerificationStatus.PENDING) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your recruiter profile is under admin review. Please wait for approval.",
			);
		}

		if (verificationStatus === RecruiterVerificationStatus.REJECTED) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				`Your recruiter profile was rejected. Reason: ${rejectionReason || "Contact support for more details."}`,
			);
		}
	}

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		fullName:
			user.role === "CANDIDATE"
				? user.candidateProfile?.fullName
				: user.recruiterProfile?.fullName,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.access_secret,
		{ expiresIn: config.jwt.access_expires_in } as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.refresh_secret as string,
		{ expiresIn: config.jwt.refresh_expires_in } as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const refreshToken = async (token: string) => {
	const verifiedToken = jwtUtils.verifyToken(
		token,
		config.jwt.refresh_secret as string,
	);

	if (!verifiedToken.success || !verifiedToken.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.isDevelopment
				? String(verifiedToken.error)
				: AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
		);
	}

	const decoded = verifiedToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: decoded.userId },
		include: {
			recruiterProfile: true,
			candidateProfile: true,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is blocked. Please contact support.",
		);
	}

	if (user.status === UserStatus.PENDING) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is pending activation.",
		);
	}

	if (user.role === "RECRUITER" && user.recruiterProfile) {
		if (
			user.recruiterProfile.verificationStatus ===
			RecruiterVerificationStatus.REJECTED
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your recruiter account has been rejected.",
			);
		}
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		fullName:
			user.role === "CANDIDATE"
				? user.candidateProfile?.fullName
				: user.recruiterProfile?.fullName,
	};

	const newAccessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.access_secret,
		{ expiresIn: config.jwt.access_expires_in } as SignOptions,
	);

	const newRefreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.refresh_secret,
		{ expiresIn: config.jwt.refresh_expires_in } as SignOptions,
	);

	return {
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
	};
};

type UserWithProfiles = Prisma.UserGetPayload<{
	include: {
		candidateProfile: true;
		recruiterProfile: true;
	};
}>;

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googlePayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google.client_id,
		});
		googlePayload = ticket.getPayload();
	} catch {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID Token",
		);
	}

	if (!googlePayload || !googlePayload.email || !googlePayload.name) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Google account information is incomplete",
		);
	}

	const email = googlePayload.email.toLowerCase().trim();

	let user: UserWithProfiles | null = await prisma.user.findUnique({
		where: { email },
		include: {
			candidateProfile: true,
			recruiterProfile: true,
		},
	});

	if (!user) {
		user = await prisma.user.create({
			data: {
				email,
				role: UserRole.CANDIDATE,
				provider: AuthProvider.GOOGLE,
				providerId: googlePayload.sub,
				isSocialAuth: true,
				isEmailVerified: true,
				status: UserStatus.ACTIVE,
				candidateProfile: {
					create: {
						fullName: googlePayload.name,
						avatar: googlePayload.picture || null,
					},
				},
			},
			include: {
				candidateProfile: true,
				recruiterProfile: true,
			},
		});
	} else {
		if (!user.providerId) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					providerId: googlePayload.sub,
					isSocialAuth: true,
					isEmailVerified: true,
				},
				include: {
					candidateProfile: true,
					recruiterProfile: true,
				},
			});
		}
	}

	if (user.isDeleted || user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, AUTH_ERROR_MESSAGES.USER_BLOCKED);
	}

	if (user.role === UserRole.RECRUITER) {
		if (user.status === UserStatus.PENDING) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your recruiter account is pending Admin approval.",
			);
		}

		if (
			user.recruiterProfile?.verificationStatus ===
			RecruiterVerificationStatus.PENDING
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your recruiter profile is waiting for Admin verification.",
			);
		}

		if (
			user.recruiterProfile?.verificationStatus ===
			RecruiterVerificationStatus.REJECTED
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				AUTH_ERROR_MESSAGES.RECRUITER_REJECTED,
			);
		}
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		fullName:
			user.role === UserRole.CANDIDATE
				? user.candidateProfile?.fullName
				: user.recruiterProfile?.fullName,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.access_secret,
		{ expiresIn: config.jwt.access_expires_in } as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt.refresh_secret,
		{ expiresIn: config.jwt.refresh_expires_in } as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
		user: {
			id: user.id,
			email: user.email,
			role: user.role,
		},
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const normalizedEmail = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail },
	});

	if (!user || user.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"User with this email does not exist",
		);
	}

	if (user.isSocialAuth && !user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created using Google login and does not have a password.",
		);
	}

	const otp = crypto.randomInt(100000, 1000000).toString();
	const expirationSeconds = 5 * 60;

	await redisClient.setEx(
		`password-reset:${normalizedEmail}`,
		expirationSeconds,
		JSON.stringify({ otp }),
	);

	await sendEmailWithTemplate(
		normalizedEmail,
		"Password Reset Verification Code",
		"passwordResetOtpEmail",
		{
			otp,
			expirationMinutes: 5,
		},
	);

	return {
		message: "Password reset OTP sent to your email successfully",
	};
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const normalizedEmail = payload.email.trim().toLowerCase();
	const resetKey = `password-reset:${normalizedEmail}`;

	const redisData = await redisClient.get(resetKey);

	if (!redisData) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"OTP has expired or password reset session is invalid.",
		);
	}

	const { otp } = JSON.parse(redisData);

	if (otp !== payload.otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP code.");
	}

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail },
	});

	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found.");
	}

	const hashedPassword = await bcrypt.hash(
		payload.newPassword,
		config.bcrypt_salt_rounds,
	);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			password: hashedPassword,
		},
	});

	await redisClient.del(resetKey);

	await sendEmailWithTemplate(
		user.email,
		"Password Reset Successful - CodeShift",
		"passwordResetSuccess",
		{},
	);

	return {
		message:
			"Password reset successfully. You can now login with your new password.",
	};
};

const getMe = async (user: IAuthUser) => {
	const result = await prisma.user.findUnique({
		where: {
			id: user.userId,
			isDeleted: false,
		},
		select: {
			id: true,
			email: true,
			role: true,
			status: true,
			isEmailVerified: true,
			isSocialAuth: true,
			createdAt: true,
			updatedAt: true,
			candidateProfile: true,
			recruiterProfile: true,
		},
	});

	if (!result) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
	}

	if (result.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is blocked. Please contact support.",
		);
	}

	return result;
};

const changePassword = async (
	userPayload: IAuthUser,
	payload: { oldPassword: string; newPassword: string },
) => {
	const user = await prisma.user.findUnique({
		where: { id: userPayload.userId, isDeleted: false },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is blocked. Please contact support.",
		);
	}

	if (user.isSocialAuth && !user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Social auth accounts do not have a password to change.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(
		payload.oldPassword,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect old password.");
	}

	const newHashedPassword = await bcrypt.hash(
		payload.newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: { id: user.id },
		data: { password: newHashedPassword },
	});

	return null;
};

export const AuthService = {
	register,
	// registerCandidate,
	// registerRecruiter,
	verifyEmail,
	loginUser,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	getMe,
	changePassword,
};
