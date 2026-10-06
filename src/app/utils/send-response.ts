import type { Response } from "express";

export type TMeta = {
	page: number;
	limit: number;
	total: number;
	totalPage: number;
};

export type TApiResponse<T> = {
	statusCode: number;
	success: boolean;
	message?: string;
	meta?: TMeta;
	data?: T | null;
};

const sendResponse = <T>(res: Response, data: TApiResponse<T>): void => {
	res.status(data.statusCode).json({
		success: data.success,
		message: data.message || "Operation successful",
		meta: data.meta || undefined,
		data: data.data !== undefined ? data.data : null,
	});
};

export default sendResponse;
