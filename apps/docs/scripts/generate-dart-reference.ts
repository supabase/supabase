/**
 * Generate the Dart/Flutter reference dump consumed by the new reference
 * pipeline (`scripts/build-reference-content.ts`).
 *
 * Dart has no upstream TypeDoc output, so this script is the "pre-step" the
 * reference README describes: it adapts the hand-authored legacy spec
 * (`spec/supabase_dart_v2.yml`) plus the shared section tree
 * (`spec/common-client-libs-sections.json`) into a TypeDoc-shaped JSON dump at
 * `spec/reference/dart/v2/supabase_flutter.json`.
 *
 * Each Dart method becomes a `variant: 'declaration'` node tagged with
 * `@category` / `@subcategory` (so the build groups it into the right section)
 * and carries the legacy function shape (description, notes, params, examples)
 * on a non-TypeDoc `content` field. `build-reference-content.ts` spreads that
 * straight onto the functions.json entry, so the renderer shows params,
 * examples, and notes exactly as the legacy YAML did, with no typeSpec
 * round-trip.
 *
 * Overview/header entries (e.g. "Using filters", "Auth MFA") and the top-level
 * markdown sections (introduction, installing, upgrade-guide, initializing) are
 * not emitted here. They live as hand-authored partials under
 * `spec/reference/dart/v2/partials/`, matching how the JavaScript lib is set up.
 *
 * The dump is gitignored (like every other reference dump); only `config.json`
 * and `partials/` are committed. Run via `pnpm codegen:references:new` (the
 * ensure step regenerates this file when it is missing).
 *
 * Usage: pnpm tsx scripts/generate-dart-reference.ts
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '..')
const YAML_PATH = join(DOCS_DIR, 'spec/supabase_dart_v2.yml')
const SECTIONS_PATH = join(DOCS_DIR, 'spec/common-client-libs-sections.json')
const VERSION_DIR = join(DOCS_DIR, 'spec/reference/dart/v2')
const CONFIG_PATH = join(VERSION_DIR, 'config.json')
const OUT_PATH = join(VERSION_DIR, 'supabase_flutter.json')

const LIB_ID = 'reference_dart_v2'

/**
 * Ids whose YAML entry is a category/subcategory overview rather than a method.
 * They are rendered through committed JSON partials (keyed by the subcategory
 * title slug), so they are skipped when building method declarations.
 */
const HEADER_IDS = new Set([
  'using-filters',
  'using-modifiers',
  'auth-mfa-api',
  'passkey-api',
  'admin-api',
  'admin-passkey-api',
  'file-buckets',
])

/** Top-level entries handled by markdown / top-level JSON partials, not methods. */
const SKIP_IDS = new Set(['introduction', 'installing', 'upgrade-guide', 'initializing'])

/**
 * Dart-specific ids that are absent from the shared (JS-centric) section tree.
 * Map them to the category/subcategory they belong to.
 */
const SECTION_OVERRIDE: Record<string, { category: string; subcategory: string | null }> = {
  'max-affected': { category: 'Database', subcategory: 'Using modifiers' },
  'link-identity-with-id-token': { category: 'Auth', subcategory: null },
  'auth-reset-password-for-email': { category: 'Auth', subcategory: null },
}

/** Method-name overrides for titles that don't yield a clean identifier. */
const NAME_OVERRIDE: Record<string, string> = {
  explain: 'explain',
}

interface SectionNode {
  id?: string
  title?: string
  type?: string
  excludes?: string[]
  items?: SectionNode[]
}

interface DartFunction {
  id: string
  title: string
  description?: string
  notes?: string
  params?: unknown[]
  examples?: unknown[]
}

/** Walk the shared section tree, recording each id's category/subcategory for dart v2. */
function buildSectionMap(
  sections: SectionNode[]
): Map<string, { category: string; subcategory: string | null }> {
  const map = new Map<string, { category: string; subcategory: string | null }>()
  const included = (n: SectionNode) => !(n.excludes ?? []).includes(LIB_ID)
  const walk = (nodes: SectionNode[], category: string | null, subcategory: string | null) => {
    for (const node of nodes) {
      if (!included(node)) continue
      if (node.type === 'category') {
        walk(node.items ?? [], node.title ?? '', null)
      } else if (node.items && node.items.length) {
        walk(node.items, category, node.title ?? null)
      } else if (node.id) {
        map.set(node.id, { category: category ?? '', subcategory })
      }
    }
  }
  walk(sections, null, null)
  return map
}

