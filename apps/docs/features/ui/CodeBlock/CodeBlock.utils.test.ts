import { describe, expect, it } from 'vitest'

import { decodeTokenColor, encodeTokenColor } from './CodeBlock.utils'
import theme from './supabase-2.json' with { type: 'json' }

const themeColors = (): Array<string> => {
  const colors = new Set<string>()

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node === null || typeof node !== 'object') return

    for (const [key, value] of Object.entries(node)) {
      if ((key === 'foreground' || key === 'background') && typeof value === 'string') {
        colors.add(value)
      }
      walk(value)
    }
  }

  walk(theme)
  return [...colors]
}

describe('token color encoding', () => {
  it('shortens every theme color and restores it unchanged', () => {
    const colors = themeColors()
    expect(colors.length).toBeGreaterThan(0)

    for (const color of colors) {
      const encoded = encodeTokenColor(color)
      expect(encoded!.length, `${color} is missing from the encoding table`).toBeLessThan(
        color.length
      )
      expect(decodeTokenColor(encoded)).toBe(color)
    }
  })
})
