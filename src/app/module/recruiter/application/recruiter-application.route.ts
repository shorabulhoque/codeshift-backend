import express, { type NextFunction, type Request, type Response } from "express";
import { USER_ROLE } from "../../../constants/auth.constant";
import { checkAuth } from "../../../middleware/check-auth";
import validateRequest from "../../../middleware/validate-request";
import { recruiterApplicationController } from "./recruiter-application.controller";
import { recruiterApplicationValidation } from "./recruiter-application.validation";
import { upload } from "../../../middleware/multer";

const router = express.Router();

router.post(
    "/",
    checkAuth(USER_ROLE.CANDIDATE),
    upload.single("companyLogo"),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(recruiterApplicationValidation.createApplicationSchema),
    recruiterApplicationController.createApplication,
);

router.get(
    "/me",
    checkAuth(USER_ROLE.CANDIDATE),
    recruiterApplicationController.getMyApplication,
);

export const RecruiterApplicationRoutes = router;