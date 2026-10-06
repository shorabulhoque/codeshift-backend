import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/app-error";
import { prisma } from "../lib/prisma";
import catchAsync from "../utils/catch-async";
import { jwtUtils } from "../utils/jwt";
import { UserStatus } from "../../../generated/prisma/enums";

export const checkAuth = (...requiredRoles: string[]) => {
	return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		const token = req.cookies?.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not authorized to access this resource!",
			);
		}

		const verifiedToken = jwtUtils.verifyToken(token, config.jwt.access_secret);

		if (!verifiedToken.success) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				verifiedToken.error || "Token is invalid or expired!",
			);
		}

		const { userId, email, role, fullName } = verifiedToken.data as JwtPayload;

		if (requiredRoles.length && !requiredRoles.includes(role)) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Forbidden! You don't have permission to access this resource.",
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId, email },
		});

		if (!user) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User associated with this token no longer exists!",
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
				"Your account is pending approval or verification.",
			);
		}

		req.user = {
			userId,
			email,
			role,
			fullName,
		};

		next();
	});
};
