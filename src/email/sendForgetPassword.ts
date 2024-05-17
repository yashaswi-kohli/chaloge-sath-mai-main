import { Resend } from "resend";

process.loadEnvFile();
const sender  = process.env.SENDER || "";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendForgetPassword(
    email: string,
    verifyCode: string,
  ): Promise<boolean> {
    try {
        resend.emails.send({
          from: sender,
          to: email,
          subject: "Forgot Password Code",
          html: `<h1>Helo, </h1><p>Here is your forget password code: /${verifyCode}"</p>`,
        });
      return true;
    } 
    catch (error) {
      console.error('Error sending password code:', error);
      return false;
    }
}