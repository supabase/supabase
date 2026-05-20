/**
 * Build reference content files (bySlug.json, etc.) from TypeDoc spec output.
 *
 * Scans `spec/reference/[library]/[version]/*.json` (TypeDoc output) and writes
 * `content/reference/[library]/[version]/{bySlug,flat,sections,functions,typeSpec}.json`.
 *
 * Library and version names are inferred from the directory layout. An optional
 * `config.json` in each version directory may declare `excludeCategories` and
 * `categoryOrder` to filter and order the output.
 *
 * Usage: pnpm tsx scripts/build-reference-content.ts
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '..')
const SPEC_DIR = join(DOCS_DIR, 'spec/reference')
const OUTPUT_DIR = join(DOCS_DIR, 'content/reference')

type ContentPart = { kind: string; text?: string }

interface BlockTag {
  tag: string
  name?: string
  content: ContentPart[]
}

interface Comment {
  summary?: ContentPart[]
  blockTags?: BlockTag[]
}

interface Param {
  name: string
  type: unknown
  flags?: { isOptional?: boolean }
}

interface Declaration {
  id?: number
  name?: string
  variant?: string
  kind?: number
  comment?: Comment
  signatures?: Declaration[]
  children?: Declaration[]
  // signature-only / variable-only fields:
  parameters?: Param[]
  type?: unknown
  flags?: { isOptional?: boolean; isConst?: boolean }
}

interface FunctionEntry {
  name: string
  category: string
  subcategory: string | null
  $ref: string
}

interface FunctionsEntry {
  id: string
  $ref: string
}

interface TypeSpecMethod {
  ref: string
  params: Array<{ name: string; type: unknown; isOptional?: boolean }>
  returnType?: unknown
}

interface TypeSpecVariable {
  ref: string
  type?: unknown
  isConst?: boolean
}

interface TypeSpec {
  methods: Record<string, TypeSpecMethod>
  variables: Record<string, TypeSpecVariable>
}

interface BySlugFunction {
  id: string
  title: string
  slug: string
  product?: string
  type: 'function'
  isFunc?: false
}

interface BySlugCategory {
  type: 'category'
  title: string
}

interface BySlugMarkdown {
  id: string
  title: string
  slug: string
  type: 'markdown'
}

type BySlugEntry = BySlugFunction | BySlugCategory | BySlugMarkdown

/** A bySlug entry that may additionally carry nested children — used by sections.json. */
type SectionEntry = BySlugEntry & { items?: SectionEntry[] }

interface VersionConfig {
  excludeCategories?: string[]
  excludeDefinitions?: string[]
  categoryOrder?: string[]
  partialsOrder?: string[]
}

interface PartialEntry {
  name: string
  title: string
  ref?: string
}

/** Converts a camelCase identifier to kebab-case (e.g. `linkIdentity` → `link-identity`). */
function camelToKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Lowercases a string and collapses internal whitespace to hyphens for use as a URL slug. */
function slugifyTag(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-')
}

/**
 * Stably reorders `items` so entries whose key appears in `order` come first in
 * that order; unranked items keep their original relative order. Returns `items`
 * unchanged when `order` is empty or undefined.
 */
function reorder<T>(items: T[], order: string[] | undefined, key: (item: T) => string): T[] {
  if (!order?.length) return items
  const idx = new Map(order.map((n, i) => [n, i]))
  return [...items].sort((a, b) => (idx.get(key(a)) ?? Infinity) - (idx.get(key(b)) ?? Infinity))
}

/**
 * Builds a bySlug entry for a partial file. When the partial declares a `ref`
 * in its frontmatter, it acts as a named function (linked to TypeDoc-derived
 * code) and is emitted as `type: 'function'`; otherwise it's plain `markdown`.
 */
const partialEntry = (p: PartialEntry): BySlugMarkdown | BySlugFunction =>
  p.ref
    ? { id: p.name, title: p.title, slug: p.name, type: 'function' }
    : { id: p.name, title: p.title, slug: p.name, type: 'markdown' }

