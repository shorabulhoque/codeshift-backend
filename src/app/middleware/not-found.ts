import type { Request, Response } from "express";
import httpStatus from "http-status";

const notFound = (req: Request, res: Response): void => {
	res.status(httpStatus.NOT_FOUND).json({
		success: false,
		message: "API Route Not Found!",
		errors: [
			{
				path: req.originalUrl,
				message: "The requested API route does not exist on this server.",
			},
		],
	});
};

export default notFound;
