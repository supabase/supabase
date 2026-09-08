import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import rewrites from './lib/rewrites'

const CANONICAL_ORIGIN = 'https://supabase.com'

const NOT_AGENT_RESOURCES: Record<string, string> = {
  'ard.json': 'the catalog itself',
  'api-catalog':
    'peer catalog (RFC 9727); its resource, the Management API spec, has its own entry',
  'ai-catalog.json': 'legacy ARD alias, rewritten to ard.json',
  'mcp-registry-auth': 'domain-ownership verification token',
  'openai-apps-challenge': 'domain-ownership verification token',
  'security.txt': 'vulnerability disclosure contact',
  vercel: 'Vercel toolbar dev tooling',
}

type ArdEntry = { identifier: string; url: string }

async function loadArdCatalog(): Promise<{ entries: ArdEntry[] }> {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'public', '.well-known', 'ard.json'),
    'utf-8'
  )
  return JSON.parse(raw)
}

function wellKnownRewriteSources(): string[] {
  return rewrites
    .map((rewrite: { source: string }) => rewrite.source)
    .filter((source: string) => source.startsWith('/.well-known/'))
    .map((source: string) => source.replace('/.well-known/', ''))
}

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

    const rewriteSources = rewrites.map((rewrite: { source: string }) => rewrite.source)

    for (const entry of entries) {
      const url = new URL(entry.url)
      if (url.origin !== CANONICAL_ORIGIN) continue

      const publicFile = path.join(process.cwd(), 'public', url.pathname)
      const appRoute = path.join(process.cwd(), 'app', url.pathname, 'route.ts')
      const resolves =
        existsSync(publicFile) || existsSync(appRoute) || rewriteSources.includes(url.pathname)
      expect(
        resolves,
        `ard.json entry "${entry.identifier}" points at ${entry.url}, but ${url.pathname} is not a file in public/, an app route, or a rewrite source — the catalog is advertising a dead URL`
      ).toBe(true)
    }
  })
})
