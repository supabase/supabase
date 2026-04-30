/**
 * Language processor for TypeDoc JSON output (TypeScript/JavaScript SDKs).
 *
 * Reads all *.json files (except config.json) from the spec folder, processes
 * TypeDoc declarations, and returns structured categories with definitions.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type {
  IgnoreDefinition,
  OverrideDefinition,
  SpecCategory,
  SpecConfig,
} from '../types.js'

type ContentItem = { kind: string; text: string }
type BlockTag = { tag: string; name?: string; content?: ContentItem[] }

function contentToMd(items: ContentItem[] = []): string {
  const raw = items
    .map((c) => c.text)
    .join('')
    .trim()
  // Normalize line breaks: \n\n (paragraph break) → \n, lone \n → space.
  // TypeDoc summaries often contain single newlines as soft wraps with no
  // semantic meaning, and double newlines as intended paragraph separators.
  // Protect paragraph breaks first so the lone-newline pass doesn't touch them.
  return raw
    .replace(/\n\n+/g, '\x00') // stash paragraph breaks
    .replace(/\n/g, ' ') // collapse lone soft-wrap newlines into a space
    .replace(/\x00/g, '\n') // restore paragraph breaks as a single \n
    .trim()
}

function extractFence(text: string): string {
  const m = text.match(/^```[^\n]*\n([\s\S]*?)\n?```$/)
  return m ? m[1].trim() : text.trim()
}

// node kinds from typedoc
const KIND_INTERFACE = 256
const KIND_CLASS = 128
const KIND_TYPE_ALIAS = 2097152

/** Walk the full tree and index every node by its numeric id. */
function buildTargetMap(root: any, map: Map<number, any> = new Map()): Map<number, any> {
  if (root?.id) map.set(root.id, root)
  for (const child of root?.children ?? []) buildTargetMap(child, map)
  return map
}

function serializeType(
  t: any,
  targetMap: Map<number, any>,
  seen = new Set<number>(),
  typeParamMap = new Map<number, any>()
): any {
  if (!t) return null
  const st = (x: any) => serializeType(x, targetMap, seen, typeParamMap)
  switch (t.type) {
    case 'intrinsic':
      return t.name
    case 'literal':
      return { kind: 'literal', value: t.value }
    case 'union':
      return { kind: 'union', types: t.types.map(st) }
    case 'intersection':
      return { kind: 'intersection', types: t.types.map(st) }
    case 'array':
      return { kind: 'array', elementType: st(t.elementType) }
    case 'tuple':
      return { kind: 'tuple', elements: (t.elements ?? []).map(st) }
    case 'reference': {
      // Substitute generic type parameters with their concrete arguments
      if (t.refersToTypeParameter) {
        if (typeof t.target === 'number' && typeParamMap.has(t.target)) {
          return serializeType(typeParamMap.get(t.target), targetMap, seen, typeParamMap)
        }
        // Unresolved type parameter (e.g. invoke<T> — T is unknown at doc time)
        return { kind: 'typeParam', name: t.name }
      }
      const targetId: number | undefined = t.target ?? t.id
      if (targetId && !seen.has(targetId)) {
        const node = targetMap.get(targetId)
        if (node) {
          const nextSeen = new Set(seen).add(targetId)
          // Interface or class: inline as object with named properties
          if (node.kind === KIND_INTERFACE || node.kind === KIND_CLASS) {
            const serialize = (x: any) => serializeType(x, targetMap, nextSeen, typeParamMap)
            return {
              kind: 'object',
              name: node.name,
              properties: (node.children ?? []).map((child: any) => ({
                name: child.name,
                optional: child.flags?.isOptional ?? false,
                description: child.comment?.summary?.length
                  ? contentToMd(child.comment.summary)
                  : undefined,
                type: serialize(child.type),
              })),
            }
          }
          // Type alias: build a child typeParamMap by mapping the alias's type parameters
          // to the concrete arguments supplied at the call site, then inline.
          if (node.kind === KIND_TYPE_ALIAS && node.type) {
            let childMap = typeParamMap
            if (t.typeArguments?.length && node.typeParameters?.length) {
              childMap = new Map(typeParamMap)
              for (let i = 0; i < node.typeParameters.length; i++) {
                childMap.set(node.typeParameters[i].id, t.typeArguments[i])
              }
            }
            const result = serializeType(node.type, targetMap, nextSeen, childMap)
            // Preserve the alias name on inlined objects so the display can use it
            if (result && typeof result === 'object' && result.kind === 'object' && !result.name) {
              result.name = node.name
            }
            return result
          }
        }
      }
      // Fallback: named reference. Strip unresolved type arguments that are
      // bare type parameters (e.g. FunctionsResponseSuccess<T> → drop <T>).
      const r: any = { kind: 'reference', name: t.name }
      if (t.typeArguments?.length) {
        const args = t.typeArguments.map(st)
        const allTypeParams = args.every(
          (a: any) => a && typeof a === 'object' && a.kind === 'typeParam'
        )
        if (!allTypeParams) r.typeArguments = args
      }
      return r
    }
    case 'reflection': {
      return {
        kind: 'object',
        properties: (t.declaration?.children ?? []).map((child: any) => ({
          name: child.name,
          optional: child.flags?.isOptional ?? false,
          ...(child.comment?.summary?.length
            ? { description: contentToMd(child.comment.summary) }
            : {}),
          type: st(child.type),
        })),
      }
    }
    case 'templateLiteral':
      return { kind: 'templateLiteral' }
    case 'indexedAccess':
      return { kind: 'indexedAccess', objectType: st(t.objectType), indexType: st(t.indexIndex) }
    default:
      return { kind: t.type ?? 'unknown' }
  }
}

