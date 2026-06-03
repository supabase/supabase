import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Site, SiteFileEntry, SiteFileInput, SiteTlsMode, SitesRegistry } from './types'

/** Site slugs double as folder names and nginx file names, so keep them strict. */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/
const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+$/
const TLS_MODES: SiteTlsMode[] = ['off', 'acme', 'byo']

const REGISTRY_DIR = '.hosting'
const REGISTRY_FILE = 'sites.json'

const DEFAULT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>It works</title>
  </head>
  <body>
    <h1>Your site is live</h1>
    <p>Upload your build output to replace this page.</p>
  </body>
</html>
`

/** Deterministic, UUID-formatted id from a slug (see edge functions' getStableFunctionId). */
export function getStableSiteId(slug: string): string {
  const hex = createHash('sha256').update(`site:${slug}`).digest('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

export type CreateSiteInput = {
  slug: string
  domain: string
  docroot?: string
  spaFallback?: boolean
  tls?: SiteTlsMode
  apiProxy?: boolean
}

export type UpdateSiteInput = Partial<Omit<CreateSiteInput, 'slug'>>

export class FileSystemSitesStore {
  private readonly registryPath: string

  constructor(private rootPath: string) {
    this.registryPath = path.join(rootPath, REGISTRY_DIR, REGISTRY_FILE)
  }

  // --- path safety -----------------------------------------------------------

  private resolveDocroot(docroot: string): string {
    const base = path.resolve(this.rootPath)
    const target = path.resolve(base, docroot)
    if (target === base || !target.startsWith(base + path.sep)) {
      throw new Error('Resolved docroot escapes the hosting root')
    }
    return target
  }

  private resolveWithinDocroot(docroot: string, relativePath: string): string {
    const docrootPath = this.resolveDocroot(docroot)
    const target = path.resolve(docrootPath, relativePath)
    if (target !== docrootPath && !target.startsWith(docrootPath + path.sep)) {
      throw new Error('Resolved path escapes the site docroot')
    }
    return target
  }

  // --- registry --------------------------------------------------------------

  private async readRegistry(): Promise<SitesRegistry> {
    try {
      const contents = await readFile(this.registryPath, 'utf8')
      const parsed = JSON.parse(contents)
      return { sites: Array.isArray(parsed?.sites) ? parsed.sites : [] }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { sites: [] }
      throw error
    }
  }

  private async writeRegistry(registry: SitesRegistry): Promise<void> {
    await mkdir(path.dirname(this.registryPath), { recursive: true })
    const tmp = `${this.registryPath}.tmp`
    await writeFile(tmp, JSON.stringify(registry, null, 2), 'utf8')
    await rename(tmp, this.registryPath)
  }

  async listSites(): Promise<Site[]> {
    const { sites } = await this.readRegistry()
    return sites
  }

  async getSite(slug: string): Promise<Site | undefined> {
    const { sites } = await this.readRegistry()
    return sites.find((site) => site.slug === slug)
  }

  async createSite(input: CreateSiteInput): Promise<Site> {
    if (!SLUG_REGEX.test(input.slug)) {
      throw new Error('Invalid slug — use lowercase letters, numbers and hyphens')
    }
    if (!DOMAIN_REGEX.test(input.domain)) {
      throw new Error('Invalid domain')
    }
    const tls = TLS_MODES.includes(input.tls as SiteTlsMode) ? (input.tls as SiteTlsMode) : 'off'
    const docroot = input.docroot ?? input.slug
    if (docroot.includes('..')) throw new Error('Invalid docroot')

    const registry = await this.readRegistry()
    if (registry.sites.some((site) => site.slug === input.slug)) {
      throw new Error(`A site with slug "${input.slug}" already exists`)
    }

    // Create the docroot with a placeholder page if it has no content yet.
    const docrootPath = this.resolveDocroot(docroot)
    await mkdir(docrootPath, { recursive: true })
    const existing = await readdir(docrootPath)
    if (existing.length === 0) {
      await writeFile(path.join(docrootPath, 'index.html'), DEFAULT_INDEX_HTML, 'utf8')
    }

    const now = Date.now()
    const site: Site = {
      id: getStableSiteId(input.slug),
      slug: input.slug,
      domain: input.domain,
      docroot,
      spaFallback: input.spaFallback !== false,
      tls,
      apiProxy: input.apiProxy === true,
      created_at: now,
      updated_at: now,
    }

    registry.sites.push(site)
    await this.writeRegistry(registry)
    return site
  }

  async updateSite(slug: string, patch: UpdateSiteInput): Promise<Site> {
    const registry = await this.readRegistry()
    const index = registry.sites.findIndex((site) => site.slug === slug)
    if (index === -1) throw new Error('Site not found')

    const current = registry.sites[index]
    if (patch.domain !== undefined && !DOMAIN_REGEX.test(patch.domain)) {
      throw new Error('Invalid domain')
    }
    if (patch.tls !== undefined && !TLS_MODES.includes(patch.tls)) {
      throw new Error('Invalid TLS mode')
    }

    const updated: Site = {
      ...current,
      domain: patch.domain ?? current.domain,
      spaFallback: patch.spaFallback ?? current.spaFallback,
      tls: patch.tls ?? current.tls,
      apiProxy: patch.apiProxy ?? current.apiProxy,
      updated_at: Date.now(),
    }

    registry.sites[index] = updated
    await this.writeRegistry(registry)
    return updated
  }

  async deleteSite(slug: string): Promise<Site | undefined> {
    const registry = await this.readRegistry()
    const site = registry.sites.find((s) => s.slug === slug)
    if (!site) return undefined

    registry.sites = registry.sites.filter((s) => s.slug !== slug)
    await this.writeRegistry(registry)

    // Remove the docroot from disk.
    await rm(this.resolveDocroot(site.docroot), { recursive: true, force: true })
    return site
  }

  // --- files -----------------------------------------------------------------

  async listFiles(docroot: string): Promise<SiteFileEntry[]> {
    const docrootPath = this.resolveDocroot(docroot)
    let entries
    try {
      entries = await readdir(docrootPath, { recursive: true, withFileTypes: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }

    return Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const absolutePath = path.join(entry.parentPath, entry.name)
          const fileStat = await stat(absolutePath)
          return {
            relativePath: path.relative(docrootPath, absolutePath),
            size: fileStat.size,
          }
        })
    )
  }

  async readFile(docroot: string, relativePath: string): Promise<string> {
    return readFile(this.resolveWithinDocroot(docroot, relativePath), 'utf8')
  }

  /** Writes files into the docroot. When `replace` is true the docroot is cleared first. */
  async writeFiles(
    docroot: string,
    files: SiteFileInput[],
    { replace = false }: { replace?: boolean } = {}
  ): Promise<void> {
    const docrootPath = this.resolveDocroot(docroot)

    if (replace) {
      await rm(docrootPath, { recursive: true, force: true })
    }
    await mkdir(docrootPath, { recursive: true })

    for (const file of files) {
      const target = this.resolveWithinDocroot(docroot, file.name)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, file.content)
    }
  }

  async deleteFile(docroot: string, relativePath: string): Promise<void> {
    await rm(this.resolveWithinDocroot(docroot, relativePath), { force: true })
  }
}
