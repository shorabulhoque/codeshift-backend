import express from "express";
import { recruiterProfileValidation } from "./recruiter-profile.validation";
import validateRequest from "../../../middleware/validate-request";
import { recruiterProfileController } from "./recruiter-profile.controller";
import { checkAuth } from "../../../middleware/check-auth";
import { USER_ROLE } from "../../../constants/auth.constant";
import { upload } from "../../../middleware/multer";

const router = express.Router();

// router.get(
//     "/me",
//     checkAuth(USER_ROLE.RECRUITER),
//     recruiterProfileController.getMyProfile,
// );

router.patch(
	"/me",
	checkAuth(USER_ROLE.RECRUITER),
	validateRequest(recruiterProfileValidation.updateMyProfileSchema),
	recruiterProfileController.updateMyProfile,
);

router.patch(
	"/me/logo",
	checkAuth(USER_ROLE.RECRUITER),
	upload.single("logo"),
	recruiterProfileController.updateCompanyLogo,
);

router.delete(
	"/me/logo",
	checkAuth(USER_ROLE.RECRUITER),
	recruiterProfileController.deleteCompanyLogo,
);

export const RecruiterProfileRoutes = router;
