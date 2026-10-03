import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";
import AppError from "../../errors/AppError";
import type { IAuthUser } from "./auth.interface";

const register = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.register(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: result.message,
		data: null,
	});
});

// const registerCandidate = catchAsync(async (req: Request, res: Response) => {
// 	const result = await AuthService.registerCandidate(req.body);

// 	sendResponse(res, {
// 		statusCode: httpStatus.CREATED,
// 		success: true,
// 		message: result.message,
// 		data: null,
// 	});
// });

// const registerRecruiter = catchAsync(async (req: Request, res: Response) => {
// 	const result = await AuthService.registerRecruiter(req.body);

// 	sendResponse(res, {
// 		statusCode: httpStatus.CREATED,
// 		success: true,
// 		message: result.message,
// 		data: null,
// 	});
// });

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.verifyEmail(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.message,
		data: result.data,
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const { refreshToken, accessToken } = await AuthService.loginUser(req.body);

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully!",
		data: { refreshToken, accessToken },
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	const token = req.cookies.refreshToken;

	if (!token) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Refresh token is missing from cookies",
		);
	}

	const result = await AuthService.refreshToken(token);
	const { accessToken: newAccessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", newAccessToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New access token generated successfully",
		data: {
			newAccessToken,
			newRefreshToken,
		},
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.googleLogin(req.body);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Google login successful",
		data: {
			accessToken,
			refreshToken,
			user,
		},
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	await AuthService.forgotPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password reset OTP sent to your email successfully",
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	await AuthService.resetPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message:
			"Password reset successful. You can now login with your new password.",
		data: null,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await AuthService.getMe(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully!",
		data: result,
	});
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	await AuthService.changePassword(user, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password changed successfully!",
		data: null,
	});
});

export const AuthController = {
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
