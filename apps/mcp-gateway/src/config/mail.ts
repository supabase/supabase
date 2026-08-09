import nodemailer from "npm:nodemailer";
import { config } from "https://deno.land/x/dotenv/mod.ts";

// Try to load .env variables if not already in environment
try {
  config({ export: true, path: "../../.env" });
} catch (e) {
  // Ignore if running where env vars are already injected
}

const host = Deno.env.get("SMTP_HOST") || "smtp.migadu.com";
const port = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
const secure = Deno.env.get("SMTP_SECURE") === "true";

export type MailboxType = "notifications" | "noreply" | "maintenance" | "agent" | "uberfix";

const getCredentials = (mailbox: MailboxType) => {
  const prefix = `MAIL_${mailbox.toUpperCase()}`;
  return {
    user: Deno.env.get(`${prefix}_USER`),
    pass: Deno.env.get(`${prefix}_PASS`),
  };
};

export const getTransport = (mailbox: MailboxType = "notifications") => {
  const auth = getCredentials(mailbox);
  
  if (!auth.user || !auth.pass) {
    throw new Error(`Credentials for mailbox ${mailbox} are missing in environment variables.`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });
};
