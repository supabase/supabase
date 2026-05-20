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

interface Declaration {
  id?: number
  name?: string
  variant?: string
  kind?: number
  comment?: Comment
  signatures?: Declaration[]
  children?: Declaration[]
}

interface FunctionEntry {
  name: string
  category: string
  subcategory: string | null
}

interface BySlugFunction {
  id: string
  title: string
  slug: string
  product: string
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

interface VersionConfig {
  excludeCategories?: string[]
  categoryOrder?: string[]
  partialsOrder?: string[]
}

interface PartialEntry {
  name: string
  title: string
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

/** Builds a markdown-type bySlug entry for a partial file. */
const partialEntry = (p: PartialEntry): BySlugMarkdown => ({
  id: p.name,
  title: p.title,
  slug: p.name,
  type: 'markdown',
})

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
 * Recursively walks a TypeDoc declaration tree, appending every declaration
 * that carries an `@category` tag to `results` along with its optional
 * `@subcategory`.
 */
function collectFunctions(node: Declaration, results: FunctionEntry[]): void {
  if (node.name && node.variant === 'declaration') {
    const category = readTagFromDeclOrSignature(node, '@category')
    if (category) {
      const subcategory = readTagFromDeclOrSignature(node, '@subcategory')
      results.push({ name: node.name, category, subcategory })
    }
  }

  if (node.children) {
    for (const child of node.children) {
      collectFunctions(child, results)
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
    partials.push({ name, title })
  }

  // Default to alphabetical so `reorder` can place ranked items first and leave
  // the rest in a deterministic order (Array.sort is stable since ES2019).
  return partials.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Assembles the final bySlug map for a version: partials first, then each
 * category (filtered by `excludeCategories`, ordered by `categoryOrder`)
 * followed by its category-only functions and any subcategories with their
 * own functions.
 */
function buildBySlug(
  functions: FunctionEntry[],
  partials: PartialEntry[],
  config: VersionConfig
): Record<string, BySlugEntry> {
  const bySlug: Record<string, BySlugEntry> = {}

  for (const p of reorder(partials, config.partialsOrder, (x) => x.name)) {
    bySlug[p.name] = partialEntry(p)
  }

  const excludeSet = new Set(config.excludeCategories ?? [])
  const filtered = functions.filter(({ category }) => !excludeSet.has(category))

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

  const writeFunction = (fn: FunctionEntry, product: string) => {
    const entry = functionEntry(fn, product)
    bySlug[entry.slug] = entry
  }

  for (const category of orderedCategories) {
    const group = groups.get(category)!
    const product = slugifyTag(category)

    bySlug[product] = categoryEntry(group.title)

    for (const fn of group.withoutSub) writeFunction(fn, product)

    for (const [subcategory, fns] of group.bySub) {
      const subSlug = `${product}-${slugifyTag(subcategory)}`
      bySlug[subSlug] = subcategoryEntry(subSlug, subcategory, product)
      for (const fn of fns) writeFunction(fn, product)
    }
  }

  return bySlug
}

/**
 * Processes one `[library]/[version]` directory: reads spec files, partials,
 * and config, then writes `bySlug.json` and `flat.json` to the output
 * directory in parallel. `flat.json` is `Object.values(bySlug)` — the same
 * entries in iteration order, used both for counting and as the array output.
 */
async function processVersion(library: string, version: string): Promise<void> {
  const versionDir = join(SPEC_DIR, library, version)
  const files = (await readdir(versionDir)).filter(
    (f) => f.endsWith('.json') && f !== 'config.json'
  )

  const config = await readConfig(versionDir)
  const partials = await readPartials(versionDir)

  const functions: FunctionEntry[] = []
  for (const file of files) {
    const raw = await readFile(join(versionDir, file), 'utf-8')
    const spec = JSON.parse(raw) as Declaration
    collectFunctions(spec, functions)
  }

  const bySlug = buildBySlug(functions, partials, config)
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
  ])

  console.log(
    `[${library}/${version}] wrote bySlug.json + flat.json — ${functions.length} declarations scanned, ${counts.markdown} partials, ${counts.function} function slugs, ${counts.subcategory} subcategories, ${counts.category} categories`
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
