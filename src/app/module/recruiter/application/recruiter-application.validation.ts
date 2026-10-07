import { z } from "zod";

const createApplicationSchema = z.object({
	body: z.object({
		// Required Fields
		fullName: z
			.string({ message: "Full name is required" })
			.min(2, "Full name must be at least 2 characters")
			.max(100, "Full name cannot exceed 100 characters"),

		companyName: z
			.string({ message: "Company name is required" })
			.min(2, "Company name must be at least 2 characters")
			.max(100, "Company name cannot exceed 100 characters"),

		businessRegistrationNo: z
			.string({ message: "Business registration number is required" })
			.min(2, "Business registration number is required"),

		// Optional Fields
		designation: z
			.string()
			.min(2, "Designation must be at least 2 characters")
			.optional()
			.or(z.literal("")),

		companyWebsite: z
			.string()
			.url("Invalid website URL format")
			.optional()
			.or(z.literal("")),

		companySize: z.string().optional().or(z.literal("")),

		location: z.string().optional().or(z.literal("")),
	}),
});

export const recruiterApplicationValidation = {
	createApplicationSchema,
};
