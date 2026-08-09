export type TemplateTone = "info" | "success" | "warning" | "error";

export interface TemplateDetail {
  label: string;
  value: string | number;
}

export interface EmailTemplateData {
  recipient_name: string;
  reference?: string;
  message?: string;
  status_label?: string;
  status_tone?: TemplateTone;
  details?: TemplateDetail[];
  action_url?: string;
  action_label?: string;
  secondary_action_url?: string;
  secondary_action_label?: string;
  alert_title?: string;
  alert_message?: string;
  alert_tone?: TemplateTone;
  logo_url?: string;
  support_email?: string;
  website_url?: string;
  preferences_url?: string;
  footer_note?: string;
  [key: string]: unknown;
}

export interface TemplateMetadata {
  id: string;
  system: string;
  agent: string;
  systemName: string;
  event: string;
  locale: "ar";
  version: number;
  name: string;
  subject: string;
  preheader: string;
  senderEnv: string;
  defaultFrom: string;
  defaultBrandName: string;
  defaultMessage: string;
  defaultStatusLabel: string;
  defaultStatusTone: TemplateTone;
  defaultActionLabel: string;
  required: string[];
  optional: string[];
  html: string;
  text: string;
}

export interface RenderOptions {
  brandName?: string;
  companyName?: string;
  logoUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
  currentYear?: number;
  allowHttpLocalhost?: boolean;
}

export interface RenderedEmail {
  templateId: string;
  subject: string;
  html: string;
  text: string;
  metadata: Omit<TemplateMetadata, "html" | "text">;
}

export interface SendTemplateInput {
  templateId: string;
  to: string | string[];
  data: EmailTemplateData;
  from?: string;
  replyTo?: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export interface SendResult {
  provider: string;
  id: string;
  raw?: unknown;
}
