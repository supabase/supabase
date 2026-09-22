import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { getCodeBlockLabel, getTokenClassName } from './CodeBlock.utils'
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

describe('token class names', () => {
  it('maps every theme color to a class', () => {
    const colors = themeColors()
    expect(colors.length).toBeGreaterThan(0)

    const css = readFileSync(new URL('../../../styles/code-block.css', import.meta.url), 'utf8')
    for (const color of colors) {
      expect(getTokenClassName(color, 0), `${color} is missing from the class table`).toMatch(
        /^s-[a-z]$/
      )
      expect(css).toContain(`.shiki .${getTokenClassName(color, 0)} {\n  color: ${color};`)
    }
  })

  it('appends font style classes', () => {
    expect(getTokenClassName('var(--code-token-comment)', 1)).toBe('s-c s-i')
    expect(getTokenClassName(undefined, 2 | 4)).toBe('s-b s-l')
    expect(getTokenClassName(undefined, 0)).toBeUndefined()
    expect(getTokenClassName(undefined, -1)).toBeUndefined()
  })
})

describe('code block labels', () => {
  it('names language aliases and singular or plural line counts', () => {
    expect(getCodeBlockLabel('ts', 1)).toBe('TypeScript, 1 line')
    expect(getCodeBlockLabel('sh', 2)).toBe('Shell, 2 lines')
    expect(getCodeBlockLabel('rust', 3)).toBe('rust, 3 lines')
    expect(getCodeBlockLabel(null, 1)).toBe('1 line')
  })
})
