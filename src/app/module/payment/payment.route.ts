import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import { paymentController } from "./payment.controller";

const router = express.Router();

router.post(
	"/create-checkout-session",
	checkAuth(USER_ROLE.RECRUITER),
	paymentController.createCheckoutSession,
);

router.post("/webhook", paymentController.handleStripeWebhook);
export const PaymentRoutes = router;
