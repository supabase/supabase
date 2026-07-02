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

import {
  buildMap,
  KIND_VARIABLE,
  normalizeComment,
  parseSignature,
  parseType,
  type MethodTypes,
  type VariableTypes,
} from '../features/docs/Reference.typeSpec'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '..')
const SPEC_DIR = join(DOCS_DIR, 'spec/reference')
const OUTPUT_DIR = join(DOCS_DIR, 'content/reference')
const REF_DOCS_DIR = join(DOCS_DIR, 'docs/ref')

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
  // Either a `$ref` (points at a typeSpec entry) OR rich inline content
  // (description, examples, …) shovelled in from a .json partial body.
  $ref?: string
  [key: string]: unknown
}

/**
 * Per-lib typeSpec.json shape. Keys are normalised `$ref`s; values mirror the
 * legacy `MethodTypes` / `VariableTypes` so the renderer in
 * `Reference.sections.tsx` can consume the new file without changes.
 */
interface TypeSpec {
  methods: Record<string, MethodTypes>
  variables: Record<string, VariableTypes>
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
  /**
   * Customizes the navigation slug used as a prefix for a category or
   * subcategory (matched on the literal `@category` / `@subcategory` text).
   *   - `string` → use that value as the prefix (e.g. `"Edge Functions": "functions"`
   *     turns `edge-functions-invoke` into `functions-invoke`).
   *   - `false`  → drop the prefix entirely for child function slugs (e.g.
   *     `"Using modifiers": false` turns `using-modifiers-explain` into
   *     `explain`). The category/subcategory header itself still needs a slug,
   *     so its entry slug falls back to the slugified title.
   *   - missing  → default to the slugified title.
   */
  navigationPrefixes?: Record<string, string | false>
}

interface PartialEntry {
  name: string
  title: string
  ref?: string
  /**
   * `kind` distinguishes how the partial contributes to the build:
   *   - `markdown`: an `.md`/`.mdx` partial. Rendered as a `type: 'markdown'`
   *     section (or `type: 'function'` when a frontmatter `ref` is present).
   *   - `function`: a `.json` partial whose body (description, examples, …)
   *     is appended to functions.json so the renderer can display it.
   */
  kind: 'markdown' | 'function'
  /** Raw parsed JSON body for `kind === 'function'` partials. */
  body?: Record<string, unknown>
  /** Raw frontmatter + body for `kind === 'markdown'` partials. */
  mdxRaw?: string
}

/** Lowercases a string and collapses internal whitespace to hyphens for use as a URL slug. */
function slugifyTag(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-')
}

type NavigationPrefixes = Record<string, string | false> | undefined

/**
 * The slug used for a category or subcategory **entry** (the header that
 * appears in the navigation). `navigationPrefixes[title] = string` overrides
 * the default; `false` and `undefined` both fall back to the slugified title
 * because the entry still needs a stable, navigable slug.
 */
function entrySlug(title: string, navigationPrefixes: NavigationPrefixes): string {
  const override = navigationPrefixes?.[title]
  return typeof override === 'string' ? override : slugifyTag(title)
}

/**
 * The prefix segment used in front of a function's name. `false` means "no
 * prefix" — the function slug becomes just its lowercased name. `string`
 * overrides the default; `undefined` falls back to the slugified title.
 */
