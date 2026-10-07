import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { paymentService } from "./payment.service";
import type { IAuthUser } from "./payment.interface";

const createCheckoutSession = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as IAuthUser;
		const { amount = 20 } = req.body;
		const result = await paymentService.createCheckoutSession(user, amount);
		const { message, data } = result;

		sendResponse(res, {
			statusCode: httpStatus.CREATED,
			success: true,
			message,
			data,
		});
	},
);

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as Buffer;
	const signature = req.headers["stripe-signature"] as string;

	await paymentService.handleStripeWebhook(payload, signature);
	res.status(httpStatus.OK).json({ received: true });
});

export const paymentController = { createCheckoutSession, handleStripeWebhook };
