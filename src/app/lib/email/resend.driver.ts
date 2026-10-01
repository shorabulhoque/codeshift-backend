import { Resend } from "resend";
import config from "../../config";

const resend = new Resend(config.email.resend_api_key);

export const sendWithResend = async (to: string, subject: string, html: string) => {
    const { error } = await resend.emails.send({
        from: config.email.sender,
        to: [to],
        subject,
        html,
    });

    if (error) {
        throw new Error(`Resend Error: ${error.message}`);
    };
};