function serializeParam(p: any, targetMap: Map<number, any>): any {
  const out: any = { name: p.name }
  if (p.flags?.isOptional) out.optional = true
  if (p.comment?.summary?.length) out.description = contentToMd(p.comment.summary)
  out.type = serializeType(p.type, targetMap)
  return out
}

function parseExamples(blockTags: BlockTag[]): any[] {
  const examples = blockTags.filter((t) => t.tag === '@example')
  const sqls = blockTags.filter((t) => t.tag === '@exampleSql')
  const responses = blockTags.filter((t) => t.tag === '@exampleResponse')
  const descs = blockTags.filter((t) => t.tag === '@exampleDescription')

  function findByName(tags: BlockTag[], title: string): BlockTag | undefined {
    return tags.find((t) => {
      const first = t.content?.find((c) => c.kind === 'text')?.text?.trim()
      return first && (first === title || first.startsWith(title))
    })
  }

  return examples.map((ex, i) => {
    const title = ex.name && ex.name !== 'undefined' ? ex.name : `Example ${i + 1}`
    const codeBlock = ex.content?.find((c) => c.kind === 'code')
    const code = codeBlock ? extractFence(codeBlock.text) : ''

    const sqlTag = findByName(sqls, title) ?? sqls[i]
    const responseTag = findByName(responses, title) ?? responses[i]
    const descTag = findByName(descs, title) ?? descs[i]

    // Use findLast so inline code spans (e.g. `select()`) before the fenced block are skipped
    const sqlBlock = sqlTag?.content?.findLast((c) => c.kind === 'code')
    const responseBlock = responseTag?.content?.findLast((c) => c.kind === 'code')
    const notes = descTag?.content
      ?.filter((c) => c.kind === 'text' || c.kind === 'code')
      .map((c) => {
        if (c.kind === 'text' && c.text.trimStart().startsWith(title)) {
          // Strip the title line prefix, keep anything that follows it
          return c.text.slice(c.text.indexOf(title) + title.length).replace(/^\s*\n/, '')
        }
        return c.text
      })
      .filter((t) => t.trim())
      .join('')
      .trim()

    const result: any = { title, code }
    if (sqlBlock) result.sql = extractFence(sqlBlock.text)
    if (responseBlock) result.response = extractFence(responseBlock.text)
    if (notes) result.notes = notes
    return result
  })
}

// Collect all variant:declaration nodes that have signatures AND a comment (on the
// declaration itself or on the first signature — storage methods store tags on sigs).
function collectDeclarations(node: any): any[] {
  const out: any[] = []
  if (node.variant === 'declaration' && node.signatures?.length) {
    const comment = node.comment ?? node.signatures[0]?.comment
    if (comment) {
      // Normalise: always expose comment at declaration level
      out.push({ ...node, comment })
    }
  }
  for (const child of node.children ?? []) out.push(...collectDeclarations(child))
  return out
}

