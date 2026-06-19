import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getInternalLinkBaseUrl, prefixInternalLinks, withDocsBasePath } from './internal-links'

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

describe('prefixInternalLinks', () => {
  const BASE = 'https://supabase.com'

  it('returns content unchanged when baseUrl is empty', () => {
    const input = 'See [Dashboard](/dashboard/foo).'
    expect(prefixInternalLinks(input, '')).toBe(input)
  })

  it('prepends baseUrl to a root-relative link', () => {
    expect(prefixInternalLinks('See [Dashboard](/dashboard/foo).', BASE)).toBe(
      'See [Dashboard](https://supabase.com/dashboard/foo).'
    )
  })

  it('rewrites multiple links on the same line', () => {
    const input = 'A [one](/a) and [two](/b/c) here.'
    expect(prefixInternalLinks(input, BASE)).toBe(
      'A [one](https://supabase.com/a) and [two](https://supabase.com/b/c) here.'
    )
  })

  it('preserves query strings and fragments', () => {
    expect(prefixInternalLinks('[link](/foo?bar=1&baz=2#section)', BASE)).toBe(
      '[link](https://supabase.com/foo?bar=1&baz=2#section)'
    )
  })

  it('leaves absolute http(s) links alone', () => {
    const input = 'See [GitHub](https://github.com/supabase).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('leaves anchor-only links alone', () => {
    const input = 'Jump to [section](#installation).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('leaves mailto and other schemes alone', () => {
    const input = 'Email [us](mailto:team@example.com) or [call](tel:+1234).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('leaves explicitly relative links (./, ../) alone', () => {
    const input = 'See [sibling](./sibling) and [parent](../parent).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('leaves protocol-relative (//host) URLs alone', () => {
    const input = 'CDN [asset](//cdn.example.com/img.png).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('does not rewrite image syntax', () => {
    const input = 'An image: ![alt text](/static/foo.png).'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('rewrites a link adjacent to an image without touching the image', () => {
    expect(prefixInternalLinks('![logo](/logo.png) and [home](/dashboard)', BASE)).toBe(
      '![logo](/logo.png) and [home](https://supabase.com/dashboard)'
    )
  })

  it('skips links inside fenced code blocks', () => {
    const input = [
      'Before: [yes](/touch-me).',
      '',
      '```md',
      '[ignore me](/leave-alone)',
      '```',
      '',
      'After: [also yes](/touch-me-too).',
    ].join('\n')

    expect(prefixInternalLinks(input, BASE)).toBe(
      [
        'Before: [yes](https://supabase.com/touch-me).',
        '',
        '```md',
        '[ignore me](/leave-alone)',
        '```',
        '',
        'After: [also yes](https://supabase.com/touch-me-too).',
      ].join('\n')
    )
  })

  it('handles multiple fenced code blocks correctly', () => {
    const input = [
      '[a](/a)',
      '```',
      '[skip1](/skip1)',
      '```',
      '[b](/b)',
      '```ts',
      '[skip2](/skip2)',
      '```',
      '[c](/c)',
    ].join('\n')

    expect(prefixInternalLinks(input, BASE)).toBe(
      [
        '[a](https://supabase.com/a)',
        '```',
        '[skip1](/skip1)',
        '```',
        '[b](https://supabase.com/b)',
        '```ts',
        '[skip2](/skip2)',
        '```',
        '[c](https://supabase.com/c)',
      ].join('\n')
    )
  })

  it('rewrites links with empty text', () => {
    expect(prefixInternalLinks('[](/foo)', BASE)).toBe('[](https://supabase.com/foo)')
  })

  it('uses any baseUrl passed in, not just supabase.com', () => {
    expect(prefixInternalLinks('[x](/y)', 'https://branch-deploy.vercel.app')).toBe(
      '[x](https://branch-deploy.vercel.app/y)'
    )
  })

  it('is a no-op when there are no matching links', () => {
    const input = '# Title\n\nJust prose, no links.'
    expect(prefixInternalLinks(input, BASE)).toBe(input)
  })

  it('handles an unclosed code fence by leaving the unclosed portion untouched', () => {
    // A `split(/(```...```)/)` only pairs complete fences; an unclosed fence
    // means everything after it stays in the trailing prose segment. Document
    // that behavior rather than promising to parse malformed markdown.
    const input = ['[before](/before)', '```', '[inside-unclosed](/inside)'].join('\n')
    expect(prefixInternalLinks(input, BASE)).toBe(
      [
        '[before](https://supabase.com/before)',
        '```',
        '[inside-unclosed](https://supabase.com/inside)',
      ].join('\n')
    )
  })
})
