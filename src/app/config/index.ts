import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	env: process.env.NODE_ENV || "production",
	isProduction: process.env.NODE_ENV === "production",
	isDevelopment: process.env.NODE_ENV === "development",
	port: process.env.PORT!,
	backend_url: process.env.BACKEND_URL,
	frontend_url: process.env.FRONTEND_URL,

	database_url: process.env.DATABASE_URL,

	bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS)!,

	jwt: {
		access_secret: process.env.JWT_ACCESS_SECRET!,
		refresh_secret: process.env.JWT_REFRESH_SECRET!,
		access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
		refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
	},

	google: {
		client_id: process.env.GOOGLE_CLIENT_ID!,
		client_secret: process.env.GOOGLE_CLIENT_SECRET,
	},

	tester_data: {
		admin: {
			name: process.env.TESTER_ADMIN_NAME!,
			email: process.env.TESTER_ADMIN_EMAIL!,
			password: process.env.TESTER_ADMIN_PASSWORD!,
		},
		recruiter: {
			name: process.env.TESTER_RECRUITER_NAME!,
			email: process.env.TESTER_RECRUITER_EMAIL!,
			password: process.env.TESTER_RECRUITER_PASSWORD!,
		},
		candidate: {
			name: process.env.TESTER_CANDIDATE_NAME!,
			email: process.env.TESTER_CANDIDATE_EMAIL!,
			password: process.env.TESTER_CANDIDATE_PASSWORD!,
		},
	},

	redis: {
		user: process.env.REDIS_USER || "default",
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
		password: process.env.REDIS_PASSWORD,
	},

	stripe: {
		api_key: process.env.STRIPE_API_KEY!,
		webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
		success_url: process.env.STRIPE_SUCCESS_URL,
		cancel_url: process.env.STRIPE_CANCEL_URL,
	},

	bkash: {
		base_url: process.env.BKASH_BASE_URL,
		username: process.env.BKASH_USERNAME,
		password: process.env.BKASH_PASSWORD,
		app_key: process.env.BKASH_APP_KEY,
		app_secret: process.env.BKASH_APP_SECRET,
	},

	email: {
		provider: process.env.EMAIL_PROVIDER || "nodemailer",
		sender:
			process.env.EMAIL_SENDER || "CodeShift Support <no-reply@codeshift.com>",
		resend_api_key: process.env.RESEND_API_KEY!,
		smtp: {
			host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
			port: Number(process.env.SMTP_PORT) || 587,
			user: process.env.SMTP_USER!,
			pass: process.env.SMTP_PASSWORD!,
		},
	},

	cloudinary: {
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
		api_key: process.env.CLOUDINARY_API_KEY!,
		api_secret: process.env.CLOUDINARY_API_SECRET!,
	},
};
