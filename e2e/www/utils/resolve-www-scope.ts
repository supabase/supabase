import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { normalizeRepoPath } from '../../shared/paths.ts'

const DATE_PREFIX_LENGTH = 11

export const MAX_SCOPED_PAGES = 20

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/
const DISABLE_PAGE_BUILD_RE = /^\s*disable_page_build:\s*true\s*$/m

const CONTENT_SOURCES = [
  { dir: 'apps/www/_blog', urlPrefix: '/blog/', datePrefixed: true },
  { dir: 'apps/www/_events', urlPrefix: '/events/', datePrefixed: true },
  { dir: 'apps/www/_customers', urlPrefix: '/customers/', datePrefixed: false },
  { dir: 'apps/www/_alternatives', urlPrefix: '/alternatives/', datePrefixed: false },
] as const

export type ResolveWwwScopeOptions = {
  changedFiles: string[]
  repoRoot: string
  maxPages?: number
}

export function changedFileToPagePath(filePath: string): string | null {
  const normalized = normalizeRepoPath(filePath)
  if (!normalized.endsWith('.mdx')) return null

  for (const { dir, urlPrefix, datePrefixed } of CONTENT_SOURCES) {
    if (!normalized.startsWith(`${dir}/`)) continue

    const filename = normalized.slice(dir.length + 1)
    if (filename.includes('/')) return null

    const name = basename(filename, '.mdx')
    const slug = datePrefixed ? name.substring(DATE_PREFIX_LENGTH) : name
    return slug ? `${urlPrefix}${slug}` : null
  }

  return null
}

async function isPageBuilt(absolutePath: string): Promise<boolean> {
  const source = await readFile(absolutePath, 'utf8').catch(() => '')
  const frontmatter = FRONTMATTER_RE.exec(source)?.[1]
  return !frontmatter || !DISABLE_PAGE_BUILD_RE.test(frontmatter)
}

export async function resolveWwwScope(options: ResolveWwwScopeOptions) {
  const pages = new Set<string>()

  for (const file of options.changedFiles) {
    const page = changedFileToPagePath(file)
    if (page && (await isPageBuilt(join(options.repoRoot, file)))) {
      pages.add(page)
    }
  }

  const sorted = [...pages].sort().slice(0, options.maxPages ?? MAX_SCOPED_PAGES)

  return { pages: sorted, skip: sorted.length === 0 }
}

export async function resolveAllWwwPages(repoRoot: string): Promise<string[]> {
  const pages = new Set<string>()

  for (const { dir, urlPrefix, datePrefixed } of CONTENT_SOURCES) {
    const absoluteDir = join(repoRoot, dir)
    const entries = await readdir(absoluteDir, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue
      if (!(await isPageBuilt(join(absoluteDir, entry.name)))) continue

      const name = basename(entry.name, '.mdx')
      const slug = datePrefixed ? name.substring(DATE_PREFIX_LENGTH) : name
      if (slug) pages.add(`${urlPrefix}${slug}`)
    }
  }

  return [...pages].sort()
}
