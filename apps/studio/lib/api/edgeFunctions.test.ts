import { describe, expect, it } from 'vitest'

import {
  buildDatabaseEdgeFunctionUrl,
  getEdgeFunctionTestUrl,
  isEdgeFunctionUrl,
} from './edgeFunctions'

describe('buildDatabaseEdgeFunctionUrl', () => {
  it('builds a platform edge function URL', () => {
    expect(
      buildDatabaseEdgeFunctionUrl(
        'hello-world',
        'uniquetwentychararef',
        'https://uniquetwentychararef.supabase.red/rest/v1/',
        true
      )
    ).toBe('https://uniquetwentychararef.supabase.red/functions/v1/hello-world')
  })

  it('builds a self-hosted URL reachable from Postgres', () => {
    expect(
      buildDatabaseEdgeFunctionUrl(
        'hello-world',
        'default',
        'http://localhost:8000/rest/v1/',
        false
      )
    ).toBe('http://kong:8000/functions/v1/hello-world')
  })
})

describe('isEdgeFunctionUrl', () => {
  it('matches platform edge function URLs for the current project', () => {
    expect(
      isEdgeFunctionUrl(
        'https://uniquetwentychararef.supabase.co/functions/v1/hello-world',
        'uniquetwentychararef',
        'https://uniquetwentychararef.supabase.co/rest/v1/',
        true
      )
    ).toBe(true)
  })

  it('matches self-hosted edge function URLs', () => {
    expect(
      isEdgeFunctionUrl(
        'http://kong:8000/functions/v1/hello-world',
        'default',
        'http://localhost:8000/rest/v1/',
        false
      )
    ).toBe(true)
  })

  it.each([
    {
      name: 'a project URL without the functions path',
      url: 'https://uniquetwentychararef.supabase.co/rest/v1/hello-world',
      projectRef: 'uniquetwentychararef',
      restUrl: 'https://uniquetwentychararef.supabase.co/rest/v1/',
      isPlatform: true,
    },
    {
      name: "another project's edge function URL",
      url: 'https://anotherprojectref000.supabase.co/functions/v1/hello-world',
      projectRef: 'uniquetwentychararef',
      restUrl: 'https://uniquetwentychararef.supabase.co/rest/v1/',
      isPlatform: true,
    },
    {
      name: 'a lookalike project origin',
      url: 'https://uniquetwentychararef.supabase.example.com/functions/v1/hello-world',
      projectRef: 'uniquetwentychararef',
      restUrl: 'https://uniquetwentychararef.supabase.co/rest/v1/',
      isPlatform: true,
    },
    {
      name: 'a self-hosted non-function URL',
      url: 'http://kong:8000/rest/v1/hello-world',
      projectRef: 'default',
      restUrl: 'http://localhost:8000/rest/v1/',
      isPlatform: false,
    },
  ])('does not match $name', ({ url, projectRef, restUrl, isPlatform }) => {
    expect(
      isEdgeFunctionUrl(url, projectRef, restUrl, isPlatform),
      `Expected ${url} not to match an edge function URL`
    ).toBe(false)
  })
})

