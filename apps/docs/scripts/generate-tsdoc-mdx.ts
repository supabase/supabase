import { mkdirSync, writeFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { processSpec } from "./process-tsdoc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function escapeMdxProse(text: string): string {
  // Escape { and } outside code blocks/spans so MDX doesn't treat them as JSX.
  // Match fenced code blocks first (```...```), then inline code (`...`), leave both untouched.
  return text.replace(/(```[\s\S]*?```|`[^`]+`)|([{}])/g, (_, code, brace) =>
    code ? code : brace === "{" ? "\\{" : "\\}"
  );
}

function prop(value: unknown): string {
  return `{${JSON.stringify(value)}}`;
}

function generateMdx(categories: ReturnType<typeof processSpec>): string {
  const lines: string[] = [
    "---",
    "title: JavaScript Client library",
    "---",
    "",
    "",
  ];

  for (let i = 0; i < categories.length; i++) {
    const { category, definitions } = categories[i];

    if (i > 0) {
      lines.push("", "<hr />", "");
    }

    lines.push(`## ${category}`, "");

    for (const def of definitions) {
      lines.push(`### ${def.name}`, "");

      if (def.description) {
        lines.push(escapeMdxProse(def.description), "");
      }

      if (def.remarks?.length) {
        for (const remark of def.remarks) {
          lines.push(escapeMdxProse(remark), "");
        }
      }
      
      // if (def.parameters?.length) {
        //   lines.push(`<RefDefinitionParams parameters=${prop(def.parameters)} />`, "");
        // }
        
        if (def.returnType) {
          lines.push(`<RefDefinitionReturnType returnType=${prop(def.returnType)} />`, "");
        }
  
        // if (def.examples?.length) {
        //   lines.push(`<RefDefinitionExamples examples=${prop(def.examples)} />`, "");
        // }
    }
  }

  return lines.join("\n");
}

const processed = processSpec();
const mdx = generateMdx(processed);

const outPath = join(__dirname, "../content/reference/javascript.mdx");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, mdx);
console.log(`MDX written to ${outPath}`);
console.log(`${processed.length} categories, ${processed.flatMap((c) => c.definitions).length} definitions`);