/** Builds a category-type bySlug entry from a category title. */
const categoryEntry = (title: string): BySlugCategory => ({ type: 'category', title })

/** Builds a subcategory bySlug entry — shaped like a function with `isFunc: false`. */
const subcategoryEntry = (slug: string, title: string, product: string): BySlugFunction => ({
  id: slug,
  isFunc: false,
  title,
  slug,
  product,
  type: 'function',
})

/** Builds a function bySlug entry, deriving the slug from `${product}-${name}`. */
const functionEntry = (fn: FunctionEntry, product: string): BySlugFunction => {
  const slug = `${product}-${fn.name.toLowerCase()}`
  return { id: camelToKebab(fn.name), title: fn.name, slug, product, type: 'function' }
}

/**
 * Reads a named TSDoc block tag (e.g. `@category`) from a comment and returns
 * its first line trimmed, or `null` if absent.
 */
function readBlockTag(comment: Comment | undefined, tagName: string): string | null {
  if (!comment?.blockTags) return null
  const tag = comment.blockTags.find((t) => t.tag === tagName)
  if (!tag) return null
  const text = tag.content
    .map((c) => c.text ?? '')
    .join('')
    .split('\n')[0]
    .trim()
  return text || null
}

/**
 * Reads a block tag from a declaration's comment, falling back to its signature
 * comments. TypeDoc emits tags in either place depending on the source style.
 */
function readTagFromDeclOrSignature(decl: Declaration, tagName: string): string | null {
  const fromDecl = readBlockTag(decl.comment, tagName)
  if (fromDecl) return fromDecl
  if (decl.signatures) {
    for (const sig of decl.signatures) {
      const fromSig = readBlockTag(sig.comment, tagName)
      if (fromSig) return fromSig
    }
  }
  return null
}

/**
 * Recursively walks a TypeDoc declaration tree. Builds two outputs in one pass:
 *   - `functions`: declarations carrying an `@category` tag (with optional
 *     `@subcategory`) plus a constructed `$ref` of the form
 *     `<package>.<class…>.<name>`.
 *   - `typeSpec`: separate `methods` and `variables` maps keyed by the same
 *     `$ref`. Methods get their first signature's parameters and return type;
 *     variables (kind 32) get their type and `isConst` flag. Not filtered by
 *     category or `excludeDefinitions`, so partials that link to "hidden"
 *     methods (e.g. a constructor) can still resolve.
 *
 * Context is threaded down via `pkg` (the top-level project name) and
 * `classes` (the chain of enclosing class names).
 */
function collectFunctions(
  node: Declaration,
  out: { functions: FunctionEntry[]; typeSpec: TypeSpec },
  ctx: { pkg: string | null; classes: string[] } = { pkg: null, classes: [] }
): void {
  let nextCtx = ctx
  if (node.kind === 1 && node.name) {
    nextCtx = { pkg: node.name, classes: [] }
  } else if (node.kind === 128 && node.name) {
    nextCtx = { ...ctx, classes: [...ctx.classes, node.name] }
  }

  if (ctx.pkg && node.name) {
    const ref = [ctx.pkg, ...ctx.classes, node.name].join('.')
    if (node.signatures?.length) {
      const sig = node.signatures[0]
      out.typeSpec.methods[ref] = {
        ref,
        params: (sig.parameters ?? []).map((p) => {
          const entry: TypeSpecMethod['params'][number] = { name: p.name, type: p.type }
          if (p.flags?.isOptional) entry.isOptional = true
          return entry
        }),
        returnType: sig.type,
      }
    } else if (node.kind === 32 && node.type) {
      const entry: TypeSpecVariable = { ref, type: node.type }
      if (node.flags?.isConst) entry.isConst = true
      out.typeSpec.variables[ref] = entry
    }
  }

  if (ctx.pkg && node.name && node.variant === 'declaration') {
    const category = readTagFromDeclOrSignature(node, '@category')
    if (category) {
      const subcategory = readTagFromDeclOrSignature(node, '@subcategory')
      const $ref = [ctx.pkg, ...ctx.classes, node.name].join('.')
      out.functions.push({ name: node.name, category, subcategory, $ref })
    }
  }

  if (node.children) {
    for (const child of node.children) {
      collectFunctions(child, out, nextCtx)
    }
  }
}

