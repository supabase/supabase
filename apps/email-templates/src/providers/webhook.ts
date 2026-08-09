import { EmailTemplateError } from "../errors.ts";
import type { SendResult } from "../types.ts";

export interface WebhookPayload {
  url: string;
  secret: string;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  templateId: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export async function sendViaWebhook(payload: WebhookPayload): Promise<SendResult> {
  const response = await fetch(payload.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${payload.secret}`,
      ...(payload.idempotencyKey ? { "idempotency-key": payload.idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  });
  const rawText = await response.text();
  let body: unknown;
  try { body = JSON.parse(rawText); } catch { body = rawText; }
  if (!response.ok) {
    throw new EmailTemplateError("فشل Webhook البريد", "EMAIL_PROVIDER_ERROR", {
      provider: "webhook", status: response.status, body,
    });
  }
  const id = typeof body === "object" && body !== null && "id" in body ? String((body as { id: unknown }).id) : crypto.randomUUID();
  return { provider: "webhook", id, raw: body };
}
