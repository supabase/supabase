import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import staticRedirects from '../redirects/static-redirects.json'

const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
) as { redirects: { source: string }[] }

type Redirect = { source: string; destination: string }

/**
 * A destination on this site gets a generated `.md` variant, so it must be a plain `/kb/` path
 * (no query, fragment, or trailing slash). Any other destination, such as a path on another app
 * (`/docs/...`) or an `https://` URL, only needs to be well formed.
 */
const isValidDestination = (destination: string) =>
  destination.startsWith('/kb/')
    ? /^\/kb\/[^?#]*[^/?#]$/.test(destination)
    : /^(\/(?!\/)|https:\/\/)\S+$/.test(destination)

/**
 * Follows each destination through the other static sources. Only static-redirects.json is
 * walked.
 */
function findLoopsAndChains(redirects: Redirect[]) {
  const next = new Map(redirects.map((r) => [r.source, r.destination]))
  const loops: string[] = []
  const chains: string[] = []

  for (const { source } of redirects) {
    const path = [source]
    let destination = next.get(source)
    while (destination && !path.includes(destination)) {
      path.push(destination)
      destination = next.get(destination)
    }

    // Still set means the walk stopped on a page it had already visited.
    if (destination) loops.push([...path, destination].join(' -> '))
    else if (path.length > 2) chains.push(`${path.join(' -> ')}. Point ${source} at ${path.at(-1)}`)
  }

  return { loops, chains }
}

describe('static redirects', () => {
  it('have a literal /kb/ source, a valid destination, and a boolean permanent flag', () => {
    for (const { source, destination, permanent } of staticRedirects) {
      // Bulk redirects match the source literally, so route syntax would never match. A fragment
      // is never sent to the server, and the query string is not part of the path Vercel matches,
      // so a source with `#` or `?` would never fire either.
      expect(source).toMatch(/^\/kb\/[^:*()\\#?]+$/)
      expect(isValidDestination(destination), `${source} -> ${destination}`).toBe(true)
      expect(typeof permanent).toBe('boolean')
    }
  })

  it('leave the .md variants to the generator', () => {
    for (const { source } of staticRedirects) {
      expect(source.endsWith('.md')).toBe(false)
    }
  })

  it('do not repeat a source, in this file or in vercel.json', () => {
    const sources = [...staticRedirects, ...vercelConfig.redirects].map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('do not loop back or chain into another static redirect', () => {
    expect(findLoopsAndChains(staticRedirects)).toEqual({ loops: [], chains: [] })
  })
})

describe('isValidDestination', () => {
  it.each([
    '/kb/troubleshooting/foo-94a76b',
    '/docs/guides/auth',
    '/docs/guides/auth?x=1#section',
    'https://supabase.com/blog/post',
    'https://example.com/a?b=c#d',
  ])('accepts %s', (destination) => {
    expect(isValidDestination(destination)).toBe(true)
  })

  it.each([
    'kb/troubleshooting/foo',
    'docs/guides/auth',
    '//example.com/path',
    'http://example.com/path',
    'https://',
    '/docs/guides/a b',
    '/kb/troubleshooting/foo/',
    '/kb/troubleshooting/foo#section',
    '/kb/troubleshooting/foo?x=1',
    '',
  ])('rejects %j', (destination) => {
    expect(isValidDestination(destination)).toBe(false)
  })
})

describe('findLoopsAndChains', () => {
  // Builds one redirect per hop: ('/kb/a', '/kb/b', '/kb/c') is a -> b and b -> c.
  const hops = (...paths: string[]): Redirect[] =>
    paths.slice(1).map((destination, i) => ({ source: paths[i], destination }))

  it('accepts redirects that each end on a real page', () => {
    const redirects = [...hops('/kb/a', '/kb/a-1'), ...hops('/kb/b', '/kb/b-1')]
    expect(findLoopsAndChains(redirects)).toEqual({ loops: [], chains: [] })
  })

  it.each([
    ['a redirect to itself', ['/kb/a', '/kb/a']],
    ['two redirects that point at each other', ['/kb/a', '/kb/b', '/kb/a']],
    ['a longer loop', ['/kb/a', '/kb/b', '/kb/c', '/kb/a']],
  ])('catches %s', (_, path) => {
    const { loops, chains } = findLoopsAndChains(hops(...path))
    // Every redirect in the cycle reports it, and the first message lists the whole cycle.
    expect(loops).toHaveLength(path.length - 1)
    expect(loops[0]).toBe(path.join(' -> '))
    expect(chains).toEqual([])
  })

  it('catches a chain and says where the first redirect should point', () => {
    const { loops, chains } = findLoopsAndChains(hops('/kb/a', '/kb/b', '/kb/c'))
    expect(loops).toEqual([])
    expect(chains).toEqual(['/kb/a -> /kb/b -> /kb/c. Point /kb/a at /kb/c'])
  })
})
