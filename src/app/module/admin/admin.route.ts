import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { AdminValidation } from "./admin.validation";
import { adminController } from "./admin.controller";

const router = express.Router();

router.get(
	"/recruiters/pending",
	checkAuth(USER_ROLE.ADMIN),
	adminController.getPendingRecruiters,
);

router.patch(
	"/recruiters/:id/verify",
	checkAuth(USER_ROLE.ADMIN),
	validateRequest(AdminValidation.verifyRecruiterSchema),
	adminController.verifyRecruiter,
);

router.patch(
	"/users/:id/status",
	checkAuth(USER_ROLE.ADMIN),
	validateRequest(AdminValidation.updateUserStatusSchema),
	adminController.updateUserStatus,
);

router.get(
	"/stats",
	checkAuth(USER_ROLE.ADMIN),
	adminController.getPlatformStats,
);

export const AdminRoutes = router;
