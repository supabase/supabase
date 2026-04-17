import { readFileSync, writeFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type ContentItem = { kind: string; text: string };
type BlockTag = { tag: string; name?: string; content?: ContentItem[] };

function contentToMd(items: ContentItem[] = []): string {
  return items.map((c) => c.text).join("").trim();
}

function extractFence(text: string): string {
  const m = text.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return m ? m[1].trim() : text.trim();
}

// node kinds from typedoc
const KIND_INTERFACE = 256;
const KIND_CLASS = 128;
const KIND_TYPE_ALIAS = 2097152;

/** Walk the full tree and index every node by its numeric id. */
function buildTargetMap(root: any, map: Map<number, any> = new Map()): Map<number, any> {
  if (root?.id) map.set(root.id, root);
  for (const child of root?.children ?? []) buildTargetMap(child, map);
  return map;
}

function serializeType(
  t: any,
  targetMap: Map<number, any>,
  seen = new Set<number>(),
  typeParamMap = new Map<number, any>()
): any {
  if (!t) return null;
  const st = (x: any) => serializeType(x, targetMap, seen, typeParamMap);
  switch (t.type) {
    case "intrinsic": return t.name;
    case "literal": return { kind: "literal", value: t.value };
    case "union": return { kind: "union", types: t.types.map(st) };
    case "intersection": return { kind: "intersection", types: t.types.map(st) };
    case "array": return { kind: "array", elementType: st(t.elementType) };
    case "tuple": return { kind: "tuple", elements: (t.elements ?? []).map(st) };
    case "reference": {
      // Substitute generic type parameters with their concrete arguments
      if (t.refersToTypeParameter && typeof t.target === "number" && typeParamMap.has(t.target)) {
        return serializeType(typeParamMap.get(t.target), targetMap, seen, typeParamMap);
      }
      const targetId: number | undefined = t.target ?? t.id;
      if (targetId && !seen.has(targetId)) {
        const node = targetMap.get(targetId);
        if (node) {
          const nextSeen = new Set(seen).add(targetId);
          // Interface or class: inline as object with named properties
          if (node.kind === KIND_INTERFACE || node.kind === KIND_CLASS) {
            const serialize = (x: any) => serializeType(x, targetMap, nextSeen, typeParamMap);
            return {
              kind: "object",
              name: node.name,
              properties: (node.children ?? []).map((child: any) => ({
                name: child.name,
                optional: child.flags?.isOptional ?? false,
                description: child.comment?.summary?.length
                  ? contentToMd(child.comment.summary)
                  : undefined,
                type: serialize(child.type),
              })),
            };
          }
          // Type alias: build a child typeParamMap by mapping the alias's type parameters
          // to the concrete arguments supplied at the call site, then inline.
          if (node.kind === KIND_TYPE_ALIAS && node.type) {
            let childMap = typeParamMap;
            if (t.typeArguments?.length && node.typeParameters?.length) {
              childMap = new Map(typeParamMap);
              for (let i = 0; i < node.typeParameters.length; i++) {
                childMap.set(node.typeParameters[i].id, t.typeArguments[i]);
              }
            }
            return serializeType(node.type, targetMap, nextSeen, childMap);
          }
        }
      }
      // Fallback: store as named reference
      const r: any = { kind: "reference", name: t.name };
      if (t.typeArguments?.length) r.typeArguments = t.typeArguments.map(st);
      return r;
    }
    case "reflection": {
      return {
        kind: "object",
        properties: (t.declaration?.children ?? []).map((child: any) => ({
          name: child.name,
          optional: child.flags?.isOptional ?? false,
          type: st(child.type),
        })),
      };
    }
    case "templateLiteral": return { kind: "templateLiteral" };
    case "indexedAccess": return { kind: "indexedAccess", objectType: st(t.objectType), indexType: st(t.indexIndex) };
    default: return { kind: t.type ?? "unknown" };
  }
}

function serializeParam(p: any, targetMap: Map<number, any>): any {
  const out: any = { name: p.name };
  if (p.flags?.isOptional) out.optional = true;
  if (p.comment?.summary?.length) out.description = contentToMd(p.comment.summary);
  out.type = serializeType(p.type, targetMap);
  return out;
}

function parseExamples(blockTags: BlockTag[]): any[] {
  const examples = blockTags.filter((t) => t.tag === "@example");
  const sqls = blockTags.filter((t) => t.tag === "@exampleSql");
  const responses = blockTags.filter((t) => t.tag === "@exampleResponse");
  const descs = blockTags.filter((t) => t.tag === "@exampleDescription");

  function findByName(tags: BlockTag[], title: string): BlockTag | undefined {
    return tags.find((t) => {
      const first = t.content?.find((c) => c.kind === "text")?.text?.trim();
      return first && (first === title || first.startsWith(title));
    });
  }

  return examples.map((ex, i) => {
    const title = ex.name && ex.name !== "undefined" ? ex.name : `Example ${i + 1}`;
    const codeBlock = ex.content?.find((c) => c.kind === "code");
    const code = codeBlock ? extractFence(codeBlock.text) : "";

    const sqlTag = findByName(sqls, title) ?? sqls[i];
    const responseTag = findByName(responses, title) ?? responses[i];
    const descTag = findByName(descs, title) ?? descs[i];

    const sqlBlock = sqlTag?.content?.find((c) => c.kind === "code");
    const responseBlock = responseTag?.content?.find((c) => c.kind === "code");
    const notes = descTag?.content
      ?.filter((c) => c.kind === "text" && c.text.trim() && !c.text.trim().startsWith(title))
      .map((c) => c.text)
      .join("")
      .trim();

    const result: any = { title, code };
    if (sqlBlock) result.sql = extractFence(sqlBlock.text);
    if (responseBlock) result.response = extractFence(responseBlock.text);
    if (notes) result.notes = notes;
    return result;
  });
}

// Collect all variant:declaration nodes that have signatures AND a comment (on the
// declaration itself or on the first signature — storage methods store tags on sigs).
function collectDeclarations(node: any): any[] {
  const out: any[] = [];
  if (node.variant === "declaration" && node.signatures?.length) {
    const comment = node.comment ?? node.signatures[0]?.comment;
    if (comment) {
      // Normalise: always expose comment at declaration level
      out.push({ ...node, comment });
    }
  }
  for (const child of node.children ?? []) out.push(...collectDeclarations(child));
  return out;
}

const SOURCE_FILES = [
  "functions.json",
  "gotrue.json",
  "postgrest.json",
  "realtime.json",
  "storage.json",
  "supabase.json",
];

export function processSpec() {
  const specDir = join(__dirname, "../spec/enrichments/tsdoc_v2");
  const roots = SOURCE_FILES.map((f) =>
    JSON.parse(readFileSync(join(specDir, f), "utf-8"))
  );

  // Build a per-file targetMap so IDs from different packages don't collide
  const fileMaps = roots.map((root) => buildTargetMap(root));

  // Pair every declaration with the targetMap of the file it came from
  const declarations = roots.flatMap((root, i) =>
    collectDeclarations(root).map((decl) => ({ decl, targetMap: fileMaps[i] }))
  );
  const categoryMap = new Map<string, any[]>();

  for (const { decl, targetMap } of declarations) {
    const blockTags: BlockTag[] = decl.comment?.blockTags ?? [];
    const categoryTag = blockTags.find((t) => t.tag === "@category");
    if (!categoryTag) continue; // skip internal declarations with no category
    const category = (categoryTag.content?.[0]?.text ?? "").split("\n")[0].trim();

    if (!categoryMap.has(category)) categoryMap.set(category, []);

    const sig = decl.signatures[0];
    const remarkTags = blockTags.filter((t) => t.tag === "@remarks");
    const examples = parseExamples(blockTags);

    const definition: any = {
      name: decl.name,
      description: contentToMd(decl.comment?.summary ?? []),
      ...(remarkTags.length ? { remarks: remarkTags.map((t) => contentToMd(t.content ?? [])) } : {}),
      parameters: (sig.parameters ?? []).map((p: any) => serializeParam(p, targetMap)),
      returnType: serializeType(sig.type, targetMap),
      ...(examples.length ? { examples } : {}),
    };

    categoryMap.get(category)!.push(definition);
  }

  const result = Array.from(categoryMap.entries()).map(([category, definitions]) => ({
    category,
    definitions,
  }));

  console.log(result)

  return result
}

// Only write to disk when run directly
const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const output = processSpec();
  writeFileSync(
    join(__dirname, "../spec/enrichments/tsdoc_v2/processed.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(`Done: ${output.length} categories, ${output.flatMap((c) => c.definitions).length} declarations`);
}
