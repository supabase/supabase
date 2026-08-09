const root = new URL("../", import.meta.url);
const catalogPath = new URL("catalog.json", root);
const entries = JSON.parse(await Deno.readTextFile(catalogPath)) as Array<Record<string, unknown>>;
const output: string[] = [
  "/* AUTO-GENERATED FILE. Run `deno task build` after editing source templates. */",
  'import type { TemplateMetadata } from "./types.ts";',
  "",
  "export const TEMPLATE_CATALOG: readonly TemplateMetadata[] = [",
];
for (const entry of entries) {
  const system = String(entry.system);
  const event = String(entry.event);
  const html = await Deno.readTextFile(new URL(`templates/${system}/${event}.html`, root));
  const text = await Deno.readTextFile(new URL(`templates/${system}/${event}.txt`, root));
  output.push(`  ${JSON.stringify({ ...entry, html, text })},`);
}
output.push(
  "] as const;",
  "",
  "export const TEMPLATE_IDS = TEMPLATE_CATALOG.map((template) => template.id);",
  "export const TEMPLATE_BY_ID = new Map(TEMPLATE_CATALOG.map((template) => [template.id, template]));",
  "",
);
await Deno.writeTextFile(new URL("src/catalog.generated.ts", root), output.join("\n"));
console.log(`Generated ${entries.length} templates.`);
