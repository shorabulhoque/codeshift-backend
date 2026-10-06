import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { ApplicationController } from "./job-application.controller";
import { ApplicationValidation } from "./job-application.validation";

const router = express.Router();

router.post(
	"/",
	checkAuth(USER_ROLE.CANDIDATE),
	validateRequest(ApplicationValidation.applyJobSchema),
	ApplicationController.applyJob,
);
router.patch(
	"/:id/review",
	checkAuth(USER_ROLE.RECRUITER),
	validateRequest(ApplicationValidation.reviewApplicationSchema),
	ApplicationController.reviewApplication,
);

router.get(
	"/my-applications",
	checkAuth(USER_ROLE.CANDIDATE),
	ApplicationController.getMyApplications,
);

router.get(
	"/job/:jobId",
	checkAuth(USER_ROLE.RECRUITER),
	ApplicationController.getJobApplications,
);

export const JobApplicationRoutes = router;
