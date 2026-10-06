import type { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch-async";
import sendResponse from "../../utils/send-response";
import { PaymentService } from "./payment.service";
import type { IAuthUser } from "../auth/auth.interface";

const createPaymentSession = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IAuthUser;
	const { amount = 20 } = req.body;
	const result = await PaymentService.createPaymentSession(user.userId, amount);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Payment session created successfully!",
		data: result,
	});
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as Buffer;
	const signature = req.headers["stripe-signature"] as string;

	await PaymentService.handleStripeWebhook(payload, signature);
	res.status(httpStatus.OK).json({ received: true });
});

export const PaymentController = { createPaymentSession, handleStripeWebhook };
