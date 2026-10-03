import { Router } from "express";
import validateRequest from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/auth";
import { USER_ROLE } from "../../constants/auth.constant";

const router = Router();

router.post(
	"/register",
	validateRequest(AuthValidation.registerSchema),
	AuthController.register,
);

// router.post(
// 	"/register-candidate",
// 	validateRequest(AuthValidation.registerCandidateSchema),
// 	AuthController.registerCandidate,
// );

// router.post(
// 	"/register-recruiter",
// 	validateRequest(AuthValidation.registerRecruiterSchema),
// 	AuthController.registerRecruiter,
// );

router.post(
	"/verify-email",
	validateRequest(AuthValidation.verifyEmailSchema),
	AuthController.verifyEmail,
);

router.post(
	"/login",
	validateRequest(AuthValidation.loginUserSchema),
	AuthController.loginUser,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
	"/google",
	validateRequest(AuthValidation.GoogleLoginZodSchema),
	AuthController.googleLogin,
);

router.post(
	"/forgot-password",
	validateRequest(AuthValidation.forgotPasswordSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(AuthValidation.resetPasswordSchema),
	AuthController.resetPassword,
);

router.get(
	"/me",
	auth(USER_ROLE.ADMIN, USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	AuthController.getMe,
);

router.patch(
	"/change-password",
	auth(USER_ROLE.ADMIN, USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER),
	validateRequest(AuthValidation.changePasswordSchema),
	AuthController.changePassword,
);

export const AuthRoutes = router;
