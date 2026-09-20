import { describe, expect, it } from 'vitest'

import {
  buildDatabaseEdgeFunctionUrl,
  isEdgeFunctionUrl,
  isValidEdgeFunctionURL,
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

describe('isValidEdgeFunctionURL', () => {
  const validEdgeFunctionUrls = [
    'https://uniquetwentychararef.supabase.co/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v3/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v3/hello-world',
  ]

  const validLocalEdgeFunctionsUrls = [
    'https://projectref.notsupabase.com/functions/v1/test',
    'https://notsupabase.com/functions/v1/test',
    'http://localhost:54321/functions/v1/test-2',
    'http://kong:8000/functions/v1/hello-world',
    'https://127.0.0.1:54321/functions/v1/test-3',
    'https://127.0.0.1:54321/functions/v1/test-5',
  ]

  const invalidPlatformEdgeFunctionUrls = [
    'https://notsupabase.com/functions/v1/test',
    'https://projectref.notsupabase.com/functions/v1/test',
    'https://localhost?https://aaaa.supabase.co/functions/v1/xxx',
    'https://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
    'http://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
  ]

  const invalidEdgeFunctionUrls = [
    'https://localhost?https://aaaa.supabase.co/functions/v1/xxx',
    'https://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
    'http://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
  ]

  it('should match valid edge function URLs on platform', () => {
    for (const url of validEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be valid`).toBe(true)
    }
  })

  it('should not match local URLs on platform', () => {
    for (const url of validLocalEdgeFunctionsUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be invalid on platform`).toBe(
        false
      )
    }
  })

  it('should match valid local edge function URLs off platform', () => {
    for (const url of validLocalEdgeFunctionsUrls) {
      expect(isValidEdgeFunctionURL(url, false), `Expected ${url} to be valid`).toBe(true)
    }
  })

  it('should not match invalid edge function URLs on platform', () => {
    for (const url of invalidPlatformEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be invalid`).toBe(false)
    }
  })

  it('should not match invalid edge function URLs off platform', () => {
    for (const url of invalidEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, false), `Expected ${url} to be invalid`).toBe(false)
    }
  })
})
