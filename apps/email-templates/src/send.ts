import { TEMPLATE_BY_ID } from "./catalog.generated.ts";
import { EmailTemplateError } from "./errors.ts";
import { renderEmailTemplate } from "./render.ts";
import { cleanHeaderValue, normalizeEmail, validateUrl } from "./security.ts";
import { sendViaResend } from "./providers/resend.ts";
import { sendViaWebhook } from "./providers/webhook.ts";
import type { RenderOptions, SendResult, SendTemplateInput } from "./types.ts";

export type EnvReader = (name: string) => string | undefined;

function requiredEnv(env: EnvReader, name: string): string {
  const value = env(name)?.trim();
  if (!value) throw new EmailTemplateError(`متغير البيئة ${name} غير مضبوط`, "MISSING_ENV", { name });
  return value;
}

export async function sendTemplateEmail(
  input: SendTemplateInput,
  env: EnvReader,
  renderOptions: RenderOptions = {},
): Promise<SendResult> {
  const template = TEMPLATE_BY_ID.get(input.templateId);
  if (!template) throw new EmailTemplateError("معرّف القالب غير موجود", "TEMPLATE_NOT_FOUND", { templateId: input.templateId });

  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).map(normalizeEmail);
  if (recipients.length < 1 || recipients.length > 50) {
    throw new EmailTemplateError("عدد المستلمين يجب أن يكون بين 1 و50", "INVALID_RECIPIENT_COUNT");
  }

  const rendered = renderEmailTemplate(input.templateId, input.data, renderOptions);
  const from = cleanHeaderValue(input.from ?? env(template.senderEnv) ?? template.defaultFrom, "from");
  const replyTo = input.replyTo ? normalizeEmail(input.replyTo) : undefined;
  const provider = (env("EMAIL_PROVIDER") ?? "resend").trim().toLowerCase();

  if (provider === "resend") {
    return await sendViaResend({
      apiKey: requiredEnv(env, "RESEND_API_KEY"),
      apiUrl: env("RESEND_API_URL"),
      from,
      to: recipients,
      replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: input.idempotencyKey,
      tags: { template: input.templateId, ...(input.tags ?? {}) },
    });
  }

  if (provider === "webhook") {
    return await sendViaWebhook({
      url: validateUrl(requiredEnv(env, "EMAIL_WEBHOOK_URL"), "EMAIL_WEBHOOK_URL"),
      secret: requiredEnv(env, "EMAIL_WEBHOOK_SECRET"),
      from,
      to: recipients,
      replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateId: input.templateId,
      idempotencyKey: input.idempotencyKey,
      tags: input.tags,
    });
  }

  throw new EmailTemplateError("مزود البريد غير مدعوم", "UNSUPPORTED_PROVIDER", { provider });
}
