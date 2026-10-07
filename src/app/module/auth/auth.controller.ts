import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { authService } from "./auth.service";
import config from "../../config";
import AppError from "../../errors/app-error";
import type { IAuthUser } from "./auth.interface";

const register = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.register(req.body);
	const { message } = result;

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: message,
		data: null,
	});
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.verifyEmail(req.body);
	const { message, data } = result;
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const login = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.login(req.body);
	const { message, accessToken, refreshToken } = result;

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
		data: {
			refreshToken,
			accessToken,
		},
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.googleLogin(req.body);
	const { message, accessToken, refreshToken } = result;

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
		data: {
			accessToken,
			refreshToken,
		},
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
	const {
		message,
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
	} = result;

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

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.forgotPassword(req.body);
	const { message } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.resetPassword(req.body);
	const { message } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const authUser = req.user as IAuthUser;
	const result = await authService.getMe(authUser);
	const { message, data } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: data,
	});
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
	const authUser = req.user as IAuthUser;
	const result = await authService.changePassword(authUser, req.body);
	const { message } = result;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: message,
		data: null,
	});
});

const switchRole = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const result = await authService.switchRole(user, req.body);
	const { message, accessToken, refreshToken, activeRole } = result;

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
		data: {
			accessToken: accessToken,
			refreshToken: refreshToken,
			activeRole: activeRole,
		},
	});
});

export const authController = {
	register,
	verifyEmail,
	login,
	googleLogin,
	refreshToken,
	forgotPassword,
	resetPassword,
	getMe,
	changePassword,
	switchRole,
};
