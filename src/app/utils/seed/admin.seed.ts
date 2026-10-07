import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import {
	AuthProvider,
	UserRole,
	UserStatus,
} from "../../../../generated/prisma/enums";

export const seedAdmin = async () => {
	const email = config.tester_data.admin.email;
	const password = config.tester_data.admin.password;

	if (!email || !password) {
		throw new Error("Admin credentials are not configured.");
	}

	const normalizedEmail = email.trim().toLowerCase();

	const existingAdmin = await prisma.user.findUnique({
		where: {
			email: normalizedEmail,
		},
	});

	if (existingAdmin) {
		if (!existingAdmin.roles.includes(UserRole.ADMIN)) {
			throw new Error(
				`User ${normalizedEmail} already exists but is not an admin.`,
			);
		}

		console.log("Admin already exists.");
		return;
	}

	const hashedPassword = await bcrypt.hash(password, config.bcrypt_salt_rounds);

	await prisma.$transaction(async (tx) => {
		const admin = await tx.user.create({
			data: {
				email: normalizedEmail,
				password: hashedPassword,

				roles: [UserRole.ADMIN],
				activeRole: UserRole.ADMIN,

				status: UserStatus.ACTIVE,
				isEmailVerified: true,
			},
		});

		await tx.account.create({
			data: {
				userId: admin.id,
				provider: AuthProvider.CREDENTIALS,
				providerId: admin.id,
			},
		});
	});

	console.log(`Admin created successfully: ${normalizedEmail}`);
};

async function main() {
	await prisma.$connect();

	try {
		await seedAdmin();
	} catch (error) {
		console.error("Failed to seed admin:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
