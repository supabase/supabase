import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { AGENT_RESOURCES } from './lib/agent-resources'
import rewrites from './lib/rewrites'

const CANONICAL_ORIGIN = 'https://supabase.com'

const NOT_AGENT_RESOURCES: Record<string, string> = {
  'ard.json': 'the catalog itself',
  'api-catalog':
    'peer catalog (RFC 9727); its resources, the Management API spec and the MCP server, have their own entries',
  'ai-catalog.json': 'legacy ARD alias, rewritten to ard.json',
  'mcp-registry-auth': 'domain-ownership verification token',
  'openai-apps-challenge': 'domain-ownership verification token',
  'security.txt': 'vulnerability disclosure contact',
  vercel: 'Vercel toolbar dev tooling',
}

type ArdEntry = { identifier: string; url: string }

type LinksetLink = { href: string }
type LinksetMember = { anchor: string } & Record<string, string | LinksetLink[]>

const rewriteSources: string[] = rewrites.map((rewrite: { source: string }) => rewrite.source)

async function loadArdCatalog(): Promise<{ entries: ArdEntry[] }> {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'public', '.well-known', 'ard.json'),
    'utf-8'
  )
  return JSON.parse(raw)
}

async function loadApiCatalog(): Promise<{ linkset: LinksetMember[] }> {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'public', '.well-known', 'api-catalog'),
    'utf-8'
  )
  return JSON.parse(raw)
}

function wellKnownRewriteSources(): string[] {
  return rewriteSources
    .filter((source) => source.startsWith('/.well-known/'))
    .map((source) => source.replace('/.well-known/', ''))
}

function sameOriginPathname(url: string): string | null {
  const parsed = new URL(url)
  return parsed.origin === CANONICAL_ORIGIN ? parsed.pathname : null
}

function docsGuideSource(pathname: string): string | null {
  const prefix = '/docs/guides/'
  if (!pathname.startsWith(prefix)) return null
  return path.join(
    process.cwd(),
    '..',
    'docs',
    'content',
    'guides',
    `${pathname.slice(prefix.length)}.mdx`
  )
}

function resolvesLocally(pathname: string): boolean {
  const publicFile = path.join(process.cwd(), 'public', pathname)
  const appRoute = path.join(process.cwd(), 'app', pathname, 'route.ts')
  const docsGuide = docsGuideSource(pathname)
  return (
    existsSync(publicFile) ||
    existsSync(appRoute) ||
    rewriteSources.includes(pathname) ||
    (docsGuide !== null && existsSync(docsGuide))
  )
}

const RESOLVES_TO = 'a file in public/, an app route, a rewrite source, or a docs guide'

describe('agent discovery catalog (.well-known/ard.json)', () => {
  it('every .well-known surface is cataloged or explicitly marked as not an agent resource', async () => {
    const { entries } = await loadArdCatalog()
    const catalogedUrls = entries.map((entry) => entry.url)

    const wellKnownDir = path.join(process.cwd(), 'public', '.well-known')
    const dirents = await fs.readdir(wellKnownDir, { withFileTypes: true })
    const surfaces = [...dirents.map((dirent) => dirent.name), ...wellKnownRewriteSources()]

    expect(surfaces.length).toBeGreaterThan(0)

    for (const surface of surfaces) {
      if (surface in NOT_AGENT_RESOURCES) continue
      const cataloged = catalogedUrls.some((url) =>
        url.startsWith(`${CANONICAL_ORIGIN}/.well-known/${surface}`)
      )
      expect(
        cataloged,
        `new .well-known surface "${surface}": add an entry for it to public/.well-known/ard.json, or add it to NOT_AGENT_RESOURCES in this test with the reason it doesn't belong in the catalog`
      ).toBe(true)
    }
  })

  it('every same-origin catalog entry resolves to a public file, app route, or rewrite', async () => {
    const { entries } = await loadArdCatalog()
    expect(entries.length).toBeGreaterThan(0)

    for (const entry of entries) {
      const pathname = sameOriginPathname(entry.url)
      if (pathname === null) continue
      expect(
        resolvesLocally(pathname),
        `ard.json entry "${entry.identifier}" points at ${entry.url}, but ${pathname} is not ${RESOLVES_TO}: the catalog is advertising a dead URL`
      ).toBe(true)
    }
  })
})

describe('API catalog (.well-known/api-catalog)', () => {
  it('lists every described API as a catalog item and describes every listed item', async () => {
    const [catalog, ...apis] = (await loadApiCatalog()).linkset
    expect(catalog.anchor).toBe(`${CANONICAL_ORIGIN}/.well-known/api-catalog`)

    const itemHrefs = (catalog.item as LinksetLink[]).map((link) => link.href).sort()
    const apiAnchors = apis.map((api) => api.anchor).sort()
    expect(apiAnchors.length).toBeGreaterThan(0)
    expect(itemHrefs).toEqual(apiAnchors)
  })

  it('every same-origin link resolves to a public file, app route, rewrite, or docs guide', async () => {
    const { linkset } = await loadApiCatalog()
    const hrefs = linkset.flatMap((member) =>
      Object.entries(member).flatMap(([relation, value]) =>
        relation === 'anchor'
          ? [value as string]
          : (value as LinksetLink[]).map((link) => link.href)
      )
    )
    expect(hrefs.length).toBeGreaterThan(0)

    for (const href of hrefs) {
      const pathname = sameOriginPathname(href)
      if (pathname === null) continue
      expect(
        resolvesLocally(pathname),
        `api-catalog links to ${href}, but ${pathname} is not ${RESOLVES_TO}`
      ).toBe(true)
    }
  })
})

describe('llms.txt agent resources', () => {
  it('every same-origin resource resolves to a public file, app route, rewrite, or docs guide', () => {
    expect(AGENT_RESOURCES.length).toBeGreaterThan(0)

    for (const resource of AGENT_RESOURCES) {
      const pathname = sameOriginPathname(resource.url)
      if (pathname === null) continue
      expect(
        resolvesLocally(pathname),
        `llms.txt lists ${resource.url}, but ${pathname} is not ${RESOLVES_TO}`
      ).toBe(true)
    }
  })
})
