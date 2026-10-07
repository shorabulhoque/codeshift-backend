import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { candidateValidation } from "./candidate.validation";
import { candidateController } from "./candidate.controller";
import { upload } from "../../middleware/multer";

const router = express.Router();

// router.get(
// 	"/me",
// 	checkAuth(USER_ROLE.CANDIDATE),
// 	candidateController.getMyProfile,
// );

router.patch(
	"/me",
	checkAuth(USER_ROLE.CANDIDATE),
	validateRequest(candidateValidation.updateProfileSchema),
	candidateController.updateMyProfile,
);

router.patch(
	"/me/avatar",
	checkAuth(USER_ROLE.CANDIDATE),
	upload.single("avatar"),
	candidateController.updateAvatar,
);

router.patch(
	"/me/resume",
	checkAuth(USER_ROLE.CANDIDATE),
	upload.single("resume"),
	candidateController.updateResume,
);

router.get(
	"/:id",
	checkAuth(USER_ROLE.RECRUITER, USER_ROLE.ADMIN),
	candidateController.getCandidateById,
);

router.delete(
	"/me/avatar",
	checkAuth(USER_ROLE.CANDIDATE),
	candidateController.deleteAvatar,
);

router.delete(
	"/me/resume",
	checkAuth(USER_ROLE.CANDIDATE),
	candidateController.deleteResume,
);

export const CandidateRoutes = router;
