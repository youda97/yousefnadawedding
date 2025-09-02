import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendOtp(toE164: string, code: string) {
  const body = `Your RSVP code is ${code}. It expires in 10 minutes.`;

  return client.messages.create({
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
    to: toE164.startsWith("+1")
      ? toE164                  // SMS numbers (US/CA)
      : `whatsapp:${toE164}`,   // Non-US/CA → force WhatsApp channel
    body,
  });
}