/**
 * Derive a Dart method identifier from a legacy title:
 *   'signUp()'              -> 'signUp'
 *   'Fetch data: select()'  -> 'select'
 *   'from.upload()'         -> 'upload'
 *   'mfa.enroll()'          -> 'enroll'
 *   'on().subscribe()'      -> 'subscribe'
 */
function deriveName(title: string): string {
  let name = String(title)
    .trim()
    .replace(/^['"]|['"]$/g, '')
  if (name.includes(': ')) name = name.split(': ').pop() as string
  name = name.replace(/\([^)]*\)/g, '')
  name = name.split('.').filter(Boolean).pop() ?? name
  return name.trim()
}

function textTag(tag: string, text: string) {
  return { tag, content: [{ kind: 'text', text }] }
}

type NavigationPrefixes = Record<string, string | false>

/**
 * Recomputes the slug `build-reference-content.ts` will assign to a method, so
 * collisions are caught here (and reported by id) rather than silently dropped
 * by the build's first-wins dedup. Mirrors that script's `functionPrefix` /
 * slug logic, keyed on the nearest container (subcategory, else category).
 */
function functionSlug(
  name: string,
  category: string,
  subcategory: string | null,
  navigationPrefixes: NavigationPrefixes
): string {
  const key = subcategory ?? category
  const override = navigationPrefixes[key]
  const prefix = override === false ? null : typeof override === 'string' ? override : slugify(key)
  const nameLower = name.toLowerCase()
  return prefix === null ? nameLower : `${prefix}-${nameLower}`
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-')
}

export async function generateDartReferenceDump(): Promise<{ methodCount: number }> {
  const doc = parse(await readFile(YAML_PATH, 'utf-8')) as { functions: DartFunction[] }
  const sections = JSON.parse(await readFile(SECTIONS_PATH, 'utf-8')) as SectionNode[]
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8')) as {
    navigationPrefixes?: NavigationPrefixes
  }
  const navigationPrefixes = config.navigationPrefixes ?? {}
  const sectionMap = buildSectionMap(sections)

  let nextId = 1
  const children: unknown[] = []
  const slugOwners = new Map<string, string>()
  const skipped: string[] = []

  for (const fn of doc.functions) {
    if (SKIP_IDS.has(fn.id) || HEADER_IDS.has(fn.id)) continue

    const section = SECTION_OVERRIDE[fn.id] ?? sectionMap.get(fn.id)
    if (!section) {
      skipped.push(fn.id)
      continue
    }

    const name = NAME_OVERRIDE[fn.id] ?? deriveName(fn.title)
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      throw new Error(`Dart converter: id "${fn.id}" yielded an invalid method name "${name}"`)
    }

    const slug = functionSlug(name, section.category, section.subcategory, navigationPrefixes)
    const owner = slugOwners.get(slug)
    if (owner) {
      throw new Error(`Dart converter: ids "${owner}" and "${fn.id}" both map to slug "${slug}"`)
    }
    slugOwners.set(slug, fn.id)

    const blockTags = [textTag('@category', section.category)]
    if (section.subcategory) blockTags.push(textTag('@subcategory', section.subcategory))

    const content: Record<string, unknown> = {}
    if (fn.description) content.description = fn.description
    if (fn.notes) content.notes = fn.notes
    if (fn.params?.length) content.params = fn.params
    if (fn.examples?.length) content.examples = fn.examples

    children.push({
      id: nextId++,
      name,
      variant: 'declaration',
      kind: 2048,
      flags: {},
      comment: { summary: [], blockTags },
      content,
    })
  }

  const dump = {
    id: 0,
    name: 'supabase_flutter',
    variant: 'project',
    kind: 1,
    flags: {},
    children,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(dump, null, 2))

  if (skipped.length) {
    throw new Error(
      `Dart converter: ${skipped.length} ids have no section mapping (add them to ` +
        `common-client-libs-sections.json or SECTION_OVERRIDE): ${skipped.join(', ')}`
    )
  }

  console.log(
    `[dart/v2] wrote ${children.length} method declarations to ${OUT_PATH.replace(DOCS_DIR + '/', '')}`
  )

  return { methodCount: children.length }
}

// Only run when invoked as a script (via `tsx`); importing from a test must not
// trigger the side-effecting file write.
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDartReferenceDump().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
