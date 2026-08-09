import { TEMPLATE_CATALOG } from "../src/catalog.generated.ts";
import { renderEmailTemplate } from "../src/render.ts";

if (TEMPLATE_CATALOG.length !== 144) throw new Error(`Expected 144 templates, found ${TEMPLATE_CATALOG.length}`);
const ids = new Set<string>();
for (const template of TEMPLATE_CATALOG) {
  if (ids.has(template.id)) throw new Error(`Duplicate template id: ${template.id}`);
  ids.add(template.id);
  const rendered = renderEmailTemplate(template.id, {
    recipient_name: "محمد عزب",
    reference: "TEST-001",
    details: [{ label: "الحالة", value: "اختبار" }],
    action_url: "https://al-azab.co/test",
  });
  for (const [kind, value] of [["subject", rendered.subject], ["html", rendered.html], ["text", rendered.text]] as const) {
    if (/{{[#\^\/]?\s*[\w.]+\s*}}/.test(value)) throw new Error(`Unresolved token in ${template.id} ${kind}`);
  }
  if (!rendered.html.includes("محمد عزب")) throw new Error(`Recipient missing in ${template.id}`);
}
console.log(`Validated ${TEMPLATE_CATALOG.length} templates.`);
