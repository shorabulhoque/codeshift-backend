import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { jobController } from "./job.controller";
import { jobValidation } from "./job.validation";

const router = express.Router();

router.post(
	"/",
	checkAuth(USER_ROLE.RECRUITER),
	validateRequest(jobValidation.createJobSchema),
	jobController.createJob,
);
router.get(
	"/",
	checkAuth(USER_ROLE.CANDIDATE, USER_ROLE.RECRUITER, USER_ROLE.ADMIN),
	jobController.getAllJobs,
);

router.get("/my-jobs", checkAuth(USER_ROLE.RECRUITER), jobController.getMyJobs);

export const JobRoutes = router;
