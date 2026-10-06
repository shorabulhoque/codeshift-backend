import express from "express";
import { RecruiterApplicationRoutes } from "./application/recruiter-application.route";
import { RecruiterProfileRoutes } from "./profile/recruiter-profile.route";

const router = express.Router();

router.use("/applications", RecruiterApplicationRoutes);
router.use("/profile", RecruiterProfileRoutes);

export const RecruiterRoutes = router;