/** Reads `config.json` from a version directory, returning `{}` if the file is missing. */
async function readConfig(versionDir: string): Promise<VersionConfig> {
  try {
    const raw = await readFile(join(versionDir, 'config.json'), 'utf-8')
    return JSON.parse(raw) as VersionConfig
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw err
  }
}

/**
 * Reads every `.mdx` / `.md` file from the `partials/` subdirectory, parses
 * frontmatter for a `title`, and returns the entries sorted alphabetically by
 * file name. Returns `[]` if `partials/` doesn't exist.
 */
async function readPartials(versionDir: string): Promise<PartialEntry[]> {
  const partialsDir = join(versionDir, 'partials')
  let files: string[]
  try {
    files = await readdir(partialsDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }

  const partials: PartialEntry[] = []
  for (const file of files) {
    const ext = extname(file)
    if (ext !== '.mdx' && ext !== '.md') continue
    const raw = await readFile(join(partialsDir, file), 'utf-8')
    const { data } = matter(raw)
    const name = file.slice(0, -ext.length)
    const title = typeof data.title === 'string' ? data.title : name
    const ref = typeof data.ref === 'string' ? data.ref : undefined
    partials.push({ name, title, ref })
  }

  // Default to alphabetical so `reorder` can place ranked items first and leave
  // the rest in a deterministic order (Array.sort is stable since ES2019).
  return partials.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Builds bySlug (a flat slug→entry map), sections (the same data shaped as a
 * nested tree: partials, then each category containing its functions and
 * subcategories), and a functions list (id→$ref pairs for functions.json) in
 * a single pass. Categories are filtered by `excludeCategories` and ordered by
 * `categoryOrder`; individual declarations are filtered by `excludeDefinitions`
 * (matched on the source name, case-sensitive). Partials with a `ref` in
 * frontmatter are emitted as `type: 'function'` entries and contribute to
 * the functions list.
 */
function buildBySlug(
  functions: FunctionEntry[],
  partials: PartialEntry[],
  config: VersionConfig
): {
  bySlug: Record<string, BySlugEntry>
  sections: SectionEntry[]
  functionsList: FunctionsEntry[]
} {
  const bySlug: Record<string, BySlugEntry> = {}
  const sections: SectionEntry[] = []
  const functionsList: FunctionsEntry[] = []

  for (const p of reorder(partials, config.partialsOrder, (x) => x.name)) {
    const entry = partialEntry(p)
    bySlug[p.name] = entry
    sections.push(entry)
    if (p.ref) functionsList.push({ id: p.name, $ref: p.ref })
  }

  const excludeCats = new Set(config.excludeCategories ?? [])
  const excludeDefs = new Set(config.excludeDefinitions ?? [])
  const filtered = functions.filter(
    ({ name, category }) => !excludeCats.has(category) && !excludeDefs.has(name)
  )

  type CategoryGroup = {
    title: string
    withoutSub: FunctionEntry[]
    bySub: Map<string, FunctionEntry[]>
  }
  const groups = new Map<string, CategoryGroup>()

  for (const fn of filtered) {
    let group = groups.get(fn.category)
    if (!group) {
      group = { title: fn.category, withoutSub: [], bySub: new Map() }
      groups.set(fn.category, group)
    }
    if (fn.subcategory) {
      const bucket = group.bySub.get(fn.subcategory) ?? []
      bucket.push(fn)
      group.bySub.set(fn.subcategory, bucket)
    } else {
      group.withoutSub.push(fn)
    }
  }

  const orderedCategories = reorder(Array.from(groups.keys()), config.categoryOrder, (c) => c)

  const writeFunction = (fn: FunctionEntry, product: string, items: SectionEntry[]) => {
    const entry = functionEntry(fn, product)
    // Spec files can re-declare same-named methods on different classes; the
    // slug collides, so only emit each unique slug once (first wins).
    if (entry.slug in bySlug) return
    bySlug[entry.slug] = entry
    items.push(entry)
    functionsList.push({ id: entry.slug, $ref: fn.$ref })
  }

  for (const category of orderedCategories) {
    const group = groups.get(category)!
    const product = slugifyTag(category)

    const cat = categoryEntry(group.title)
    const catItems: SectionEntry[] = []
    bySlug[product] = cat
    sections.push({ ...cat, items: catItems })

    for (const fn of group.withoutSub) writeFunction(fn, product, catItems)

    for (const [subcategory, fns] of group.bySub) {
      const subSlug = `${product}-${slugifyTag(subcategory)}`
      const sub = subcategoryEntry(subSlug, subcategory, product)
      const subItems: SectionEntry[] = []
      bySlug[subSlug] = sub
      catItems.push({ ...sub, items: subItems })

      for (const fn of fns) writeFunction(fn, product, subItems)
    }
  }

  return { bySlug, sections, functionsList }
}

/**
 * Processes one `[library]/[version]` directory: reads spec files, partials,
 * and config, then writes all five output files (`bySlug.json`, `flat.json`,
 * `sections.json`, `functions.json`, `typeSpec.json`) in parallel. `flat.json`
 * is `Object.values(bySlug)`, `sections.json` is the nested tree, `functions.json`
 * maps each slug/partial to its `$ref`, and `typeSpec.json` holds the raw
 * parameter and return-type signatures keyed by ref.
 */
async function processVersion(library: string, version: string): Promise<void> {
  const versionDir = join(SPEC_DIR, library, version)
  const files = (await readdir(versionDir)).filter(
    (f) => f.endsWith('.json') && f !== 'config.json'
  )

  const config = await readConfig(versionDir)
  const partials = await readPartials(versionDir)

  const collected = {
    functions: [] as FunctionEntry[],
    typeSpec: { methods: {}, variables: {} } as TypeSpec,
  }
  for (const file of files) {
    const raw = await readFile(join(versionDir, file), 'utf-8')
    const spec = JSON.parse(raw) as Declaration
    collectFunctions(spec, collected)
  }

  const { bySlug, sections, functionsList } = buildBySlug(collected.functions, partials, config)
  const flat = Object.values(bySlug)

  const counts = { markdown: 0, function: 0, subcategory: 0, category: 0 }
  for (const v of flat) {
    if (v.type === 'markdown') counts.markdown++
    else if (v.type === 'category') counts.category++
    else if ('isFunc' in v && v.isFunc === false) counts.subcategory++
    else counts.function++
  }

  const outputDir = join(OUTPUT_DIR, library, version)
  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeFile(join(outputDir, 'bySlug.json'), JSON.stringify(bySlug)),
    writeFile(join(outputDir, 'flat.json'), JSON.stringify(flat)),
    writeFile(join(outputDir, 'sections.json'), JSON.stringify(sections)),
    writeFile(join(outputDir, 'functions.json'), JSON.stringify(functionsList)),
    writeFile(join(outputDir, 'typeSpec.json'), JSON.stringify(collected.typeSpec)),
  ])

  const typeSpecMethods = Object.keys(collected.typeSpec.methods).length
  const typeSpecVariables = Object.keys(collected.typeSpec.variables).length
  console.log(
    `[${library}/${version}] wrote 5 files — ${collected.functions.length} declarations scanned, ${counts.markdown} partials, ${counts.function} function slugs, ${counts.subcategory} subcategories, ${counts.category} categories, ${functionsList.length} functions.json entries, ${typeSpecMethods} typeSpec methods, ${typeSpecVariables} typeSpec variables`
  )
}

/** Entry point: discovers every `[library]/[version]` pair under `spec/reference` and processes each. */
async function main(): Promise<void> {
  const libraries = await readdir(SPEC_DIR, { withFileTypes: true })
  for (const lib of libraries) {
    if (!lib.isDirectory()) continue
    const versions = await readdir(join(SPEC_DIR, lib.name), { withFileTypes: true })
    for (const version of versions) {
      if (!version.isDirectory()) continue
      await processVersion(lib.name, version.name)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
