import { z } from "zod";

const updateMyProfileSchema = z.object({
    body: z.object({
        fullName: z.string().optional().nullable(),
        designation: z.string().optional().nullable(),
        companyName: z.string().optional(),
        companyWebsite: z.string().trim().url("Invalid URL format").optional().nullable(),
        companySize: z.string().optional().nullable(),
        businessRegistrationNo: z.string().optional(),
        location: z.string().optional().nullable(),
    }),
});

export const recruiterProfileValidation = {
    updateMyProfileSchema,
};
