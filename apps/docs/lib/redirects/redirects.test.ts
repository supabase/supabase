import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { GUIDES_DIRECTORY } from '../docs'
import { dynamicRedirects } from './dynamic-redirects.js'
import staticRedirects from './static-redirects.json'

// Some guides are dedicated Next.js routes rather than MDX files
const GUIDE_ROUTES_DIRECTORY = join(import.meta.dirname, '..', '..', 'app', 'guides')

// Guides fetched from external repos at build time (gitignored, see .gitignore), so their
// files are absent from a fresh checkout and cannot be checked here
const FEDERATED_GUIDES = ['graphql', 'deployment/terraform', 'deployment/ci']

type Redirect = { source: string; destination: string }

const allRedirects: Redirect[] = [...staticRedirects, ...dynamicRedirects]

const redirectsBySource = new Map(allRedirects.map((r) => [r.source, r.destination]))

describe('docs redirects', () => {
  it('has no redirect loops', () => {
    const loops = allRedirects
      // Keep redirects whose source, when followed hop by hop, revisits a URL it already
      // passed through (e.g. /a -> /b -> /a, or /a -> /a)
      .filter(({ source }) => {
        const seen = new Set<string>()
        let current: string | undefined = source
        while (current !== undefined) {
          if (seen.has(current)) return true
          seen.add(current)
          current = redirectsBySource.get(current)
        }
        return false
      })
      // Format as "source -> destination" so a failure shows the offending redirect
      .map((r) => `${r.source} -> ${r.destination}`)

    expect(loops).toEqual([])
  })

  it('has no redirect chains', () => {
    const chains = allRedirects
      // Keep redirects whose destination is itself the source of another redirect
      // (/a -> /b, /b -> /c), which costs the visitor an extra hop
      .filter((r) => redirectsBySource.has(r.destination))
      // Format as the full chain: "source -> destination -> next destination"
      .map((r) => `${r.source} -> ${r.destination} -> ${redirectsBySource.get(r.destination)}`)

    expect(chains).toEqual([])
  })

  it('points static guide redirects at pages that exist', () => {
    const prefix = '/docs/guides/'
    const missing = staticRedirects
      // Only check internal guide destinations (external URLs and reference pages are skipped)
      .filter((r) => r.destination.startsWith(prefix))
      // Skip federated guides, whose content is not in the repo
      .filter((r) => {
        const path = r.destination.slice(prefix.length)
        return !FEDERATED_GUIDES.some((guide) => path === guide || path.startsWith(`${guide}/`))
      })
      // Keep redirects whose destination has no page: strip the query/hash, then look for
      // guides/<path>.mdx, guides/<path>/index.mdx, or an app/guides/<path>/page.tsx route
      .filter((r) => {
        const path = r.destination.slice(prefix.length).split(/[?#]/)[0].replace(/\/$/, '')
        const mdxBase = join(GUIDES_DIRECTORY, path)
        const routeDir = join(GUIDE_ROUTES_DIRECTORY, path)
        return (
          !existsSync(`${mdxBase}.mdx`) &&
          !existsSync(join(mdxBase, 'index.mdx')) &&
          !existsSync(join(routeDir, 'page.tsx'))
        )
      })
      // Format as "source -> destination" so a failure shows the broken redirect
      .map((r) => `${r.source} -> ${r.destination}`)

    expect(missing).toEqual([])
  })

  it('uses valid sources and destinations', () => {
    const isValidLocation = (value: string) => value.startsWith('/') || value.startsWith('https://')

    const invalid = allRedirects
      // Keep redirects where the source or destination starts with neither "/" nor "https://"
      .filter((r) => !isValidLocation(r.source) || !isValidLocation(r.destination))
      .map((r) => `${r.source} -> ${r.destination}`)
    // Keep redirects with an anchor ("#") in the source; anchors never reach the server,
    // so such a redirect can never match
    const anchorSources = allRedirects.filter((r) => r.source.includes('#')).map((r) => r.source)

    expect(invalid).toEqual([])
    expect(anchorSources).toEqual([])
  })
})
