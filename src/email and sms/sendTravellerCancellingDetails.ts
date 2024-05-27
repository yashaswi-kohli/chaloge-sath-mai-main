import { Resend } from "resend";
import { ApiResponse } from "../utils/ApiResponse";

process.loadEnvFile();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTravellerCancelDetail(
  email: string,
  firstName: string,
  from: string,
  to: string,
  date: string,
  purpose: string
): Promise<ApiResponse> {
  try {
    const message : string = `Hello ${firstName}, your trip from ${from} to ${to} on ${date} has been cancelled. We are sorry for the inconvenience, the reason was the ${purpose}.`;

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Trip cancelled',
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