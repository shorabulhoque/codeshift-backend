import config from "../../config";
import httpStatus from "http-status";
import AppError from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import type Stripe from "stripe";
import { sendEmailWithTemplate } from "../../lib/email/index";
import type { IAuthUser } from "./payment.interface";

const createCheckoutSession = async (authUser: IAuthUser, amount = 20) => {
	const recruiter = await prisma.recruiterProfile.findUnique({
		where: { userId: authUser.userId },
		include: { user: true },
	});

	if (!recruiter) {
		throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found!");
	}

	const session = await stripe.checkout.sessions.create({
		customer_email: recruiter.user.email,
		line_items: [
			{
				price_data: {
					currency: "usd",
					product_data: {
						name: "Job Posting Fee",
						description: "Single Job Posting Access Credit",
					},
					unit_amount: Math.round(amount * 100),
				},
				quantity: 1,
			},
		],
		mode: "payment",
		payment_method_types: ["card"],
		success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${config.frontend_url}/payment/cancel`,
		metadata: {
			recruiterId: recruiter.id,
		},
	});

	const payment = await prisma.payment.create({
		data: {
			transactionId: session.id,
			amount,
			gateway: "STRIPE",
			status: "PENDING",
			recruiterId: recruiter.id,
		},
	});

	return {
		message: "Payment checkout session created successfully!",
		data: {
			payment,
			paymentUrl: session.url,
		},
	};
};

const handleStripeWebhook = async (payload: Buffer, signature: string) => {
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			payload,
			signature,
			config.stripe.webhook_secret,
		);
	} catch (error: any) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Webhook Error: ${error.message}`,
		);
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const transactionId = session.id;

		if (session.payment_status === "paid") {
			const updatedPayment = await prisma.payment.update({
				where: { transactionId },
				data: {
					status: "COMPLETED",
					paidAt: new Date(),
				},
				include: {
					recruiter: {
						include: {
							user: { select: { email: true } },
							currentVersion: {
								select: { companyName: true, fullName: true },
							},
						},
					},
				},
			});

			if (updatedPayment && updatedPayment.recruiter) {
				const paymentDateFormatted = new Date().toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});

				const companyName =
					updatedPayment.recruiter.currentVersion?.companyName ?? "N/A";
				const recruiterName =
					updatedPayment.recruiter.currentVersion?.fullName ?? "Recruiter";

				await sendEmailWithTemplate(
					updatedPayment.recruiter.user.email,
					`Payment Receipt - Invoice #${transactionId.slice(-8)}`,
					"paymentInvoiceEmail",
					{
						transactionId: updatedPayment.transactionId,
						recruiterName,
						companyName,
						recruiterEmail: updatedPayment.recruiter.user.email,
						paymentDate: paymentDateFormatted,
						amount: updatedPayment.amount,
						currency: updatedPayment.currency || "USD",
					},
				);
			}
		}
	}

	return {
		message: "Webhook processed successfully!",
		data: null,
	};
};

export const paymentService = { createCheckoutSession, handleStripeWebhook };
