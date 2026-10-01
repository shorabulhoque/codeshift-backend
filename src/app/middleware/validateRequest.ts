import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import catchAsync from "../utils/catchAsync";

const validateRequest = (schema: ZodType) => {
	return catchAsync(
		async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
			const parsed = (await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
				cookies: req.cookies,
			})) as Record<string, any>;

			if (parsed.body) req.body = parsed.body;
			if (parsed.params) req.params = parsed.params;
			if (parsed.query) {
				Object.assign(req.query, parsed.query);
			}

			next();
		},
	);
};

export default validateRequest;
