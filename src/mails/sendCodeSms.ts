// import twilio from "twilio";
// import { ApiResponse } from "../utils/ApiResponse";

// process.loadEnvFile();
// const account = process.env.TWILIO_ACCOUNT;
// const token = process.env.TWILIO_AUTH_TOKEN;

// const client = twilio(account, token);

// export async function sendSMS(
//   number: string,
//   firstName: string,
//   verifyCode: string
// ): Promise<ApiResponse> {
//   try {
//     const message : string = `Hello ${firstName}, here is your verification code for number verification : ${verifyCode}`;

//     const data = await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: number
//     });

//     console.log(data);
//     return new ApiResponse(200, 'Number sent successfully');
//   } 
//   catch (error) {
//     console.error(error);
//     return new ApiResponse(500, 'Internal server error');
//   }
// };