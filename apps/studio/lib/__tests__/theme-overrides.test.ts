import { describe, expect, it } from 'vitest'

import {
  applyThemeOverrides,
  clearThemeOverridesForMode,
  formatThemeOverrideValue,
  getThemeOverrideValue,
  hasThemeOverrides,
  mergeThemeOverride,
  resolveThemeOverrideMode,
  THEME_OVERRIDE_DEFAULTS,
  THEME_OVERRIDE_KNOBS,
  ThemeOverridesByMode,
} from '@/lib/theme-overrides'

const knob = (key: string) => {
  const found = THEME_OVERRIDE_KNOBS.find((k) => k.key === key)
  if (!found) throw new Error(`no knob for ${key}`)
  return found
}

describe('mergeThemeOverride', () => {
  it('keeps the knobs already stored for the same mode', () => {
    const merged = mergeThemeOverride({ dark: { chroma: 0.06 } }, 'dark', 'contrast', 1)

    expect(merged.dark).toEqual({ chroma: 0.06, contrast: 1 })
  })

  it('keeps every earlier knob across a run of writes', () => {
    const store = (
      [
        ['chroma', 0.06],
        ['contrast', 1],
        ['surface', 0.185],
        ['elevationStep', 0.08],
      ] as const
    ).reduce<ThemeOverridesByMode>(
      (current, [key, value]) => mergeThemeOverride(current, 'dark', key, value),
      {}
    )

    expect(store).toEqual({
      dark: { chroma: 0.06, contrast: 1, surface: 0.185, elevationStep: 0.08 },
    })
  })

  it('leaves the other mode untouched', () => {
    const merged = mergeThemeOverride({ light: { chroma: 0.03 } }, 'dark', 'chroma', 0.06)

    expect(merged).toEqual({ light: { chroma: 0.03 }, dark: { chroma: 0.06 } })
  })

  it('does not mutate the object it was given', () => {
    const current: ThemeOverridesByMode = { dark: { chroma: 0.06 } }

    mergeThemeOverride(current, 'dark', 'contrast', 1)

    expect(current).toEqual({ dark: { chroma: 0.06 } })
  })
})

describe('clearThemeOverridesForMode', () => {
  it('clears one mode and keeps the other', () => {
    const cleared = clearThemeOverridesForMode(
      { dark: { chroma: 0.06, contrast: 1 }, light: { chroma: 0.03 } },
      'dark'
    )

    expect(cleared).toEqual({ dark: {}, light: { chroma: 0.03 } })
  })
})

describe('getThemeOverrideValue', () => {
  it('falls back to the mode default when the knob has no override', () => {
    expect(getThemeOverrideValue(knob('surface'), 'dark', {})).toBe(
      THEME_OVERRIDE_DEFAULTS.dark.surface
    )
    expect(getThemeOverrideValue(knob('surface'), 'light', {})).toBe(
      THEME_OVERRIDE_DEFAULTS.light.surface
    )
  })

  it('prefers a stored override over the default', () => {
    expect(getThemeOverrideValue(knob('chroma'), 'dark', { chroma: 0.06 })).toBe(0.06)
  })
})

describe('formatThemeOverrideValue', () => {
  it('renders at the knob step precision rather than leaking float noise', () => {
    expect(formatThemeOverrideValue(knob('chroma'), 0.019000000000000003)).toBe('0.019')
    expect(formatThemeOverrideValue(knob('contrast'), 1)).toBe('1.00')
  })
})

describe('hasThemeOverrides', () => {
  it('is false for an empty store and true once a knob is set', () => {
    expect(hasThemeOverrides({})).toBe(false)
    expect(hasThemeOverrides({ chroma: 0.06 })).toBe(true)
  })
})

describe('resolveThemeOverrideMode', () => {
  it('treats every dark variant as dark and anything else as light', () => {
    expect(resolveThemeOverrideMode('dark')).toBe('dark')
    expect(resolveThemeOverrideMode('classic-dark')).toBe('dark')
    expect(resolveThemeOverrideMode('light')).toBe('light')
    expect(resolveThemeOverrideMode(undefined)).toBe('light')
  })
})

describe('applyThemeOverrides', () => {
  it('writes the stored knobs and hands the rest back to the stylesheet', () => {
    const root = document.createElement('html')
    root.style.setProperty('--contrast', '0.9')

    applyThemeOverrides(root, { chroma: 0.06 })

    expect(root.style.getPropertyValue('--chroma')).toBe('0.06')
    // Anything without a stored override is removed, which is why an
    // un-persisted knob loses its live preview as soon as another knob commits.
    expect(root.style.getPropertyValue('--contrast')).toBe('')
  })

  it('clamps a stored value into the knob range', () => {
    const root = document.createElement('html')

    applyThemeOverrides(root, { chroma: 99, contrast: -5 })

    expect(root.style.getPropertyValue('--chroma')).toBe(String(knob('chroma').max))
    expect(root.style.getPropertyValue('--contrast')).toBe(String(knob('contrast').min))
  })
})
