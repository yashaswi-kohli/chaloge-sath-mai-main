import { Resend } from "resend";
import { ApiResponse } from "../utils/ApiResponse";

process.loadEnvFile();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  email: string,
  firstName: string,
  verifyCode: string,
  purpose: string
): Promise<ApiResponse> {
  try {
    const message : string = `Hello ${firstName}, here is your verification code for ${purpose} : ${verifyCode}`;

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Hello here is code for you, ',
      html: message
    });

    console.log(data);
    return new ApiResponse(200, 'Email sent successfully');
  } 
  catch (error) {
    console.error(error);
    return new ApiResponse(500, 'Internal server error');
  }
};