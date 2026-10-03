import { Router } from "express";
import validateRequest from "../../middleware/validateRequest";
import { authController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/auth";
import { USER_ROLE } from "../../constants/auth.constant";

const router = Router();

router.post(
	"/register",
	validateRequest(AuthValidation.registerValidationSchema),
	authController.register,
);

router.post(
	"/verify-email",
	validateRequest(AuthValidation.verifyEmailValidationSchema),
	authController.verifyEmail,
);

router.post(
	"/login",
	validateRequest(AuthValidation.loginValidationSchema),
	authController.loginUser,
);

router.post("/refresh-token", authController.refreshToken);

router.post(
	"/google",
	validateRequest(AuthValidation.GoogleLoginZodSchema),
	authController.googleLogin,
);

router.post(
	"/forgot-password",
	validateRequest(AuthValidation.forgotPasswordSchema),
	authController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(AuthValidation.resetPasswordSchema),
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
	validateRequest(AuthValidation.changePasswordSchema),
	authController.changePassword,
);

export const AuthRoutes = router;
