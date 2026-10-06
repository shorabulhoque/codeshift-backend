import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post(
	"/create-session",
	checkAuth(USER_ROLE.RECRUITER),
	PaymentController.createPaymentSession,
);

router.post("/webhook", PaymentController.handleStripeWebhook);
export const PaymentRoutes = router;
