import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { JobController } from "./job.controller";
import { JobValidation } from "./job.validation";

const router = express.Router();

router.post(
	"/",
	checkAuth(USER_ROLE.RECRUITER),
	validateRequest(JobValidation.createJobSchema),
	JobController.createJob,
);
router.get(
	"/",
	checkAuth(USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER, USER_ROLE.ADMIN),
	JobController.getAllJobs,
);

router.get("/my-jobs", checkAuth(USER_ROLE.RECRUITER), JobController.getMyJobs);

export const JobRoutes = router;
