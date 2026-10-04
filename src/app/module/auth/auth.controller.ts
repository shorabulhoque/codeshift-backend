import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";
import config from "../../config";
import AppError from "../../errors/AppError";
import type { IAuthUserPayload } from "./auth.interface";

const register = catchAsync(async (req: Request, res: Response) => {
	const { message } = await authService.register(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: message,
		data: null,
	});
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const { message, data } = await authService.verifyEmail(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.loginUser(req.body);
	const { message, refreshToken, accessToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: { refreshToken, accessToken },
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	let token = req.cookies?.refreshToken;


	if (!token && req.headers.authorization) {
		token = req.headers.authorization.startsWith("Bearer ")
			? req.headers.authorization.split(" ")[1]
			: req.headers.authorization;
	}

	if (!token) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Refresh token is missing from request!",
		);
	}

	const result = await authService.refreshToken(token);
	const { message, accessToken: newAccessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", newAccessToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: {
			newAccessToken,
			newRefreshToken,
		},
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.googleLogin(req.body);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
		maxAge: 1000 * 60 * 15,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: config.isDevelopment ? false : true,
		sameSite: config.isDevelopment ? "lax" : "none",
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
	const { message } = await authService.forgotPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const { message } = await authService.resetPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUserPayload;
	const result = await authService.getMe(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully!",
		data: result,
	});
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUserPayload;
	const { message } = await authService.changePassword(user, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

export const authController = {
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
