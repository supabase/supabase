import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import staticRedirects from '../redirects/static-redirects.json'

const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
) as { redirects: { source: string }[] }

describe('static redirects', () => {
  it('are literal /kb/ paths with a boolean permanent flag', () => {
    for (const { source, destination, permanent } of staticRedirects) {
      // Bulk redirects match the source literally, so route syntax would never match.
      expect(source).toMatch(/^\/kb\/[^:*()\\]+$/)
      // The generator appends `.md`, so destinations must be plain internal paths.
      expect(destination).toMatch(/^\/kb\/[^?#]*[^/?#]$/)
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
})
