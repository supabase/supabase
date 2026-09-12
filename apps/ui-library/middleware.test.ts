import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { middleware } from './middleware'

const DOCS_URL = 'https://supabase.com/library/docs/nextjs/client'

function request(url: string, headers: Record<string, string>) {
  return new NextRequest(new Request(url, { headers }))
}

describe('middleware markdown negotiation', () => {
  it('rewrites to the markdown route when Accept prefers markdown', () => {
    const response = middleware(request(DOCS_URL, { accept: 'text/markdown' }))

    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      'https://supabase.com/library/api/docs-md/nextjs/client'
    )
  })

  it('406s when Accept rejects both html and markdown', () => {
    const response = middleware(request(DOCS_URL, { accept: 'application/json' }))

    assert.equal(response.status, 406)
  })

  it('passes Server Action requests through untouched', () => {
    // Server Actions POST to the page URL with `Accept: text/x-component`.
    const response = middleware(
      request(DOCS_URL, {
        accept: 'text/x-component',
        'next-action': '7f1e0c0d5a1b2c3d4e5f60718293a4b5c6d7e8f900',
      })
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-middleware-rewrite'), null)
  })

  it('serves html to browsers', () => {
    const response = middleware(
      request(DOCS_URL, { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' })
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-middleware-rewrite'), null)
  })
})
