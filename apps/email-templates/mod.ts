export { TEMPLATE_BY_ID, TEMPLATE_CATALOG, TEMPLATE_IDS } from "./src/catalog.generated.ts";
export { renderEmailTemplate } from "./src/render.ts";
export { sendTemplateEmail } from "./src/send.ts";
export { EmailTemplateError } from "./src/errors.ts";
export type {
  EmailTemplateData,
  RenderedEmail,
  RenderOptions,
  SendResult,
  SendTemplateInput,
  TemplateDetail,
  TemplateMetadata,
  TemplateTone,
} from "./src/types.ts";
