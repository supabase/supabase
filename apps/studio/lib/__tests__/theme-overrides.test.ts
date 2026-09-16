import { describe, expect, it } from 'vitest'

import {
  applyResolvedThemeOverrides,
  applyThemeOverrides,
  clearThemeOverridesForMode,
  getThemeOverrideRange,
  getThemeOverrideValue,
  hasThemeOverrides,
  mergeThemeOverride,
  parseThemeOverridesByMode,
  resolveThemeOverrideMode,
  sliderValueToThemeOverride,
  THEME_OVERRIDE_DEFAULTS,
  THEME_OVERRIDE_KNOBS,
  ThemeOverrideMode,
  themeOverrideToSliderValue,
} from '@/lib/theme-overrides'

const knob = (key: string) => {
  const found = THEME_OVERRIDE_KNOBS.find((candidate) => candidate.key === key)
  if (found === undefined) throw new Error(`No knob found for ${key}`)
  return found
}

describe.each<ThemeOverrideMode>(['dark', 'light'])('%s theme slider mappings', (mode) => {
  it.each(THEME_OVERRIDE_KNOBS)('maps $label endpoints to its safe range', (setting) => {
    const range = getThemeOverrideRange(setting, mode)

    expect(sliderValueToThemeOverride(setting, mode, 0)).toBe(range.min)
    expect(sliderValueToThemeOverride(setting, mode, 100)).toBe(range.max)
    expect(themeOverrideToSliderValue(setting, mode, range.min)).toBe(0)
    expect(themeOverrideToSliderValue(setting, mode, range.max)).toBe(100)
  })

  it.each(THEME_OVERRIDE_KNOBS)('round trips $label positions', (setting) => {
    for (const sliderValue of [0, 17, 50, 83, 100]) {
      const rawValue = sliderValueToThemeOverride(setting, mode, sliderValue)
      expect(themeOverrideToSliderValue(setting, mode, rawValue)).toBe(sliderValue)
    }
  })

  it.each(THEME_OVERRIDE_KNOBS)('clamps $label outside the safe range', (setting) => {
    expect(themeOverrideToSliderValue(setting, mode, Number.NEGATIVE_INFINITY)).toBe(0)
    expect(themeOverrideToSliderValue(setting, mode, Number.POSITIVE_INFINITY)).toBe(100)
    expect(sliderValueToThemeOverride(setting, mode, -1)).toBe(
      getThemeOverrideRange(setting, mode).min
    )
    expect(sliderValueToThemeOverride(setting, mode, 101)).toBe(
      getThemeOverrideRange(setting, mode).max
    )
  })
})

describe('dark theme surface elevation', () => {
  it('keeps the base surface independent while giving raised layers meaningful contrast', () => {
    const surface = getThemeOverrideRange(knob('surface'), 'dark').min
    const elevationStep = getThemeOverrideRange(knob('elevationStep'), 'dark').max

    expect(surface).toBe(0.12)
    expect(surface + elevationStep).toBeCloseTo(0.36)
    expect(surface + elevationStep * 1.5).toBeCloseTo(0.48)
  })
})

describe('theme override storage', () => {
  it('keeps sibling settings and modes', () => {
    const merged = mergeThemeOverride(
      { dark: { chroma: 0.02 }, light: { surface: 0.9 } },
      'dark',
      'contrast',
      0.7
    )

    expect(merged).toEqual({
      dark: { chroma: 0.02, contrast: 0.7 },
      light: { surface: 0.9 },
    })
  })

  it('removes an override returned to its displayed default', () => {
    const merged = mergeThemeOverride(
      { dark: { chroma: 0.02, contrast: 0.7 } },
      'dark',
      'contrast',
      THEME_OVERRIDE_DEFAULTS.dark.contrast
    )

    expect(merged).toEqual({ dark: { chroma: 0.02 } })
  })

  it('removes an empty mode returned to its displayed defaults', () => {
    const merged = mergeThemeOverride(
      { dark: { contrast: 0.7 }, light: { surface: 0.9 } },
      'dark',
      'contrast',
      THEME_OVERRIDE_DEFAULTS.dark.contrast
    )

    expect(merged).toEqual({ light: { surface: 0.9 } })
  })

  it('clears one mode without leaving an empty entry', () => {
    expect(
      clearThemeOverridesForMode({ dark: { contrast: 0.7 }, light: { surface: 0.9 } }, 'dark')
    ).toEqual({ light: { surface: 0.9 } })
  })

  it('parses legacy values, strips unknown data, and clamps each mode', () => {
    expect(
      parseThemeOverridesByMode({
        dark: { chroma: 99, surface: 0.2, unknown: 123 },
        light: { contrast: -5 },
        other: { surface: 0 },
      })
    ).toEqual({ dark: { chroma: 0.04, surface: 0.2 }, light: { contrast: 0.45 } })
  })

  it.each([null, [], 'invalid', { dark: { chroma: 'high' } }])(
    'falls back for malformed data: %j',
    (value) => expect(parseThemeOverridesByMode(value)).toEqual({})
  )
})

describe('theme override application', () => {
  it('uses the mode default when a setting has no override', () => {
    expect(getThemeOverrideValue(knob('surface'), 'dark', {})).toBe(
      THEME_OVERRIDE_DEFAULTS.dark.surface
    )
    expect(getThemeOverrideValue(knob('surface'), 'light', {})).toBe(
      THEME_OVERRIDE_DEFAULTS.light.surface
    )
  })

  it('writes stored settings and hands missing settings back to CSS', () => {
    const root = document.createElement('html')
    root.style.setProperty('--contrast', '0.7')

    applyThemeOverrides(root, 'dark', { chroma: 0.02 })

    expect(root.style.getPropertyValue('--chroma')).toBe('0.02')
    expect(root.style.getPropertyValue('--contrast')).toBe('')
  })

  it('removes stored settings from Classic Dark', () => {
    const root = document.createElement('html')
    root.style.setProperty('--chroma', '0.04')

    applyResolvedThemeOverrides(root, 'classic-dark', 'dark', { chroma: 0.02 })

    expect(root.style.getPropertyValue('--chroma')).toBe('')
  })

  it('reports whether a mode has overrides', () => {
    expect(hasThemeOverrides({})).toBe(false)
    expect(hasThemeOverrides({ chroma: 0.02 })).toBe(true)
  })

  it('resolves classic dark as dark for legacy stored themes', () => {
    expect(resolveThemeOverrideMode('dark')).toBe('dark')
    expect(resolveThemeOverrideMode('classic-dark')).toBe('dark')
    expect(resolveThemeOverrideMode('light')).toBe('light')
    expect(resolveThemeOverrideMode(undefined)).toBe('light')
  })
})
