import type z from "zod";
import type { UserRole } from "../../../../../generated/prisma/enums";
import type { recruiterProfileValidation } from "./recruiter-profile.validation";

export interface IUserPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export type IUpdateRecruiterProfile = z.infer<
    typeof recruiterProfileValidation.updateMyProfileSchema
>["body"];