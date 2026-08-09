import { TEMPLATE_BY_ID } from "./catalog.generated.ts";
import { EmailTemplateError } from "./errors.ts";
import { validateTemplateData } from "./security.ts";
import type { EmailTemplateData, RenderedEmail, RenderOptions, TemplateTone } from "./types.ts";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

const DEFAULT_LOGO_URL = "https://alazab.com/w.gif";

const TONE_COLORS: Record<TemplateTone, { background: string; border: string; color: string }> = {
  info: { background: "#eaf2ff", border: "#b8cdf5", color: "#164a8a" },
  success: { background: "#eaf8ef", border: "#b9e2c6", color: "#17653a" },
  warning: { background: "#fff7df", border: "#f0d58a", color: "#755300" },
  error: { background: "#fff0f0", border: "#efb9b9", color: "#8a2020" },
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

function getValue(data: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}

function renderSections(template: string, data: Record<string, unknown>, html: boolean): string {
  const sectionPattern = /{{#\s*([\w.]+)\s*}}([\s\S]*?){{\/\s*\1\s*}}/g;
  const invertedPattern = /{{\^\s*([\w.]+)\s*}}([\s\S]*?){{\/\s*\1\s*}}/g;

  let output = template.replace(sectionPattern, (_match, key: string, block: string) => {
    const value = getValue(data, key);
    if (Array.isArray(value)) {
      return value.map((item) => renderTemplateString(block, {
        ...data,
        ...(item && typeof item === "object" ? item as Record<string, unknown> : { ".": item }),
      }, html)).join("");
    }
    if (value && typeof value === "object") {
      return renderTemplateString(block, { ...data, ...(value as Record<string, unknown>) }, html);
    }
    return value ? renderTemplateString(block, data, html) : "";
  });

  output = output.replace(invertedPattern, (_match, key: string, block: string) => {
    const value = getValue(data, key);
    const empty = value === undefined || value === null || value === false || value === "" || (Array.isArray(value) && value.length === 0);
    return empty ? renderTemplateString(block, data, html) : "";
  });

  return output;
}

function renderTemplateString(template: string, data: Record<string, unknown>, html: boolean): string {
  let output = template;
  let previous = "";
  let iterations = 0;
  while (output !== previous && iterations < 10) {
    previous = output;
    output = renderSections(output, data, html);
    iterations += 1;
  }
  output = output.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = getValue(data, key);
    return html ? escapeHtml(value) : String(value ?? "");
  });
  return output;
}

function colors(tone: TemplateTone) {
  return TONE_COLORS[tone] ?? TONE_COLORS.info;
}

export function renderEmailTemplate(
  templateId: string,
  inputData: EmailTemplateData,
  options: RenderOptions = {},
): RenderedEmail {
  const template = TEMPLATE_BY_ID.get(templateId);
  if (!template) {
    throw new EmailTemplateError("معرّف قالب البريد غير موجود", "TEMPLATE_NOT_FOUND", { templateId });
  }

  const data = validateTemplateData(inputData, options.allowHttpLocalhost ?? false);
  const statusTone = data.status_tone ?? template.defaultStatusTone;
  const alertTone = data.alert_tone ?? "warning";
  const status = colors(statusTone);
  const alert = colors(alertTone);

  const merged: Record<string, unknown> = {
    ...data,
    brand_name: options.brandName ?? template.defaultBrandName,
    company_name: options.companyName ?? "شركة العزب",
    logo_url: data.logo_url ?? options.logoUrl ?? DEFAULT_LOGO_URL,
    support_email: data.support_email ?? options.supportEmail,
    website_url: data.website_url ?? options.websiteUrl,
    current_year: options.currentYear ?? new Date().getUTCFullYear(),
    system_name: template.systemName,
    template_reference: template.id,
    email_title: template.name,
    preheader: template.preheader,
    message: data.message ?? template.defaultMessage,
    status_label: data.status_label ?? template.defaultStatusLabel,
    action_label: data.action_label ?? template.defaultActionLabel,
    secondary_action_label: data.secondary_action_label ?? "فتح الرابط البديل",
    footer_note: data.footer_note ?? "هذه رسالة تشغيلية آلية. لا تشارك الروابط أو رموز التحقق الواردة بها مع أي طرف غير مخوّل.",
    status_background: status.background,
    status_border: status.border,
    status_color: status.color,
    alert_background: alert.background,
    alert_border: alert.border,
    alert_color: alert.color,
  };

  const subject = renderTemplateString(template.subject, merged, false).replace(/[\r\n]+/g, " ").trim();
  const html = renderTemplateString(template.html, merged, true);
  const text = renderTemplateString(template.text, merged, false).replace(/\n{3,}/g, "\n\n").trim() + "\n";
  const { html: _html, text: _text, ...metadata } = template;

  return { templateId, subject, html, text, metadata };
}
