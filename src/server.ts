import app from "./app/app";
import config from "./app/config/index";
import { prisma } from "./app/lib/prisma";
import redisClient from "./app/lib/redis";
import { initUnverifiedUserCleanupCron } from "./app/utils/cron";

async function main(): Promise<void> {
	try {
		await prisma.$connect();
		console.log("Cloud PostgreSQL database cluster connected successfully");

		if (!redisClient.isOpen) {
			await redisClient.connect();
		}
		console.log("Redis cache server connected successfully");

		initUnverifiedUserCleanupCron();

		app.listen(config.port, () => {
			console.log(`Server is running securely on port ${config.port}`);
		});
	} catch (error) {
		console.error(
			"Critical failure during backend server initialization:",
			error,
		);

		await prisma.$disconnect();
		if (redisClient.isOpen) {
			await redisClient.disconnect();
		}
		process.exit(1);
	}
}

main();
