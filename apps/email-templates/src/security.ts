import { EmailTemplateError } from "./errors.ts";
import type { EmailTemplateData, TemplateDetail, TemplateTone } from "./types.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const URL_FIELDS = ["action_url", "secondary_action_url", "logo_url", "website_url", "preferences_url"] as const;
const VALID_TONES = new Set<TemplateTone>(["info", "success", "warning", "error"]);

export function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 320 || !EMAIL_PATTERN.test(normalized)) {
    throw new EmailTemplateError("عنوان البريد الإلكتروني غير صالح", "INVALID_EMAIL", { value });
  }
  return normalized;
}

export function cleanHeaderValue(value: string, field: string): string {
  const cleaned = value.replace(CONTROL_CHARS, " ").trim();
  if (!cleaned) {
    throw new EmailTemplateError(`قيمة ${field} فارغة`, "INVALID_HEADER", { field });
  }
  return cleaned;
}

export function validateUrl(value: string, field: string, allowHttpLocalhost = false): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new EmailTemplateError(`الرابط ${field} غير صالح`, "INVALID_URL", { field, value });
  }
  const localhostAllowed = allowHttpLocalhost && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localhostAllowed) {
    throw new EmailTemplateError(`الرابط ${field} يجب أن يستخدم HTTPS`, "INSECURE_URL", { field, value });
  }
  return url.toString();
}

function asBoundedString(value: unknown, field: string, max: number, required = false): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) throw new EmailTemplateError(`الحقل ${field} مطلوب`, "MISSING_FIELD", { field });
    return undefined;
  }
  const text = String(value).trim();
  if (!text || text.length > max) {
    throw new EmailTemplateError(`الحقل ${field} غير صالح أو تجاوز الحد`, "INVALID_FIELD", { field, max });
  }
  return text;
}

export function validateTemplateData(input: EmailTemplateData, allowHttpLocalhost = false): EmailTemplateData {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new EmailTemplateError("بيانات القالب يجب أن تكون كائنًا", "INVALID_DATA");
  }

  const output: EmailTemplateData = { ...input };
  output.recipient_name = asBoundedString(input.recipient_name, "recipient_name", 200, true)!;
  output.reference = asBoundedString(input.reference, "reference", 120);
  output.message = asBoundedString(input.message, "message", 4000);
  output.status_label = asBoundedString(input.status_label, "status_label", 100);
  output.action_label = asBoundedString(input.action_label, "action_label", 100);
  output.secondary_action_label = asBoundedString(input.secondary_action_label, "secondary_action_label", 100);
  output.alert_title = asBoundedString(input.alert_title, "alert_title", 150);
  output.alert_message = asBoundedString(input.alert_message, "alert_message", 1500);
  output.footer_note = asBoundedString(input.footer_note, "footer_note", 1000);
  output.support_email = input.support_email ? normalizeEmail(String(input.support_email)) : undefined;

  if (input.status_tone && !VALID_TONES.has(input.status_tone)) {
    throw new EmailTemplateError("قيمة status_tone غير معتمدة", "INVALID_TONE", { value: input.status_tone });
  }
  if (input.alert_tone && !VALID_TONES.has(input.alert_tone)) {
    throw new EmailTemplateError("قيمة alert_tone غير معتمدة", "INVALID_TONE", { value: input.alert_tone });
  }

  for (const field of URL_FIELDS) {
    const value = input[field];
    if (value) output[field] = validateUrl(String(value), field, allowHttpLocalhost);
  }

  if (input.details !== undefined) {
    if (!Array.isArray(input.details) || input.details.length > 30) {
      throw new EmailTemplateError("details يجب أن تكون مصفوفة بحد أقصى 30 عنصرًا", "INVALID_DETAILS");
    }
    output.details = input.details.map((detail: TemplateDetail, index: number) => ({
      label: asBoundedString(detail?.label, `details[${index}].label`, 120, true)!,
      value: asBoundedString(detail?.value, `details[${index}].value`, 700, true)!,
    }));
  }

  return output;
}
