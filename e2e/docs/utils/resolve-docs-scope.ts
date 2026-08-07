import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'

import { normalizeRepoPath } from '../../shared/paths.ts'

/**
 * Federated guide section prefixes — mirrors
 * apps/docs/scripts/federated-content/sources/*.ts. Checked automatically
 * against those files by assertFederatedSectionsInSync below.
 */
export const FEDERATED_SECTIONS = [
  'graphql',
  'database/extensions/wrappers',
  'ai/python',
  'deployment/terraform',
  'deployment/ci',
] as const

export const MAX_SCOPED_PAGES = 20

const GUIDES_PREFIX = 'apps/docs/content/guides/'
const TROUBLESHOOTING_PREFIX = 'apps/docs/content/troubleshooting/'
const PARTIALS_PREFIX = 'apps/docs/content/_partials/'
const DOCS_GUIDES_URL_PREFIX = '/docs/guides/'
const DOCS_TROUBLESHOOTING_URL_PREFIX = '/docs/guides/troubleshooting/'
const FEDERATED_CONTENT_SOURCES_DIR = 'apps/docs/scripts/federated-content/sources'

const PARTIAL_PATH_RE = /<\$Partial\b[\s\S]*?\bpath\s*=\s*"([^"]+)"[\s\S]*?\/?>/g
const SOURCE_SECTION_RE = /\bsection:\s*'([^']+)'/g

/**
 * Compares FEDERATED_SECTIONS against the `section:` field declared in each
 * apps/docs/scripts/federated-content/sources/*.ts file, so a section added
 * or removed there can't silently drift from what this suite treats as
 * out-of-scope.
 */
async function assertFederatedSectionsInSync(repoRoot: string): Promise<void> {
  const sourcesDir = join(repoRoot, FEDERATED_CONTENT_SOURCES_DIR)
  const sourceFiles = (await readdir(sourcesDir)).filter((file) => file.endsWith('.ts'))

  const actualSections = new Set<string>()
  for (const file of sourceFiles) {
    const source = await readFile(join(sourcesDir, file), 'utf8')
    const matches = [...source.matchAll(SOURCE_SECTION_RE)].map((match) => match[1])
    const distinctMatches = new Set(matches)

    if (distinctMatches.size > 1) {
      throw new Error(
        `${FEDERATED_CONTENT_SOURCES_DIR}/${file} declares multiple distinct 'section:' ` +
          `values (${[...distinctMatches].join(', ')}); expected exactly one per source file.`
      )
    }
    if (distinctMatches.size === 1) actualSections.add(matches[0])
  }

  const expectedSections = new Set<string>(FEDERATED_SECTIONS)
  const missing = [...actualSections].filter((section) => !expectedSections.has(section))
  const stale = [...expectedSections].filter((section) => !actualSections.has(section))

  if (missing.length > 0 || stale.length > 0) {
    const details = [
      missing.length > 0 ? `missing from FEDERATED_SECTIONS: ${missing.join(', ')}` : null,
      stale.length > 0 ? `no longer a federated-content source: ${stale.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ')
    throw new Error(
      `FEDERATED_SECTIONS in e2e/docs/utils/resolve-docs-scope.ts is out of sync with ` +
        `${FEDERATED_CONTENT_SOURCES_DIR}/*.ts (${details}). Update FEDERATED_SECTIONS to match.`
    )
  }
}

export type ResolveDocsScopeOptions = {
  /** Repo-root-relative changed file paths */
  changedFiles: string[]
  /** Absolute path to the monorepo root */
  repoRoot: string
  /** Max pages to test before the rest are truncated (default MAX_SCOPED_PAGES) */
  maxPages?: number
}

export type ResolveDocsScopeResult = {
  pages: string[]
  skip: boolean
}

function isFederatedGuideSlug(slug: string): boolean {
  return FEDERATED_SECTIONS.some((section) => slug === section || slug.startsWith(`${section}/`))
}

function isHiddenMdx(filePath: string): boolean {
  return basename(filePath).startsWith('_')
}

/**
 * Map a changed content file to a docs URL, or null if not a testable page.
 */
export function changedFileToPagePath(filePath: string): string | null {
  const normalized = normalizeRepoPath(filePath)

  if (normalized.startsWith(GUIDES_PREFIX) && normalized.endsWith('.mdx')) {
    if (isHiddenMdx(normalized)) return null
    const slug = normalized.slice(GUIDES_PREFIX.length, -'.mdx'.length)
    if (!slug || isFederatedGuideSlug(slug)) return null
    return `${DOCS_GUIDES_URL_PREFIX}${slug}`
  }

  if (normalized.startsWith(TROUBLESHOOTING_PREFIX) && normalized.endsWith('.mdx')) {
    if (isHiddenMdx(normalized)) return null
    const slug = basename(normalized, '.mdx')
    return `${DOCS_TROUBLESHOOTING_URL_PREFIX}${slug}`
  }

  return null
}

function partialRelPathFromChangedFile(filePath: string): string | null {
  const normalized = normalizeRepoPath(filePath)
  if (!normalized.startsWith(PARTIALS_PREFIX) || !normalized.endsWith('.mdx')) {
    return null
  }
  if (normalized.includes('/_fixtures/')) return null
  const rel = normalized.slice(PARTIALS_PREFIX.length)
  if (!rel || basename(rel).startsWith('_')) return null
  return rel
}

function normalizePartialRef(pathAttr: string): string | null {
  // $Partial paths are relative to content/_partials (see Partial.ts).
  // Leading-slash example-code paths are not real partials.
  if (!pathAttr || pathAttr.startsWith('/') || pathAttr.startsWith('http')) {
    return null
  }
  if (!pathAttr.endsWith('.md') && !pathAttr.endsWith('.mdx')) {
    return null
  }
  return normalizeRepoPath(pathAttr).replace(/^\.\//, '')
}

function extractPartialRefs(source: string): string[] {
  const refs: string[] = []
  PARTIAL_PATH_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = PARTIAL_PATH_RE.exec(source)) !== null) {
    const normalized = normalizePartialRef(match[1])
    if (normalized) refs.push(normalized)
  }
  return refs
}

async function walkMdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue
      files.push(...(await walkMdxFiles(fullPath)))
      continue
    }
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.mdx')) continue
    if (entry.name.startsWith('_')) continue
    files.push(fullPath)
  }

  return files
}

