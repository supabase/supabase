import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, sep } from 'node:path'

/**
 * Federated guide section prefixes — mirrors
 * apps/docs/scripts/federated-content/sources/*.ts
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

const PARTIAL_PATH_RE = /<\$Partial\b[\s\S]*?\bpath\s*=\s*"([^"]+)"[\s\S]*?\/?>/g

export type ResolveDocsScopeOptions = {
  /** Repo-root-relative changed file paths */
  changedFiles: string[]
  /** Absolute path to the monorepo root */
  repoRoot: string
  /** Max pages before failing (default MAX_SCOPED_PAGES) */
  maxPages?: number
}

export type ResolveDocsScopeResult = {
  pages: string[]
  skip: boolean
}

function normalizeRepoPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
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
 */
export async function resolveDocsScope(
  options: ResolveDocsScopeOptions
): Promise<ResolveDocsScopeResult> {
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

  const sorted = [...pages].sort()
  if (sorted.length > maxPages) {
    throw new Error(
      `Docs E2E scope resolved ${sorted.length} pages (max ${maxPages}). ` +
        `Narrow the PR or raise MAX_SCOPED_PAGES. First pages: ${sorted.slice(0, 10).join(', ')}…`
    )
  }

  return {
    pages: sorted,
    skip: sorted.length === 0,
  }
}

/** Parse changed-file list from stdin or newline/comma-separated string. */
export function parseChangedFilesList(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeRepoPath(line.split(sep).join('/')))
}
