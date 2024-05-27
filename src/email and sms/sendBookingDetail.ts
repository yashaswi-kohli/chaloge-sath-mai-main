import { Resend } from "resend";
import { ApiResponse } from "../utils/ApiResponse";

process.loadEnvFile();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingDetail(
  email: string,
  firstName: string,
  from: string,
  to: string,
  noOfSeat: string,
  date: string,
): Promise<ApiResponse> {
  try {
    const message : string = `Hello ${firstName}, there has been a booking for your trip from ${from} to ${to} with ${noOfSeat} seats on ${date}.`;

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'There has been a booking for your trip',
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