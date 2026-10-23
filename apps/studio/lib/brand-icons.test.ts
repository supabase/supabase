import { describe, expect, it } from 'vitest'

import { resolveLightIconSrc, resolveThemedIconSrc } from './brand-icons'

describe('resolveThemedIconSrc', () => {
  it('returns a single-asset path for either theme', () => {
    expect(resolveThemedIconSrc('/img/icons/bigquery-icon.svg', false)).toBe(
      '/img/icons/bigquery-icon.svg'
    )
    expect(resolveThemedIconSrc('/img/icons/bigquery-icon.svg', true)).toBe(
      '/img/icons/bigquery-icon.svg'
    )
  })

  it('picks light or dark when both are provided', () => {
    const src = { light: '/light.svg', dark: '/dark.svg' }
    expect(resolveThemedIconSrc(src, false)).toBe('/light.svg')
    expect(resolveThemedIconSrc(src, true)).toBe('/dark.svg')
  })
})

describe('resolveLightIconSrc', () => {
  it('returns the only asset or the light variant', () => {
    expect(resolveLightIconSrc('/img/icons/bigquery-icon.svg')).toBe('/img/icons/bigquery-icon.svg')
    expect(resolveLightIconSrc({ light: '/light.svg', dark: '/dark.svg' })).toBe('/light.svg')
  })
})
