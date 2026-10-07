import nodemailer from "nodemailer";
import config from "../../config";

const transporter = nodemailer.createTransport({
	host: config.email.smtp.host,
	port: Number(config.email.smtp.port),
	secure: false,
	auth: {
		user: config.email.smtp.user,
		pass: config.email.smtp.pass,
	},
});

if (config.isDevelopment) {
	transporter.verify((error) => {
		if (error) {
			console.error("Nodemailer Connection Error:", error.message);
		} else {
			console.log("Nodemailer Transporter Ready!");
		}
	});
}

export const sendWithNodemailer = async (
	to: string,
	subject: string,
	html: string,
) => {
	const info = await transporter.sendMail({
		from: config.email.sender,
		to,
		subject,
		html,
	});
	if (config.isDevelopment) {
		console.log("Message sent ID: %s", info.messageId);
	}
};
