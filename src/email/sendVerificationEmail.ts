import { Resend } from "resend";

process.loadEnvFile();
const sender  = process.env.SENDER || "";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
    email: string,
    firstName: string,
    verifyCode: string
  ): Promise<boolean> {
    try {
        resend.emails.send({
          from: sender,
          to: email,
          subject: "Email Verification",
          html: `<h1>Hi ${firstName}, </h1><p>Here is your email verification code: /${verifyCode}"</p>`,
        });
      return true;
    } 
    catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
}