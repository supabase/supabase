import { fromMarkdown } from 'mdast-util-from-markdown'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { addBaseUrlPrefix, getInternalLinkBaseUrl, withDocsBasePath } from './internal-links'

describe('withDocsBasePath', () => {
  it('prepends /docs to a root-relative href', () => {
    expect(withDocsBasePath('/guides/self-hosting/docker')).toBe('/docs/guides/self-hosting/docker')
  })

  it('prepends /docs to a single-segment href', () => {
    expect(withDocsBasePath('/contribute')).toBe('/docs/contribute')
  })

  it('leaves hrefs that already start with /docs/ alone', () => {
    expect(withDocsBasePath('/docs/guides/foo')).toBe('/docs/guides/foo')
  })

  it('leaves the exact /docs href alone', () => {
    expect(withDocsBasePath('/docs')).toBe('/docs')
  })

  it('does not match prefixes like /docsx that only share leading chars', () => {
    expect(withDocsBasePath('/docsx/foo')).toBe('/docs/docsx/foo')
  })

  it('leaves absolute http(s) URLs alone', () => {
    expect(withDocsBasePath('https://example.com/foo')).toBe('https://example.com/foo')
  })

  it('leaves protocol-relative URLs alone', () => {
    expect(withDocsBasePath('//cdn.example.com/foo')).toBe('//cdn.example.com/foo')
  })

  it('leaves anchor-only hrefs alone', () => {
    expect(withDocsBasePath('#section')).toBe('#section')
  })

  it('leaves mailto: hrefs alone', () => {
    expect(withDocsBasePath('mailto:team@example.com')).toBe('mailto:team@example.com')
  })

  it('leaves relative ./ and ../ hrefs alone', () => {
    expect(withDocsBasePath('./sibling')).toBe('./sibling')
    expect(withDocsBasePath('../parent')).toBe('../parent')
  })

  it('preserves query strings and fragments', () => {
    expect(withDocsBasePath('/guides/foo?x=1#bar')).toBe('/docs/guides/foo?x=1#bar')
  })
})

describe('getInternalLinkBaseUrl', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.VERCEL_ENV
    delete process.env.VERCEL_URL
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('returns the production host when VERCEL_ENV=production', () => {
    process.env.VERCEL_ENV = 'production'
    expect(getInternalLinkBaseUrl()).toBe('https://supabase.com')
  })

  it('production wins even if VERCEL_URL is also set', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.VERCEL_URL = 'should-be-ignored.vercel.app'
    expect(getInternalLinkBaseUrl()).toBe('https://supabase.com')
  })

  it('returns the deployment URL when VERCEL_ENV=preview', () => {
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_URL = 'supabase-com-abc123.vercel.app'
    expect(getInternalLinkBaseUrl()).toBe('https://supabase-com-abc123.vercel.app')
  })

  it('returns empty when preview is set but VERCEL_URL is missing', () => {
    process.env.VERCEL_ENV = 'preview'
    expect(getInternalLinkBaseUrl()).toBe('')
  })

  it('returns empty when VERCEL_ENV=development', () => {
    process.env.VERCEL_ENV = 'development'
    process.env.VERCEL_URL = 'localhost-tunnel.vercel.app'
    expect(getInternalLinkBaseUrl()).toBe('')
  })

  it('returns empty when VERCEL_ENV is not set (local)', () => {
    expect(getInternalLinkBaseUrl()).toBe('')
  })
})

describe('addBaseUrlPrefix', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VERCEL_ENV: 'production' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  const linkUrls = (markdown: string): string[] => {
    const tree = fromMarkdown(markdown)
    addBaseUrlPrefix(tree)
    const urls: string[] = []
    const visit = (n: any) => {
      if (n.type === 'link') urls.push(n.url)
      if (Array.isArray(n.children)) n.children.forEach(visit)
    }
    visit(tree)
    return urls
  }

  it('prepends baseUrl to root-relative link URLs', () => {
    expect(linkUrls('[home](/foo)')).toEqual(['https://supabase.com/foo'])
  })

  it('leaves absolute, anchor, and protocol-relative URLs alone', () => {
    expect(linkUrls('[a](https://x.com) [b](#h) [c](//cdn/x)')).toEqual([
      'https://x.com',
      '#h',
      '//cdn/x',
    ])
  })

  it('does not rewrite image URLs', () => {
    expect(linkUrls('![alt](/img.png)')).toEqual([])
  })

  it('skips links inside fenced code blocks', () => {
    expect(linkUrls('```\n[x](/x)\n```\n\n[y](/y)')).toEqual(['https://supabase.com/y'])
  })
})
