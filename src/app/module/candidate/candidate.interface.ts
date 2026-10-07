import type { z } from "zod";
import type { candidateValidation } from "./candidate.validation";
import type { UserRole } from "../../../../generated/prisma/enums";

export type IUpdateCandidateProfile = z.infer<
	typeof candidateValidation.updateProfileSchema
>["body"];

export interface IAuthUser {
	userId: string;
	email: string;
	role: UserRole;
}
