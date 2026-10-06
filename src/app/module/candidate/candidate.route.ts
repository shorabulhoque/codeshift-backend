import express from "express";
import { USER_ROLE } from "../../constants/auth.constant";
import { checkAuth } from "../../middleware/check-auth";
import validateRequest from "../../middleware/validate-request";
import { CandidateValidation } from "./candidate.validation";
import { CandidateController } from "./candidate.controller";
import { upload } from "../../middleware/multer";

const router = express.Router();

router.patch(
	"/me",
	checkAuth(USER_ROLE.CANDIDATE),
	validateRequest(CandidateValidation.updateCandidateProfileSchema),
	CandidateController.updateMyProfile,
);

router.patch(
	"/me/avatar",
	checkAuth(USER_ROLE.CANDIDATE),
	upload.single("avatar"),
	CandidateController.updateAvatar,
);

router.patch(
	"/me/resume",
	checkAuth(USER_ROLE.CANDIDATE),
	upload.single("resume"),
	CandidateController.updateResume,
);

router.get("/:id", CandidateController.getCandidateById);

router.delete(
	"/me/avatar",
	checkAuth(USER_ROLE.CANDIDATE),
	CandidateController.deleteAvatar,
);

router.delete(
	"/me/resume",
	checkAuth(USER_ROLE.CANDIDATE),
	CandidateController.deleteResume,
);

export const CandidateRoutes = router;
