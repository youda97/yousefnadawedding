import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
export async function sendOtpSms(toE164: string, code: string) {
  await client.messages.create({
    from: process.env.TWILIO_FROM!,
    to: toE164,
    body: `Your RSVP code is ${code}. It expires in 10 minutes.`,
  });
}
