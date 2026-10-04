import { Router } from "express";
import validateRequest from "../../middleware/validateRequest";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { auth } from "../../middleware/auth";
import { USER_ROLE } from "../../constants/auth.constant";

const router = Router();

router.post(
	"/register",
	validateRequest(authValidation.registerValidationSchema),
	authController.register,
);

router.post(
	"/verify-email",
	validateRequest(authValidation.verifyEmailValidationSchema),
	authController.verifyEmail,
);

router.post(
	"/login",
	validateRequest(authValidation.loginValidationSchema),
	authController.loginUser,
);

router.post("/refresh-token", authController.refreshToken);

router.post(
	"/google",
	validateRequest(authValidation.GoogleLoginZodSchema),
	authController.googleLogin,
);

router.post(
	"/forgot-password",
	validateRequest(authValidation.forgotPasswordValidationSchema),
	authController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(authValidation.resetPasswordValidationSchema),
	authController.resetPassword,
);

router.get(
	"/me",
	auth(USER_ROLE.ADMIN, USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	authController.getMe,
);

router.patch(
	"/change-password",
	auth(USER_ROLE.ADMIN, USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	validateRequest(authValidation.changePasswordSchema),
	authController.changePassword,
);

export const AuthRoutes = router;
