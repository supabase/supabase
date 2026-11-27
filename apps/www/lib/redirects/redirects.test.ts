import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match'
import { describe, expect, it } from 'vitest'

import redirects from './index.js'
import staticRedirects from './static-redirects.json'

const WWW_ROOT = join(import.meta.dirname, '..', '..')
const DOCS_GUIDES_DIRECTORY = join(WWW_ROOT, '..', 'docs', 'content', 'guides')

// Paths served by other zones (see lib/rewrites.js). Their pages are not in this app, so only
// /docs/guides destinations are checked, against the docs content.
const OTHER_ZONE_PREFIXES = [
  '/docs',
  '/dashboard',
  '/library',
  '/design-system',
  '/kb',
  '/evals',
  '/migrate',
  '/builderday',
]

// Guides fetched from external repos at build time, so their files are absent from a fresh checkout
const FEDERATED_GUIDES = ['graphql', 'deployment/terraform', 'deployment/ci']

// Generated at build time or fetched remotely, so they cannot be checked from a fresh checkout
const UNVERIFIABLE_PATTERNS = [/^\/rss\.xml$/, /^\/changelog-rss\.xml$/, /^\/sitemap_www\.xml$/]
const REMOTE_CONTENT_PREFIXES = ['/changelog/']

type Redirect = {
  source: string
  destination: string
  permanent: boolean
  has?: unknown[]
  missing?: unknown[]
}

const allRedirects = redirects as Redirect[]

// Redirects that apply to every visitor. Conditional rules (host or query) are left out so that,
// for example, the supabase.design host rule does not make every path look like a chain.
const unconditionalRedirects = allRedirects.filter((r) => !r.has && !r.missing)

const isExternal = (value: string) => value.startsWith('https://')

