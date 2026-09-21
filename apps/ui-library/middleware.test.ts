import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { middleware } from './middleware'

const DOCS_URL = 'https://supabase.com/library/docs/nextjs/client'

function request(url: string, headers: Record<string, string>) {
  return new NextRequest(new Request(url, { headers }))
}

describe('middleware markdown negotiation', () => {
  it('rewrites to the markdown route when Accept prefers markdown', () => {
    const response = middleware(request(DOCS_URL, { accept: 'text/markdown' }))

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://supabase.com/library/api/docs-md/nextjs/client'
    )
  })

  it('406s when Accept rejects both html and markdown', () => {
    const response = middleware(request(DOCS_URL, { accept: 'application/json' }))

    expect(response.status).toBe(406)
  })

  it('passes Server Action requests through untouched', () => {
    // Server Actions POST to the page URL with `Accept: text/x-component`.
    const response = middleware(
      request(DOCS_URL, {
        accept: 'text/x-component',
        'next-action': '7f1e0c0d5a1b2c3d4e5f60718293a4b5c6d7e8f900',
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('serves html to browsers', () => {
    const response = middleware(
      request(DOCS_URL, { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })
})
