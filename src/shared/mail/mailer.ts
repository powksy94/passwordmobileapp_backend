import { RESEND_API_KEY, MAIL_FROM } from "../config/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set: emails cannot be sent");
  }
}

// Sends one transactional email through the Resend HTTP API (plain fetch:
// no SDK dependency for a single endpoint).
export const sendMail = async (message: MailMessage): Promise<void> => {
  if (!RESEND_API_KEY) throw new MailNotConfiguredError();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: MAIL_FROM, ...message }),
  });

  if (!res.ok) {
    // Resend's error body never contains the message content.
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
};
