import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const source = readFileSync(new URL('./PublicityLogos.tsx', import.meta.url), 'utf8')

describe('PublicityLogos', () => {
  test('uses unique IDs for inline SVG references', () => {
    const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    const referencedIds = [...source.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1])

    expect(new Set(ids).size).toBe(ids.length)
    expect(referencedIds.length).toBeGreaterThan(0)

    for (const referencedId of referencedIds) {
      expect(ids).toContain(referencedId)
    }
  })
})
