import { Router } from "express";
import validateRequest from "../../middleware/validate-request";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { checkAuth } from "../../middleware/check-auth";
import { USER_ROLE } from "../../constants/auth.constant";

const router = Router();

router.post(
	"/register",
	validateRequest(authValidation.registerSchema),
	authController.register,
);

router.post(
	"/verify-email",
	validateRequest(authValidation.verifyEmailSchema),
	authController.verifyEmail,
);

router.post(
	"/login",
	validateRequest(authValidation.loginSchema),
	authController.login,
);

router.post(
	"/google",
	validateRequest(authValidation.googleLoginSchema),
	authController.googleLogin,
);

router.post("/refresh-token", authController.refreshToken);

router.post(
	"/forgot-password",
	validateRequest(authValidation.forgotPasswordSchema),
	authController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(authValidation.resetPasswordSchema),
	authController.resetPassword,
);

router.get("/me", checkAuth(), authController.getMe);

router.patch(
	"/change-password",
	checkAuth(USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	validateRequest(authValidation.changePasswordSchema),
	authController.changePassword,
);

router.post(
	"/switch-role",
	checkAuth(USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	validateRequest(authValidation.switchRoleSchema),
	authController.switchRole,
);

router.post(
	"/logout",
	authController.logout,
);

export const AuthRoutes = router;