describe('getEdgeFunctionTestUrl', () => {
  const platform = { isPlatform: true }
  const nimbus = { isPlatform: true, nimbusProjectsUrl: 'https://*.example.com' }
  const selfHosted = {
    isPlatform: false,
    supabaseUrl: 'http://kong:8000',
    supabasePublicUrl: 'http://localhost:8000',
  }

  it.each([
    'https://uniquetwentychararef.supabase.co/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v3/hello-world',
    'https://uniquetwentychararef.supabase.co/functions/v1/hello-world?name=a%20b&x=1',
    "https://uniquetwentychararef.supabase.co/functions/v1/hello/nested/path_~!$&'()*+,;=:@%20|[]",
  ])('allows the platform URL %s unchanged', (url) => {
    expect(getEdgeFunctionTestUrl(url, platform)).toBe(url)
  })

  it('percent-encodes ^ in the path, as the WHATWG URL parser does', () => {
    expect(
      getEdgeFunctionTestUrl(
        'https://uniquetwentychararef.supabase.co/functions/v1/hello/a^b',
        platform
      )
    ).toBe('https://uniquetwentychararef.supabase.co/functions/v1/hello/a%5Eb')
  })

  it('normalizes the host case and drops an empty query and the fragment', () => {
    expect(
      getEdgeFunctionTestUrl(
        'https://UNIQUETWENTYCHARAREF.supabase.co/functions/v1/hello-world?#frag',
        platform
      )
    ).toBe('https://uniquetwentychararef.supabase.co/functions/v1/hello-world')
  })

  it.each([
    ['another host', 'https://notsupabase.com/functions/v1/test'],
    ['a lookalike host', 'https://uniquetwentychararef.supabase.co.evil.com/functions/v1/test'],
    ['a short project ref', 'https://aaaa.supabase.co/functions/v1/test'],
    ['a nested subdomain', 'https://a.uniquetwentychararef.supabase.co/functions/v1/test'],
    ['plain http', 'http://uniquetwentychararef.supabase.co/functions/v1/test'],
    ['an explicit port', 'https://uniquetwentychararef.supabase.co:8443/functions/v1/test'],
    ['userinfo', 'https://uniquetwentychararef.supabase.co@evil.com/functions/v1/test'],
    ['credentials', 'https://user:pass@uniquetwentychararef.supabase.co/functions/v1/test'],
    ['a path outside functions', 'https://uniquetwentychararef.supabase.co/rest/v1/test'],
    ['a functions path without version', 'https://uniquetwentychararef.supabase.co/functions/test'],
    [
      'a path traversal out of functions',
      'https://uniquetwentychararef.supabase.co/functions/v1/../../rest/v1/test',
    ],
    ['a target in the query string', 'https://localhost?https://aaaa.supabase.co/functions/v1/x'],
    ['a non-http scheme', 'file:///functions/v1/test'],
    ['a malformed URL', 'not a url'],
    ['a non-string value', { href: 'https://uniquetwentychararef.supabase.co/functions/v1/x' }],
  ])('rejects %s on platform', (_name, url) => {
    expect(getEdgeFunctionTestUrl(url, platform)).toBeUndefined()
  })

  it('allows only project subdomains of the Nimbus apex domain when configured', () => {
    expect(
      getEdgeFunctionTestUrl('https://projectref.example.com/functions/v1/hello', nimbus)
    ).toBe('https://projectref.example.com/functions/v1/hello')
    for (const url of [
      'https://uniquetwentychararef.supabase.co/functions/v1/hello',
      'https://example.com/functions/v1/hello',
      'https://a.projectref.example.com/functions/v1/hello',
      'https://projectref.example.com.evil.com/functions/v1/hello',
      'https://projectref.notexample.com/functions/v1/hello',
    ]) {
      expect(getEdgeFunctionTestUrl(url, nimbus), url).toBeUndefined()
    }
  })

  it.each([
    ['the public URL', 'http://localhost:8000/functions/v1/hello?a=1'],
    ['the internal URL', 'http://kong:8000/functions/v1/hello?a=1'],
  ])('rewrites self-hosted %s to the internal URL', (_name, url) => {
    expect(getEdgeFunctionTestUrl(url, selfHosted)).toBe('http://kong:8000/functions/v1/hello?a=1')
  })

  it.each([
    ['another host', 'https://notsupabase.com/functions/v1/test'],
    ['another port on the public host', 'http://localhost:9999/functions/v1/test'],
    ['a platform host', 'https://uniquetwentychararef.supabase.co/functions/v1/test'],
    ['userinfo', 'http://localhost:8000@evil.com/functions/v1/test'],
    ['a path outside functions', 'http://localhost:8000/rest/v1/test'],
    ['a non-http scheme', 'ftp://localhost:8000/functions/v1/test'],
  ])('rejects %s on self-hosted', (_name, url) => {
    expect(getEdgeFunctionTestUrl(url, selfHosted)).toBeUndefined()
  })

  it('rejects every self-hosted URL when SUPABASE_URL is not set', () => {
    expect(
      getEdgeFunctionTestUrl('http://localhost:8000/functions/v1/hello', {
        isPlatform: false,
        supabasePublicUrl: 'http://localhost:8000',
      })
    ).toBeUndefined()
  })
})
