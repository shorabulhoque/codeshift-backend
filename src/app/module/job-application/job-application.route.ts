import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { jobApplicationController } from "./job-application.controller";
import { jobApplicationValidation } from "./job-application.validation";

const router = express.Router();

router.post(
	"/",
	checkAuth(USER_ROLE.CANDIDATE),
	validateRequest(jobApplicationValidation.applyJobSchema),
	jobApplicationController.applyJob,
);
router.patch(
	"/:id/review",
	checkAuth(USER_ROLE.RECRUITER),
	validateRequest(jobApplicationValidation.reviewApplicationSchema),
	jobApplicationController.reviewApplication,
);

router.get(
	"/my-applications",
	checkAuth(USER_ROLE.CANDIDATE),
	jobApplicationController.getMyApplications,
);

router.get(
	"/job/:jobId",
	checkAuth(USER_ROLE.RECRUITER),
	jobApplicationController.getJobApplications,
);

export const JobApplicationRoutes = router;
