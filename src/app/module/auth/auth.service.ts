import bcrypt from "bcryptjs";
import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import redisClient from "../../lib/redis";
import { sendEmailWithTemplate } from "../../lib/email/index";
import type {
	IAuthUserPayload,
	IChangePasswordPayload,
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterPayload,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import {
	AuthProvider,
	UserRole,
	UserStatus,
} from "../../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
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

	const registrationData = JSON.parse(redisData);

	if (registrationData.otp !== otp) {
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
				email: registrationData.email,
				password: registrationData.password,
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
				fullName: registrationData.fullName,
			},
		});

		return { user, profile };
	});

	await redisClient.del(redisKey);

	await sendEmailWithTemplate(
		registrationData.email,
		"Welcome to CodeShift!",
		"candidateWelcomeEmail",
		{ fullName: registrationData.fullName },
	);

	return {
		message: "Email verified successfully! Your account is now active.",
		data: result,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const { email, password } = payload;
	const normalizedEmail = email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail, isDeleted: false },
		include: {
			candidateProfile: true,
			recruiterProfile: {
				include: {
					currentVersion: true,
				},
			},
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

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created via Social Auth. Please login using Google or GitHub.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
	}

	let userFullName = "";
	if (user.activeRole === UserRole.CANDIDATE) {
		userFullName = user.candidateProfile?.fullName || "";
	} else if (user.activeRole === UserRole.RECRUITER) {
		userFullName = user.recruiterProfile?.currentVersion?.fullName || "";
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.activeRole,
		fullName: userFullName,
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
		message: "User logged in successfully!",
		accessToken,
		refreshToken,
	};
};

const refreshToken = async (token: string) => {
	const verifiedToken = jwtUtils.verifyToken(
		token,
		config.jwt.refresh_secret as string,
	);

	if (!verifiedToken.success) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired refresh token!",
		);
	}

	const { userId } = verifiedToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: userId, isDeleted: false },
		include: {
			candidateProfile: true,
			recruiterProfile: {
				include: {
					currentVersion: true,
				},
			},
		},
	});

	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist!");
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
			"Your account is pending approval or verification.",
		);
	}

	let userFullName = "";
	if (user.activeRole === UserRole.CANDIDATE) {
		userFullName = user.candidateProfile?.fullName || "";
	} else if (user.activeRole === UserRole.RECRUITER) {
		userFullName = user.recruiterProfile?.currentVersion?.fullName || "";
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.activeRole,
		fullName: userFullName,
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
		message: "Access token refreshed successfully!",
		accessToken: newAccessToken,
		refreshToken: newRefreshToken
	};
};

type UserWithProfiles = Prisma.UserGetPayload<{
	include: {
		candidateProfile: true;
		recruiterProfile: {
			include: { currentVersion: true };
		};
		accounts: true;
	};
}>;

