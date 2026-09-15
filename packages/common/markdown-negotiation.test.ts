import { describe, expect, it } from 'vitest'

import { negotiateMarkdown } from './markdown-negotiation'

const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'

describe('negotiateMarkdown', () => {
  describe('hasMarkdownVariant gate', () => {
    it('passes when the route has no markdown variant, regardless of other signals', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/markdown' },
          { hasMarkdownVariant: false, isMarkdownSuffix: true }
        )
      ).toBe('pass')
    })
  })

  describe('forced markdown', () => {
    it('returns markdown for an explicit .md suffix even with an HTML-only Accept', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/html' },
          { hasMarkdownVariant: true, isMarkdownSuffix: true }
        )
      ).toBe('markdown')
    })

    it('returns markdown for an explicit .md suffix even when Accept rejects everything', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'application/x-content-negotiation-probe' },
          { hasMarkdownVariant: true, isMarkdownSuffix: true }
        )
      ).toBe('markdown')
    })
  })

  describe('no Accept header', () => {
    it('passes (serves HTML) when no Accept header is sent', () => {
      expect(negotiateMarkdown({ acceptHeader: '' }, { hasMarkdownVariant: true })).toBe('pass')
    })
  })

  describe('406 not-acceptable', () => {
    it('returns not-acceptable when Accept excludes every type we serve', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'application/x-content-negotiation-probe' },
          { hasMarkdownVariant: true }
        )
      ).toBe('not-acceptable')
    })

    it('does not 406 for bare */*', () => {
      expect(negotiateMarkdown({ acceptHeader: '*/*' }, { hasMarkdownVariant: true })).toBe('pass')
    })
  })

  describe('q-value negotiation', () => {
    it('serves HTML for browser-style Accept', () => {
      expect(
        negotiateMarkdown({ acceptHeader: BROWSER_ACCEPT }, { hasMarkdownVariant: true })
      ).toBe('pass')
    })

    it('serves markdown when explicitly requested', () => {
      expect(
        negotiateMarkdown({ acceptHeader: 'text/markdown' }, { hasMarkdownVariant: true })
      ).toBe('markdown')
    })

    it('serves markdown when its q-value beats html', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/html;q=0.5, text/markdown;q=1.0' },
          { hasMarkdownVariant: true }
        )
      ).toBe('markdown')
    })

    it('serves HTML when its q-value beats markdown', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/html;q=1.0, text/markdown;q=0.5' },
          { hasMarkdownVariant: true }
        )
      ).toBe('pass')
    })

    it('breaks an explicit md/html tie toward markdown', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/markdown, text/html, */*' },
          { hasMarkdownVariant: true }
        )
      ).toBe('markdown')
    })

    it('does not serve markdown when the client rejects it (q=0)', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/markdown;q=0, text/html;q=1.0' },
          { hasMarkdownVariant: true }
        )
      ).toBe('pass')
    })

    it('tolerates OWS around the q parameter (RFC 9110)', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/html ; q = 1.0, text/markdown ; q = 0.5' },
          { hasMarkdownVariant: true }
        )
      ).toBe('pass')
    })

    it('ignores out-of-range q-values (falls back to 1.0; tie -> markdown)', () => {
      expect(
        negotiateMarkdown(
          { acceptHeader: 'text/html;q=2.0, text/markdown;q=1.0' },
          { hasMarkdownVariant: true }
        )
      ).toBe('markdown')
    })
  })
})
