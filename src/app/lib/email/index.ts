import ejs from "ejs";
import path from "path";
import config from "../../config";
import { sendWithNodemailer } from "./nodemailer.driver";
import { sendWithResend } from "./resend.driver";

export const sendEmailWithTemplate = async (
	to: string,
	subject: string,
	templateName: string,
	data: Record<string, any>,
): Promise<void> => {
	const templatePath = path.join(
		process.cwd(),
		`src/app/templates/${templateName}.ejs`,
	);
	const html = await ejs.renderFile(templatePath, data);

	if (config.email.provider === "resend") {
		await sendWithResend(to, subject, html);
	} else {
		await sendWithNodemailer(to, subject, html);
	}
};
