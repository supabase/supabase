import { describe, expect, it } from 'vitest'

import {
  buildGeneratedPageDocument,
  clampGeneratedPageHeight,
  GENERATED_PAGE_MAX_HEIGHT,
  GENERATED_PAGE_MIN_HEIGHT,
  generatedPageFrameMessageSchema,
  getProjectConnectOrigins,
  SUPABASE_JS_CDN_URL,
} from './generated-page-document'

const baseOptions = {
  html: '<h1>Hello</h1>',
  databaseQueryIds: ['recent_users'],
  logQueryIds: ['auth_errors'],
}

describe('buildGeneratedPageDocument', () => {
  it('denies everything by default and allows no network egress without a client', () => {
    const doc = buildGeneratedPageDocument(baseOptions)

    expect(doc).toContain("default-src 'none'")
    expect(doc).toContain("connect-src 'none'")
    expect(doc).toContain("object-src 'none'")
    expect(doc).toContain("base-uri 'none'")
    expect(doc).toContain("form-action 'none'")
    expect(doc).toContain('img-src data:')
    expect(doc).not.toContain(SUPABASE_JS_CDN_URL)
  })

  it('embeds the generated markup verbatim and declares only the approved query ids', () => {
    const doc = buildGeneratedPageDocument(baseOptions)

    expect(doc).toContain('<h1>Hello</h1>')
    expect(doc).toContain('"databaseQueryIds":["recent_users"]')
    expect(doc).toContain('"logQueryIds":["auth_errors"]')
  })

  it('allows only the project origins and the pinned CDN when a client is requested', () => {
    const doc = buildGeneratedPageDocument({
      ...baseOptions,
      supabase: { projectUrl: 'https://abc.supabase.co', publishableKey: 'sb_publishable_test' },
    })

    expect(doc).toContain('connect-src https://abc.supabase.co wss://abc.supabase.co')
    expect(doc).toContain(`<script src="${SUPABASE_JS_CDN_URL}"></script>`)
    expect(doc).toContain('sb_publishable_test')
    expect(doc).toContain('persistSession: false')
  })

  it('escapes markup in the injected config so it cannot close the bootstrap script', () => {
    const doc = buildGeneratedPageDocument({
      ...baseOptions,
      supabase: {
        projectUrl: 'https://abc.supabase.co',
        publishableKey: '</script><script>stolen()</script>',
      },
    })

    expect(doc).not.toContain('<script>stolen()')
    expect(doc).toContain('\\u003c/script>')
  })
})

describe('getProjectConnectOrigins', () => {
  it('returns the HTTPS origin and its WebSocket counterpart', () => {
    expect(getProjectConnectOrigins('https://abc.supabase.co')).toEqual([
      'https://abc.supabase.co',
      'wss://abc.supabase.co',
    ])
  })

  it('refuses non-HTTPS and unparseable URLs', () => {
    expect(getProjectConnectOrigins('http://abc.supabase.co')).toEqual([])
    expect(getProjectConnectOrigins('javascript:alert(1)')).toEqual([])
    expect(getProjectConnectOrigins('not a url')).toEqual([])
  })
})

describe('clampGeneratedPageHeight', () => {
  it('keeps the reported height within the rendered range', () => {
    expect(clampGeneratedPageHeight(500)).toBe(500)
    expect(clampGeneratedPageHeight(1)).toBe(GENERATED_PAGE_MIN_HEIGHT)
    expect(clampGeneratedPageHeight(999_999)).toBe(GENERATED_PAGE_MAX_HEIGHT)
    expect(clampGeneratedPageHeight(Number.NaN)).toBeGreaterThan(0)
  })
})

describe('generatedPageFrameMessageSchema', () => {
  it('accepts well-formed query and resize messages', () => {
    expect(
      generatedPageFrameMessageSchema.safeParse({
        type: 'query',
        requestId: 'r1',
        kind: 'database',
        queryId: 'recent_users',
      }).success
    ).toBe(true)
    expect(generatedPageFrameMessageSchema.safeParse({ type: 'resize', height: 320 }).success).toBe(
      true
    )
  })

  it('rejects malformed payloads, including a frame trying to smuggle SQL', () => {
    const rejected = [
      { type: 'query', requestId: 'r1', kind: 'database' },
      { type: 'query', requestId: 'r1', kind: 'shell', queryId: 'x' },
      { type: 'query', requestId: '', kind: 'logs', queryId: 'x' },
      { type: 'execute', sql: 'select 1' },
      { type: 'resize', height: 'tall' },
      null,
      'resize',
    ]

    for (const payload of rejected) {
      expect(generatedPageFrameMessageSchema.safeParse(payload).success).toBe(false)
    }
  })

  it('drops extra fields rather than passing them through', () => {
    const parsed = generatedPageFrameMessageSchema.parse({
      type: 'query',
      requestId: 'r1',
      kind: 'database',
      queryId: 'recent_users',
      sql: 'drop table users',
    })

    expect(parsed).not.toHaveProperty('sql')
  })
})
