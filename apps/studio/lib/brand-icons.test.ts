import { describe, expect, it } from 'vitest'

import { resolveThemedIconSrc } from './brand-icons'

describe('resolveThemedIconSrc', () => {
  it('returns a single asset for either theme', () => {
    expect(resolveThemedIconSrc('/icon.svg', false)).toBe('/icon.svg')
    expect(resolveThemedIconSrc('/icon.svg', true)).toBe('/icon.svg')
  })

  it('selects the matching themed asset', () => {
    const src = { light: '/light.svg', dark: '/dark.svg' }
    expect(resolveThemedIconSrc(src, false)).toBe('/light.svg')
    expect(resolveThemedIconSrc(src, true)).toBe('/dark.svg')
  })
})
