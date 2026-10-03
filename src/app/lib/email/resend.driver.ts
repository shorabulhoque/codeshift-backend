import { Resend } from "resend";
import config from "../../config";

let resendInstance: Resend | null = null;

export const sendWithResend = async (to: string, subject: string, html: string) => {
    if (!resendInstance) {
        if (!config.email.resend_api_key) {
            throw new Error("Missing Resend API key in your configuration/environment variables.");
        }
        resendInstance = new Resend(config.email.resend_api_key);
    }

    const { error } = await resendInstance.emails.send({
        from: config.email.sender,
        to: [to],
        subject,
        html,
    });

    if (error) {
        throw new Error(`Resend Error: ${error.message}`);
    }
};