type PartialIndex = {
  /** partial rel path → set of partial rel paths that include it */
  includedByPartials: Map<string, Set<string>>
  /** page URL → set of direct partial rel paths */
  pagePartials: Map<string, Set<string>>
}

async function buildPartialIndex(repoRoot: string): Promise<PartialIndex> {
  const includedByPartials = new Map<string, Set<string>>()
  const pagePartials = new Map<string, Set<string>>()

  const partialsDir = join(repoRoot, 'apps/docs/content/_partials')
  const guidesDir = join(repoRoot, 'apps/docs/content/guides')
  const troubleshootingDir = join(repoRoot, 'apps/docs/content/troubleshooting')

  const [partialFiles, guideFiles, troubleshootingFiles] = await Promise.all([
    walkMdxFiles(partialsDir).catch(() => [] as string[]),
    walkMdxFiles(guidesDir).catch(() => [] as string[]),
    walkMdxFiles(troubleshootingDir).catch(() => [] as string[]),
  ])

  for (const file of partialFiles) {
    const rel = normalizeRepoPath(relative(partialsDir, file))
    const source = await readFile(file, 'utf8')
    for (const ref of extractPartialRefs(source)) {
      let parents = includedByPartials.get(ref)
      if (!parents) {
        parents = new Set()
        includedByPartials.set(ref, parents)
      }
      parents.add(rel)
    }
  }

  for (const file of guideFiles) {
    const relFromGuides = normalizeRepoPath(relative(guidesDir, file)).replace(/\.mdx$/, '')
    if (isFederatedGuideSlug(relFromGuides)) continue
    const pagePath = `${DOCS_GUIDES_URL_PREFIX}${relFromGuides}`
    const source = await readFile(file, 'utf8')
    const refs = extractPartialRefs(source)
    if (refs.length > 0) pagePartials.set(pagePath, new Set(refs))
  }

  for (const file of troubleshootingFiles) {
    const slug = basename(file, '.mdx')
    const pagePath = `${DOCS_TROUBLESHOOTING_URL_PREFIX}${slug}`
    const source = await readFile(file, 'utf8')
    const refs = extractPartialRefs(source)
    if (refs.length > 0) pagePartials.set(pagePath, new Set(refs))
  }

  return { includedByPartials, pagePartials }
}

