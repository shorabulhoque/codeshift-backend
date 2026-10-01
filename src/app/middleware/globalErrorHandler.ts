import type {
	ErrorRequestHandler,
	NextFunction,
	Request,
	Response,
} from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../config/index";
import AppError from "../errors/AppError";
import handleZodError, { type TErrorSources } from "../errors/handleZodError";

const globalErrorHandler: ErrorRequestHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let message = "Something went wrong!";
	let errorSources: TErrorSources = [
		{
			path: "",
			message: "Something went wrong",
		},
	];

	if (err instanceof ZodError) {
		const simplifiedError = handleZodError(err);
		statusCode = simplifiedError.statusCode;
		message = simplifiedError.message;
		errorSources = simplifiedError.errorSources;
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errorSources = [
			{
				path: "",
				message: err.message,
			},
		];
	} else if (err instanceof Error) {
		message = err.message;
		errorSources = [
			{
				path: "",
				message: err.message,
			},
		];
	}

	res.status(statusCode).json({
		success: false,
		message,
		errors: errorSources,
		stack: config.env === "development" ? err?.stack : undefined,
	});
};

export default globalErrorHandler;
