import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

router.get(
	"/recruiters/pending",
	checkAuth(USER_ROLE.ADMIN),
	AdminController.getPendingRecruiters,
);

router.patch(
	"/recruiters/:id/verify",
	checkAuth(USER_ROLE.ADMIN),
	validateRequest(AdminValidation.verifyRecruiterSchema),
	AdminController.verifyRecruiter,
);

router.patch(
	"/users/:id/status",
	checkAuth(USER_ROLE.ADMIN),
	validateRequest(AdminValidation.updateUserStatusSchema),
	AdminController.updateUserStatus,
);

router.get("/stats", checkAuth(USER_ROLE.ADMIN), AdminController.getPlatformStats);

export const AdminRoutes = router;