/**
 * Expand a changed partial to all partials that transitively include it
 * (including itself).
 */
function expandPartialClosure(
  seed: string,
  includedByPartials: Map<string, Set<string>>
): Set<string> {
  const result = new Set<string>([seed])
  const queue = [seed]

  while (queue.length > 0) {
    const current = queue.pop()!
    const parents = includedByPartials.get(current)
    if (!parents) continue
    for (const parent of parents) {
      if (result.has(parent)) continue
      result.add(parent)
      queue.push(parent)
    }
  }

  return result
}

function pagesUsingPartials(
  targetPartials: Set<string>,
  pagePartials: Map<string, Set<string>>
): string[] {
  const pages: string[] = []
  for (const [page, refs] of pagePartials) {
    for (const ref of refs) {
      if (targetPartials.has(ref)) {
        pages.push(page)
        break
      }
    }
  }
  return pages
}

/**
 * Resolve which docs pages to E2E-test from a list of changed repo files.
 * Truncates to maxPages (sorted) so a widely shared partial can't blow up
 * runtime; use resolveAllDocsPages / `pnpm e2e:docs:all` to cover everything.
 */
export async function resolveDocsScope(
  options: ResolveDocsScopeOptions
): Promise<ResolveDocsScopeResult> {
  await assertFederatedSectionsInSync(options.repoRoot)

  const maxPages = options.maxPages ?? MAX_SCOPED_PAGES
  const pages = new Set<string>()
  const changedPartials: string[] = []

  for (const file of options.changedFiles) {
    const page = changedFileToPagePath(file)
    if (page) {
      pages.add(page)
      continue
    }
    const partial = partialRelPathFromChangedFile(file)
    if (partial) changedPartials.push(partial)
  }

  if (changedPartials.length > 0) {
    const index = await buildPartialIndex(options.repoRoot)
    const targets = new Set<string>()
    for (const partial of changedPartials) {
      for (const expanded of expandPartialClosure(partial, index.includedByPartials)) {
        targets.add(expanded)
      }
    }
    for (const page of pagesUsingPartials(targets, index.pagePartials)) {
      pages.add(page)
    }
  }

  const sorted = [...pages].sort().slice(0, maxPages)

  return {
    pages: sorted,
    skip: sorted.length === 0,
  }
}

/**
 * List every in-scope docs page — all guides (excluding federated sections)
 * and all troubleshooting entries — regardless of what changed. Used for
 * full-suite runs rather than the default changed-files scope.
 */
export async function resolveAllDocsPages(repoRoot: string): Promise<string[]> {
  await assertFederatedSectionsInSync(repoRoot)

  const guidesDir = join(repoRoot, 'apps/docs/content/guides')
  const troubleshootingDir = join(repoRoot, 'apps/docs/content/troubleshooting')

  const [guideFiles, troubleshootingFiles] = await Promise.all([
    walkMdxFiles(guidesDir).catch(() => [] as string[]),
    walkMdxFiles(troubleshootingDir).catch(() => [] as string[]),
  ])

  const pages = new Set<string>()

  for (const file of guideFiles) {
    const relFromGuides = normalizeRepoPath(relative(guidesDir, file)).replace(/\.mdx$/, '')
    if (isFederatedGuideSlug(relFromGuides)) continue
    pages.add(`${DOCS_GUIDES_URL_PREFIX}${relFromGuides}`)
  }

  for (const file of troubleshootingFiles) {
    const slug = basename(file, '.mdx')
    pages.add(`${DOCS_TROUBLESHOOTING_URL_PREFIX}${slug}`)
  }

  return [...pages].sort()
}