function functionPrefix(title: string, navigationPrefixes: NavigationPrefixes): string | null {
  const override = navigationPrefixes?.[title]
  if (override === false) return null
  if (typeof override === 'string') return override
  return slugifyTag(title)
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
 * Builds a bySlug entry for a partial file:
 *   - `.json` partials always render as `type: 'function'` (their body feeds
 *     functions.json).
 *   - `.md`/`.mdx` partials with a frontmatter `ref` render as `type: 'function'`
 *     (linked to TypeDoc-derived code via the ref).
 *   - All other `.md`/`.mdx` partials render as plain `type: 'markdown'`.
 */
const partialEntry = (p: PartialEntry): BySlugMarkdown | BySlugFunction =>
  p.kind === 'function' || p.ref
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

/**
 * Builds a function bySlug entry. The slug is `${prefix}-${name}` where
 * `prefix` comes from the function's nearest container — its `@subcategory`
 * if present, otherwise its `@category`. `navigationPrefixes` in `config.json`
 * can rename that prefix or drop it entirely (false). `id` always equals
 * `slug` so the renderer's `fns.find(f => f.id === section.id)` resolves.
 *
 * `product` keeps the literal slugified category (independent of any
 * navigation prefix) because the renderer uses it for feature filtering
 * (e.g. hiding `auth` sections when the SDK Auth flag is disabled).
 */
const functionEntry = (
  fn: FunctionEntry,
  product: string,
  navigationPrefixes: NavigationPrefixes
): BySlugFunction => {
  const prefix = functionPrefix(fn.subcategory ?? fn.category, navigationPrefixes)
  const nameLower = fn.name.toLowerCase()
  const slug = prefix === null ? nameLower : `${prefix}-${nameLower}`
  return { id: slug, title: fn.name, slug, product, type: 'function' }
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

/** Strips redundant `.index.` segments and collapses consecutive dots in a ref. */
function normalizeRefPath(path: string): string {
  return path.replace(/\.index(?=\.|$)/g, '').replace(/\.+/g, '.')
}

/**
 * Recursively walks a TypeDoc declaration tree. Builds two outputs in one pass:
 *   - `functions`: declarations carrying an `@category` tag (with optional
 *     `@subcategory`) plus a constructed `$ref` of the form
 *     `<package>.<module…>.<class…>.<name>` (normalized to strip `.index.`).
 *   - `typeSpec`: separate `methods` and `variables` maps keyed by the same
 *     `$ref`. Methods carry every signature (first → primary, rest →
 *     `altSignatures`) with params, return type, and normalised comment
 *     (shortText, text, tags, examples). Variables (kind 32) carry their
 *     parsed type and `isConst` flag. Type-tree normalisation and comment
 *     extraction are delegated to the shared helpers in
 *     `~/features/docs/Reference.typeSpec` so the renderer can consume the
 *     output without any shape translation.
 *
 *   Not filtered by category or `excludeDefinitions`, so partials that link
 *   to "hidden" methods (e.g. a constructor) can still resolve.
 *
 * Context is threaded down through container nodes:
 *   - kind 1 (project) sets the package name and resets the path.
 *   - kinds 2 (module), 4 (namespace), 128 (class), 256 (interface) all
 *     append their name to the path. Modules are required because some
 *     packages (storage-js, supabase-js) wrap each source file in a module
 *     like `packages/StorageFileApi`, and a class named `default` (TypeDoc's
 *     fallback for default-exported classes) is ambiguous without the module
 *     segment. Interfaces hold many of the auth admin APIs whose methods
 *     would otherwise lack a class segment in the ref.
 */
const PATH_CONTAINER_KINDS = new Set([2, 4, 128, 256])

function collectFunctions(
  node: Declaration,
  out: { functions: FunctionEntry[]; typeSpec: TypeSpec },
  idMap: Map<number, any>,
  ctx: { pkg: string | null; path: string[] } = { pkg: null, path: [] }
): void {
  let nextCtx = ctx
  if (node.kind === 1 && node.name) {
    nextCtx = { pkg: node.name, path: [] }
  } else if (node.kind && PATH_CONTAINER_KINDS.has(node.kind) && node.name) {
    nextCtx = { ...ctx, path: [...ctx.path, node.name] }
  }

  if (ctx.pkg && node.name) {
    const ref = normalizeRefPath([ctx.pkg, ...ctx.path, node.name].join('.'))
    if (node.signatures?.length) {
      const firstSig = node.signatures[0]
      const { params, ret, comment: sigComment } = parseSignature(firstSig, idMap)

      // Some overloaded methods carry shared JSDoc (e.g. @remarks, @example)
      // on the declaration node rather than any individual signature. Merge
      // node-level tags as a base so they aren't lost when the first
      // signature only has a summary.
      let comment = sigComment
      if (node.comment) {
        const nodeComment = normalizeComment(node.comment as any)
        if (nodeComment) {
          comment = { ...nodeComment, ...sigComment }
        }
      }

      const methodEntry: MethodTypes = { name: ref, params, ret, comment }
      if (node.signatures.length > 1) {
        methodEntry.altSignatures = node.signatures.slice(1).map((sig) => {
          const { params: altParams, ret: altRet } = parseSignature(sig, idMap)
          return { params: altParams, ret: altRet }
        }) as MethodTypes['altSignatures']
      }
      out.typeSpec.methods[ref] = methodEntry
    } else if (node.kind === KIND_VARIABLE && node.type) {
      const variableEntry: VariableTypes = {
        name: ref,
        type: parseType(node.type, idMap),
        comment: node.comment ? normalizeComment(node.comment as any) : undefined,
        isConst: node.flags?.isConst ?? false,
      }
      out.typeSpec.variables[ref] = variableEntry
    }
  }

  if (ctx.pkg && node.name && node.variant === 'declaration') {
    const category = readTagFromDeclOrSignature(node, '@category')
    if (category) {
      const subcategory = readTagFromDeclOrSignature(node, '@subcategory')
      const $ref = normalizeRefPath([ctx.pkg, ...ctx.path, node.name].join('.'))
      out.functions.push({ name: node.name, category, subcategory, $ref })
    }
  }

  if (node.children) {
    for (const child of node.children) {
      collectFunctions(child, out, idMap, nextCtx)
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
 * Reads every `.mdx` / `.md` / `.json` file from the `partials/` subdirectory.
 * Markdown partials (`.md`, `.mdx`) have their frontmatter parsed for `title`
 * and `ref`; JSON partials are parsed as objects and their full body kept so
 * it can be emitted into functions.json. Returns alphabetically-sorted entries
 * (case-insensitive); returns `[]` if `partials/` doesn't exist.
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
    const name = file.slice(0, -ext.length)
    const raw = await readFile(join(partialsDir, file), 'utf-8')

    if (ext === '.mdx' || ext === '.md') {
      // `trimStart()` so frontmatter is parsed even when the file accidentally
      // starts with blank lines before `---`.
      const trimmed = raw.trimStart()
      const { data } = matter(trimmed)
      const title = typeof data.title === 'string' ? data.title : name
      const ref = typeof data.ref === 'string' ? data.ref : undefined
      partials.push({ name, title, ref, kind: 'markdown', mdxRaw: trimmed })
    } else if (ext === '.json') {
      const body = JSON.parse(raw) as Record<string, unknown>
      const title = typeof body.title === 'string' ? body.title : name
      partials.push({ name, title, kind: 'function', body })
    }
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

  const excludeCats = new Set(config.excludeCategories ?? [])
  const excludeDefs = new Set(config.excludeDefinitions ?? [])
  const filtered = functions.filter(
    ({ name, category }) => !excludeCats.has(category) && !excludeDefs.has(name)
  )

  // Bucket partials by where they belong. A partial filename that matches a
  // category title slug (e.g. `database.md`) attaches to that category; one
  // that matches a subcategory title slug (e.g. `using-filters.json`) attaches
  // to that subcategory; everything else stays at the top level.
  const categorySlugs = new Set(filtered.map(({ category }) => slugifyTag(category)))
  const subcategorySlugs = new Set(
    filtered.filter((f) => f.subcategory).map((f) => slugifyTag(f.subcategory!))
  )
  const partialsByCategory = new Map<string, PartialEntry>()
  const partialsBySubcategory = new Map<string, PartialEntry>()
  const topLevelPartials: PartialEntry[] = []
  for (const p of partials) {
    if (subcategorySlugs.has(p.name)) partialsBySubcategory.set(p.name, p)
    else if (categorySlugs.has(p.name)) partialsByCategory.set(p.name, p)
    else topLevelPartials.push(p)
  }

  const writePartial = (p: PartialEntry, items: SectionEntry[]) => {
    const entry = partialEntry(p)
    bySlug[p.name] = entry
    items.push(entry)
    if (p.kind === 'function') functionsList.push({ id: p.name, ...p.body })
    else if (p.ref) functionsList.push({ id: p.name, $ref: p.ref })
  }

  for (const p of reorder(topLevelPartials, config.partialsOrder, (x) => x.name)) {
    writePartial(p, sections)
  }

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
    const entry = functionEntry(fn, product, config.navigationPrefixes)
    // Spec files can re-declare same-named methods on different classes; the
    // slug collides, so only emit each unique slug once (first wins).
    if (entry.slug in bySlug) return
    bySlug[entry.slug] = entry
    items.push(entry)
    // functions.json `id` must match the bySlug entry's `id` (not the slug) —
    // the renderer in Reference.sections.tsx does `fns.find(f => f.id === section.id)`.
    functionsList.push({ id: entry.id, $ref: fn.$ref })
  }

  // Sort items alphabetically (case-insensitive) within categories and within
  // subcategories. Subcategories still appear at the end of each category (the
  // order they are pushed below preserves that: withoutSub entries first, then
  // each subcategory block).
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())

  for (const category of orderedCategories) {
    const group = groups.get(category)!
    // `product` keeps the literal slugified category for feature filtering and
    // for partial-filename matching, even when navigationPrefixes renames the
    // category's navigation slug.
    const product = slugifyTag(category)
    const categorySlug = entrySlug(category, config.navigationPrefixes)

    const cat = categoryEntry(group.title)
    const catItems: SectionEntry[] = []
    bySlug[categorySlug] = cat
    sections.push({ ...cat, items: catItems })

    const categoryPartial = partialsByCategory.get(product)
    if (categoryPartial) writePartial(categoryPartial, catItems)

    for (const fn of [...group.withoutSub].sort(byName)) writeFunction(fn, product, catItems)

    const sortedSubs = [...group.bySub.entries()].sort(([a], [b]) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
    for (const [subcategory, fns] of sortedSubs) {
      const subKey = slugifyTag(subcategory)
      const subSlug = entrySlug(subcategory, config.navigationPrefixes)
      const sub = subcategoryEntry(subSlug, subcategory, product)
      const subItems: SectionEntry[] = []
      bySlug[subSlug] = sub
      catItems.push({ ...sub, items: subItems })

      const subcategoryPartial = partialsBySubcategory.get(subKey)
      if (subcategoryPartial) writePartial(subcategoryPartial, subItems)

      for (const fn of [...fns].sort(byName)) writeFunction(fn, product, subItems)
    }
  }

  return { bySlug, sections, functionsList }
}

/**
 * For each markdown-kind partial without a `ref`, writes its raw body
 * (frontmatter + content) to `docs/ref/<library>/<name>.mdx` if that file
 * does not already exist. The renderer's `getRefMarkdown` loads body text
 * from this location, so new partials added under `spec/reference/.../partials/`
 * become renderable without manual file shuffling. Existing files are left
 * alone to preserve hand-maintained frontmatter (e.g. `hideTitle`).
 */
async function writeNewMarkdownPartials(library: string, partials: PartialEntry[]): Promise<void> {
  const markdownPartials = partials.filter((p) => p.kind === 'markdown' && p.mdxRaw && !p.ref)
  if (markdownPartials.length === 0) return

  const outDir = join(REF_DOCS_DIR, library)
  await mkdir(outDir, { recursive: true })

  await Promise.all(
    markdownPartials.map(async (p) => {
      const target = join(outDir, `${p.name}.mdx`)
      try {
        // `wx` flag fails with EEXIST if the file is already there.
        await writeFile(target, p.mdxRaw!, { flag: 'wx' })
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
      }
    })
  )
}

/**
 * In-memory computation for a single `[library]/[version]`: reads spec files,
 * partials, and config, walks every TypeDoc declaration, and returns the five
 * derived artifacts (`bySlug`, `flat`, `sections`, `functionsList`,
 * `typeSpec`) plus the partial list needed for downstream `.mdx` seeding.
 *
 * Exported so tests can snapshot the output shape without going through the
 * filesystem.
 */
export async function collectReferenceContent(library: string, version: string) {
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
    // Build a numeric id → node map per package file so `parseType`'s reference
    // resolution can walk dereferenced types and aliased declarations.
    const idMap = new Map<number, any>()
    buildMap(spec, idMap)
    collectFunctions(spec, collected, idMap)
  }

  const { bySlug, sections, functionsList } = buildBySlug(collected.functions, partials, config)
  const flat = Object.values(bySlug)
  return { bySlug, flat, sections, functionsList, typeSpec: collected.typeSpec, partials }
}

/**
 * Processes one `[library]/[version]` directory: reads spec files, partials,
 * and config, then writes all five output files (`bySlug.json`, `flat.json`,
 * `sections.json`, `functions.json`, `typeSpec.json`) in parallel.
 */
async function processVersion(library: string, version: string): Promise<void> {
  const { bySlug, flat, sections, functionsList, typeSpec, partials } =
    await collectReferenceContent(library, version)

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
    writeFile(join(outputDir, 'typeSpec.json'), JSON.stringify(typeSpec)),
  ])

  // The page renderer's `MarkdownSection` loads body text by id from
  // `docs/ref/<library>/<id>.mdx`. Seed that file from any markdown partial
  // whose runtime counterpart doesn't already exist (we don't overwrite
  // hand-maintained legacy partials like introduction.mdx).
  await writeNewMarkdownPartials(library, partials)

  const typeSpecMethods = Object.keys(typeSpec.methods).length
  const typeSpecVariables = Object.keys(typeSpec.variables).length
  console.log(
    `[${library}/${version}] wrote 5 files — ${counts.markdown} partials, ${counts.function} function slugs, ${counts.subcategory} subcategories, ${counts.category} categories, ${functionsList.length} functions.json entries, ${typeSpecMethods} typeSpec methods, ${typeSpecVariables} typeSpec variables`
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

// Only run `main()` when invoked as a script (via `tsx`). Importing this
// module from a test should not trigger the side-effecting walk.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