// Strip query and hash, and replace params (:slug, :path*, regex groups) with a sample segment, so
// a destination can be matched against other sources.
const toProbePath = (destination: string) =>
  destination
    .split(/[?#]/)[0]
    .replace(/:[A-Za-z0-9_]+(\([^)]*\))?[*+?]?/g, 'x')
    .replace(/(.)\/$/, '$1')

const matchesSource = (source: string, path: string) =>
  Boolean(getPathMatch(source, { strict: false, removeUnnamedParams: true })(path))

// Next serves the first matching rule, so follow the first match for a path.
const nextHop = (path: string): Redirect | undefined =>
  unconditionalRedirects.find((r) => matchesSource(r.source, path))

const format = (r: Redirect) => `${r.source} -> ${r.destination}`

describe('www redirects', () => {
  it('has no redirect loops', () => {
    const loops = unconditionalRedirects
      .filter((r) => !isExternal(r.destination))
      // Follow the redirect hop by hop and keep those that revisit a path they already passed
      // through (/a -> /b -> /a, or /a -> /a)
      .filter((r) => {
        const seen = new Set<string>([toProbePath(r.source)])
        let current: Redirect | undefined = r
        while (current && !isExternal(current.destination)) {
          const path = toProbePath(current.destination)
          if (seen.has(path)) return true
          seen.add(path)
          current = nextHop(path)
        }
        return false
      })
      .map(format)

    expect(loops).toEqual([])
  })

  it('has no redirect chains', () => {
    const chains = unconditionalRedirects
      .filter((r) => !isExternal(r.destination))
      // Keep redirects whose destination is itself redirected (/a -> /b, /b -> /c), which costs
      // the visitor an extra hop
      .filter((r) => nextHop(toProbePath(r.destination)))
      .map((r) => `${format(r)} -> ${nextHop(toProbePath(r.destination))!.destination}`)

    expect(chains).toEqual([])
  })

  it('has unique sources', () => {
    const seen = new Set<string>()
    const duplicates = allRedirects
      .filter((r) => !r.has && !r.missing)
      .filter((r) => (seen.has(r.source) ? true : (seen.add(r.source), false)))
      .map((r) => r.source)

    expect(duplicates).toEqual([])
  })

  it('uses valid sources and destinations', () => {
    const isValidLocation = (value: string) => value.startsWith('/') || isExternal(value)

    const invalid = allRedirects
      // Keep redirects where the source or destination starts with neither "/" nor "https://"
      .filter((r) => !isValidLocation(r.source) || !isValidLocation(r.destination))
      .map(format)
    // Anchors never reach the server, so a source with one can never match
    const anchorSources = allRedirects.filter((r) => r.source.includes('#')).map((r) => r.source)

    expect(invalid).toEqual([])
    expect(anchorSources).toEqual([])
  })

  it('keeps params, splats, regex and conditions out of the static file', () => {
    const notStatic = staticRedirects
      .filter(
        (r: Record<string, unknown>) =>
          /[:*()]/.test(r.source as string) ||
          /[:*()]/.test(r.destination as string) ||
          'has' in r ||
          'missing' in r
      )
      .map((r) => r.source)

    expect(notStatic).toEqual([])
  })

  it('points internal redirects at pages that exist', () => {
    const missing = allRedirects
      // Destinations with params depend on the incoming path, so they cannot be checked
      .filter((r) => !isExternal(r.destination) && !/[:*()]/.test(r.destination))
      .filter((r) => !pathExists(r.destination.split(/[?#]/)[0].replace(/(.)\/$/, '$1')))
      .map(format)

    expect(missing).toEqual([])
  })
})

// --- Destination lookup ---------------------------------------------------------------------

const exists = (...segments: string[]) => existsSync(join(WWW_ROOT, ...segments))

const slugsIn = (directory: string) =>
  existsSync(join(WWW_ROOT, directory))
    ? new Set(
        readdirSync(join(WWW_ROOT, directory))
          .filter((name) => /\.mdx?$/.test(name))
          // Entries are named <date>-<slug>.mdx or <slug>.mdx
          .map((name) => name.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}[-_]+/, ''))
      )
    : new Set<string>()

const COLLECTION_SLUGS = new Map<string, Set<string>>([
  ['blog', slugsIn('_blog')],
  ['customers', slugsIn('_customers')],
  ['events', slugsIn('_events')],
  ['alternatives', slugsIn('_alternatives')],
  [
    'features',
    new Set(
      [
        ...readFileSync(join(WWW_ROOT, 'data', 'features.tsx'), 'utf8').matchAll(
          /slug: '([^']+)'/g
        ),
      ].map((match) => match[1])
    ),
  ],
])

const isDynamicSegment = (name: string) => /^\[.+\]$/.test(name)
const stripExtension = (name: string) => name.replace(/\.(tsx|ts|mdx)$/, '')

// Walk app/ or pages/ for a route. Route groups ("(name)") do not add a segment, and a dynamic
// segment ("[slug]") matches any value unless `allowDynamic` is off.
function routeExists(
  root: 'app' | 'pages',
  segments: string[],
  allowDynamic = true,
  directory: string = root
): boolean {
  const [segment, ...rest] = segments
  const full = join(WWW_ROOT, directory)
  if (!existsSync(full)) return false

  const entries = readdirSync(full, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile()).map((e) => e.name)
  const matchesSegment = (name: string) =>
    name === segment || (allowDynamic && isDynamicSegment(name))

  if (segment === undefined) {
    return files.some((name) =>
      root === 'app' ? /^(page|route)\.(tsx|ts)$/.test(name) : /^index\.(tsx|ts|mdx)$/.test(name)
    )
  }

  // pages/<segment>.tsx or pages/[slug].tsx as the last segment
  if (
    root === 'pages' &&
    rest.length === 0 &&
    files.some((f) => matchesSegment(stripExtension(f)))
  ) {
    return true
  }

  return entries
    .filter((e) => e.isDirectory())
    .some((e) => {
      const next = join(directory, e.name)
      if (/^\(.+\)$/.test(e.name)) return routeExists(root, segments, allowDynamic, next)
      return matchesSegment(e.name) && routeExists(root, rest, allowDynamic, next)
    })
}

function guideExists(path: string) {
  const guide = path.replace(/^\/docs\/guides\//, '').replace(/\/$/, '')
  if (FEDERATED_GUIDES.some((g) => guide === g || guide.startsWith(`${g}/`))) return true
  return (
    existsSync(join(DOCS_GUIDES_DIRECTORY, `${guide}.mdx`)) ||
    existsSync(join(DOCS_GUIDES_DIRECTORY, guide, 'index.mdx')) ||
    // Some guides are dedicated Next.js routes in apps/docs/app/guides rather than MDX files
    existsSync(join(WWW_ROOT, '..', 'docs', 'app', 'guides', guide, 'page.tsx'))
  )
}

function pathExists(path: string): boolean {
  if (path === '/') return true
  if (UNVERIFIABLE_PATTERNS.some((p) => p.test(path))) return true
  if (REMOTE_CONTENT_PREFIXES.some((p) => path.startsWith(p))) return true

  if (path.startsWith('/docs/guides/')) return guideExists(path)
  if (OTHER_ZONE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true

  // Markdown twins: content/md/<path>, or the markdown version of an existing page
  if (path.endsWith('.md')) {
    const base = path.slice(0, -'.md'.length)
    return exists('content', 'md', path) || pathExists(base === '/index' ? '/' : base)
  }

  if (exists('public', path)) return true

  const segments = path.split('/').filter(Boolean)

  // Collection entries have a dynamic route, so check their slug against the content. A static
  // route with the same segments (for example /blog/tags) still counts.
  const [collection, slug] = segments
  const collectionSlugs = COLLECTION_SLUGS.get(collection)
  if (segments.length === 2 && collectionSlugs) {
    return (
      collectionSlugs.has(slug) ||
      routeExists('app', segments, false) ||
      routeExists('pages', segments, false)
    )
  }

  return routeExists('app', segments) || routeExists('pages', segments)
}
