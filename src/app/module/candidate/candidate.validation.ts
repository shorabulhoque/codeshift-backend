import { z } from "zod";

const updateProfileSchema = z.object({
	body: z.object({
		fullName: z
			.string()
			.trim()
			.min(2, "Full name must be at least 2 characters")
			.optional(),
		phone: z.string().trim().optional().or(z.literal("")),
		headline: z
			.string()
			.trim()
			.max(100, "Headline cannot exceed 100 characters")
			.optional()
			.or(z.literal("")),
		bio: z
			.string()
			.trim()
			.max(500, "Bio cannot exceed 500 characters")
			.optional()
			.or(z.literal("")),
		experienceYears: z
			.number({ message: "Experience years must be a number" })
			.min(0, "Experience years cannot be negative")
			.optional(),
		address: z.string().trim().optional().or(z.literal("")),
		githubUrl: z
			.string()
			.url("Invalid GitHub URL format")
			.optional()
			.or(z.literal("")),
		linkedinUrl: z
			.string()
			.url("Invalid LinkedIn URL format")
			.optional()
			.or(z.literal("")),
		skills: z.array(z.string()).optional(),
	}),
});

export const candidateValidation = {
	updateProfileSchema,
};
