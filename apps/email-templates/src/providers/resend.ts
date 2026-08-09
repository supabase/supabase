import { EmailTemplateError } from "../errors.ts";
import type { SendResult } from "../types.ts";

export interface ResendPayload {
  apiKey: string;
  apiUrl?: string;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export async function sendViaResend(payload: ResendPayload): Promise<SendResult> {
  const response = await fetch(payload.apiUrl ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${payload.apiKey}`,
      ...(payload.idempotencyKey ? { "idempotency-key": payload.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      reply_to: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags ? Object.entries(payload.tags).map(([name, value]) => ({ name, value })) : undefined,
    }),
  });

  const rawText = await response.text();
  let body: unknown;
  try { body = JSON.parse(rawText); } catch { body = rawText; }

  if (!response.ok) {
    throw new EmailTemplateError("فشل مزود البريد في إرسال الرسالة", "EMAIL_PROVIDER_ERROR", {
      provider: "resend", status: response.status, body,
    });
  }

  const id = typeof body === "object" && body !== null && "id" in body ? String((body as { id: unknown }).id) : crypto.randomUUID();
  return { provider: "resend", id, raw: body };
}