const googleLogin = async (payload: IGoogleLoginPayload) => {
	const { idToken } = payload;
	let googlePayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: idToken,
			audience: config.google.client_id,
		});
		googlePayload = ticket.getPayload();
	} catch {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID Token!",
		);
	}

	if (!googlePayload || !googlePayload.email || !googlePayload.name) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Google account information is incomplete.",
		);
	}

	const normalizedEmail = googlePayload.email.toLowerCase().trim();
	const googleSub = googlePayload.sub;
	const resolvedFullName = googlePayload.name || "";

	const user = (await prisma.$transaction(async (tx) => {
		let existingUser: UserWithProfiles | null = await tx.user.findUnique({
			where: { email: normalizedEmail, isDeleted: false },
			include: {
				candidateProfile: true,
				recruiterProfile: {
					include: { currentVersion: true },
				},
				accounts: true,
			},
		});

		if (!existingUser) {
			existingUser = await tx.user.create({
				data: {
					email: normalizedEmail,
					roles: [UserRole.CANDIDATE],
					activeRole: UserRole.CANDIDATE,
					status: UserStatus.ACTIVE,
					isEmailVerified: true,
					candidateProfile: {
						create: {
							fullName: resolvedFullName,
							avatar: googlePayload.picture || null,
						},
					},
					accounts: {
						create: {
							provider: AuthProvider.GOOGLE,
							providerId: googleSub,
						},
					},
				},
				include: {
					candidateProfile: true,
					recruiterProfile: {
						include: { currentVersion: true },
					},
					accounts: true,
				},
			});
		} else {
			const hasGoogleAccount = existingUser.accounts.some(
				(acc: { provider: AuthProvider }) => acc.provider === AuthProvider.GOOGLE,
			);

			if (!hasGoogleAccount) {
				await tx.account.create({
					data: {
						userId: existingUser.id,
						provider: AuthProvider.GOOGLE,
						providerId: googleSub,
					},
				});
			}

			if (!existingUser.isEmailVerified) {
				existingUser = await tx.user.update({
					where: { id: existingUser.id },
					data: { isEmailVerified: true },
					include: {
						candidateProfile: true,
						recruiterProfile: {
							include: { currentVersion: true },
						},
						accounts: true,
					},
				});
			}
		}

		return existingUser;
	})) as UserWithProfiles;

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been blocked. Please contact support.",
		);
	}

	let userFullName = "";
	if (user.activeRole === UserRole.CANDIDATE) {
		userFullName = user.candidateProfile?.fullName || resolvedFullName;
	} else if (user.activeRole === UserRole.RECRUITER) {
		userFullName =
			user.recruiterProfile?.currentVersion?.fullName || resolvedFullName;
	}

	const jwtPayload = {
		userId: user.id,
		email: user.email,
		role: user.activeRole,
		fullName: userFullName,
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
		message: "Google login successful!",
		accessToken,
		refreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const normalizedEmail = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail, isDeleted: false },
	});

	if (!user) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"User with this email does not exist!",
		);
	}

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created via Social Auth and does not have a password. Please login using Google or GitHub.",
		);
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is blocked. Please contact support.",
		);
	}

	const otp = crypto.randomInt(100000, 1000000).toString();
	const expirationSeconds = 5 * 60;

	await redisClient.setEx(
		`password-reset:${normalizedEmail}`,
		expirationSeconds,
		JSON.stringify({ otp }),
	);

	if (config.isDevelopment) {
		console.log("\n========================================");
		console.log(`📩 [DEV ONLY] Password reset OTP for: ${normalizedEmail}`);
		console.log(`🔢 Verification Code: ${otp}`);
		console.log("========================================\n");
	}

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
		message: "Password reset OTP sent to your email successfully.",
	};
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;
	const normalizedEmail = email.trim().toLowerCase();
	const resetKey = `password-reset:${normalizedEmail}`;

	const redisData = await redisClient.get(resetKey);

	if (!redisData) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"OTP has expired or password reset session is invalid.",
		);
	}

	const { otp: storedOtp } = JSON.parse(redisData);

	if (storedOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP code.");
	}

	const user = await prisma.user.findUnique({
		where: { email: normalizedEmail, isDeleted: false },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found.");
	}

	const hashedPassword = await bcrypt.hash(
		newPassword,
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
		message: "Password reset successfully. You can now login with your new password.",
	};
};

const getMe = async (user: IAuthUserPayload) => {
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
	authUserPayload: IAuthUserPayload,
	changePasswordPayload: IChangePasswordPayload,
) => {
	const { userId } = authUserPayload;
	const { oldPassword, newPassword } = changePasswordPayload;

	const user = await prisma.user.findUnique({
		where: { id: userId, isDeleted: false },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
	}

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You logged in using a social account (Google/GitHub). You cannot change password here.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

	if (!isPasswordMatched) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Incorrect current password. Please try again.",
		);
	}

	const newHashedPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: { id: user.id },
		data: {
			password: newHashedPassword,
		},
	});

	return {
		message: "Password changed successfully!",
	};
};

export const authService = {
	register,
	verifyEmail,
	loginUser,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	getMe,
	changePassword,
};