function applyDefinitionOverrides(
  category: string,
  definitions: any[],
  overrideMap: Map<string, OverrideDefinition>
): any[] {
  // Apply name overrides and split into ordered/unordered
  const tagged = definitions.map((def) => {
    const ov = overrideMap.get(`${category}|${def.name}`)
    if (!ov) return { def, order: undefined as number | undefined }
    return { def: { ...def, ...(ov.name ? { name: ov.name } : {}) }, order: ov.order }
  })

  const ordered = tagged
    .filter((x) => x.order !== undefined)
    .sort((a, b) => (a.order as number) - (b.order as number))
  const unordered = tagged.filter((x) => x.order === undefined).map((x) => x.def)

  // Place ordered items at their 0-based positions; fill gaps with unordered items
  const orderedByPos = new Map(ordered.map((x) => [x.order as number, x.def]))
  const out: any[] = []
  let ui = 0
  for (let i = 0; i < tagged.length; i++) {
    if (orderedByPos.has(i)) {
      out.push(orderedByPos.get(i))
    } else if (ui < unordered.length) {
      out.push(unordered[ui++])
    }
  }
  while (ui < unordered.length) out.push(unordered[ui++])
  return out
}

export function processSpec(specDir: string): { categories: SpecCategory[]; config: SpecConfig } {
  // Load config (optional — missing config is fine)
  const config: SpecConfig = (() => {
    try {
      return JSON.parse(readFileSync(join(specDir, 'config.json'), 'utf-8'))
    } catch {
      return {}
    }
  })()

  // Build Sets/Maps keyed by "category|name" for O(1) lookup.
  // Supports both string[] (global ignore) and { category, definition }[] (scoped ignore).
  const ignoredKeys = new Set(
    (config.ignoreDefinitions ?? []).flatMap((e: any) =>
      typeof e === 'string' ? [`*|${e}`] : [`${e.category}|${e.definition}`]
    )
  )
  const overrideMap = new Map(
    (config.overrideDefinitions as OverrideDefinition[] ?? []).map((e) => [
      `${e.category}|${e.definition}`,
      e,
    ])
  )
  const categoryOrder: string[] = (config.categoryOrder as string[]) ?? []

  // Discover all JSON source files in the spec folder, excluding config.json
  const sourceFiles = readdirSync(specDir)
    .filter((f) => f.endsWith('.json') && f !== 'config.json')
    .map((f) => join(specDir, f))

  const roots = sourceFiles.map((f) => JSON.parse(readFileSync(f, 'utf-8')))

  // Build a per-file targetMap so IDs from different packages don't collide
  const fileMaps = roots.map((root) => buildTargetMap(root))

  // Pair every declaration with the targetMap of the file it came from
  const declarations = roots.flatMap((root, i) =>
    collectDeclarations(root).map((decl) => ({ decl, targetMap: fileMaps[i] }))
  )
  const categoryMap = new Map<string, any[]>()

  for (const { decl, targetMap } of declarations) {
    const blockTags: BlockTag[] = decl.comment?.blockTags ?? []
    const categoryTag = blockTags.find((t) => t.tag === '@category')
    if (!categoryTag) continue // skip internal declarations with no category
    const category = (categoryTag.content?.[0]?.text ?? '').split('\n')[0].trim()

    if (ignoredKeys.has(`*|${decl.name}`) || ignoredKeys.has(`${category}|${decl.name}`)) continue

    if (!categoryMap.has(category)) categoryMap.set(category, [])

    const sig = decl.signatures[0]
    const remarkTags = blockTags.filter((t) => t.tag === '@remarks')
    const examples = parseExamples(blockTags)

    const definition: any = {
      name: decl.name,
      description: contentToMd(decl.comment?.summary ?? []),
      ...(remarkTags.length
        ? { remarks: remarkTags.map((t) => contentToMd(t.content ?? [])) }
        : {}),
      parameters: (sig.parameters ?? []).map((p: any) => serializeParam(p, targetMap)),
      returnType: serializeType(sig.type, targetMap),
      ...(examples.length ? { examples } : {}),
    }

    categoryMap.get(category)!.push(definition)
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, definitions]) => ({
      category,
      definitions: applyDefinitionOverrides(category, definitions, overrideMap),
    }))
    .sort((a, b) => {
      const ai = categoryOrder.indexOf(a.category)
      const bi = categoryOrder.indexOf(b.category)
      // Both in order list: sort by position
      if (ai !== -1 && bi !== -1) return ai - bi
      // Only a is in list: a goes first
      if (ai !== -1) return -1
      // Only b is in list: b goes first
      if (bi !== -1) return 1
      // Neither in list: preserve insertion order
      return 0
    })

  return { categories, config }
}
