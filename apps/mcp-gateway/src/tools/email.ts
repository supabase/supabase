import { getTransport, MailboxType } from "../config/mail.ts";
import Mustache from "npm:mustache";

// Load catalog
const catalogPath = new URL("../../../email-templates/catalog.json", import.meta.url).pathname;
let catalog: any[] = [];
try {
  const catalogContent = await Deno.readTextFile(catalogPath);
  catalog = JSON.parse(catalogContent);
} catch (e) {
  console.error("Failed to load catalog.json:", e);
}

export const listTemplates = () => {
  return catalog.map((t) => ({
    id: t.id,
    name: t.name,
    system: t.systemName,
    subject: t.subject,
  }));
};

export const getTemplateSchema = (templateId: string) => {
  const template = catalog.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return {
    required: template.required || [],
    optional: template.optional || [],
    defaults: {
      subject: template.subject,
      preheader: template.preheader,
      defaultMessage: template.defaultMessage,
    },
  };
};

export const renderAndSendEmail = async (
  templateId: string,
  payload: any,
  to: string,
  mailbox: MailboxType = "notifications"
) => {
  const templateMeta = catalog.find((t) => t.id === templateId);
  if (!templateMeta) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 1. Check required parameters
  for (const req of templateMeta.required || []) {
    if (payload[req] === undefined) {
      throw new Error(`Missing required parameter: ${req}`);
    }
  }

  // 2. Read template HTML file
  const parts = templateId.split('.');
  const system = parts[1]; // e.g. auth
  const event = parts[2];  // e.g. account_created
  const templateHtmlPath = new URL(`../../../email-templates/templates/${system}/${event}.html`, import.meta.url).pathname;
  
  let htmlTemplate = "";
  try {
    htmlTemplate = await Deno.readTextFile(templateHtmlPath);
  } catch (e) {
    throw new Error(`Failed to read HTML template file at ${templateHtmlPath}`);
  }

  // 3. Render Subject and HTML with Mustache
  const subject = Mustache.render(templateMeta.subject, payload);
  const html = Mustache.render(htmlTemplate, {
    ...payload,
    // Add default values if not provided
    logo_url: payload.logo_url || "https://example.com/logo.png",
    brand_name: payload.brand_name || "Al-Azab",
    company_name: payload.company_name || "Al-Azab Construction Company",
    current_year: new Date().getFullYear(),
    email_title: payload.email_title || templateMeta.name,
    message: payload.message || templateMeta.defaultMessage,
  });

  // 4. Send Email via SMTP
  const transport = getTransport(mailbox);
  const senderEmail = Deno.env.get(`MAIL_${mailbox.toUpperCase()}_USER`);

  const info = await transport.sendMail({
    from: `"Al-Azab ${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}" <${senderEmail}>`,
    to,
    subject,
    html,
  });

  return {
    success: true,
    messageId: info.messageId,
    subject,
  };
};
