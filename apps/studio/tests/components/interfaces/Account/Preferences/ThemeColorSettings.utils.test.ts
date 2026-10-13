import { describe, expect, it } from 'vitest'

import { sliderTrackStyle } from '@/components/interfaces/Account/Preferences/ThemeColorSettings.utils'
import type { ThemeOverrideKey, ThemeOverrideMode } from '@/lib/theme-overrides'

describe('sliderTrackStyle', () => {
  const cases: Array<{
    key: ThemeOverrideKey
    mode: ThemeOverrideMode
    start: string
    end: string
  }> = [
    { key: 'primaryHue', mode: 'dark', start: '0.7 0.14 0', end: '0.7 0.14 360' },
    { key: 'primaryHue', mode: 'light', start: '0.7 0.14 0', end: '0.7 0.14 360' },
    {
      key: 'chroma',
      mode: 'dark',
      start: '0.4 0 var(--surface-hue)',
      end: '0.4 0.07 var(--surface-hue)',
    },
    {
      key: 'chroma',
      mode: 'light',
      start: '0.9 0 var(--surface-hue)',
      end: '0.9 0.05 var(--surface-hue)',
    },
    { key: 'contrast', mode: 'dark', start: '0.35 0 0', end: '0.9 0 0' },
    { key: 'contrast', mode: 'light', start: '0.82 0 0', end: '0.2 0 0' },
    { key: 'surface', mode: 'dark', start: '0.14 0 0', end: '0.97 0 0' },
    { key: 'surface', mode: 'light', start: '0.14 0 0', end: '0.97 0 0' },
    {
      key: 'elevationStep',
      mode: 'dark',
      start: '0.28 0 var(--surface-hue)',
      end: '0.55 0 var(--surface-hue)',
    },
    {
      key: 'elevationStep',
      mode: 'light',
      start: '0.92 0 var(--surface-hue)',
      end: '0.99 0 var(--surface-hue)',
    },
  ]

  it.each(cases)('illustrates the $key range in $mode mode', ({ key, mode, start, end }) => {
    const gradient = sliderTrackStyle(key, mode)?.['--slider-track-fill']
    expect(gradient).toMatch(/^linear-gradient\(to right, /)
    expect(gradient).toContain(`oklch(${start})`)
    expect(gradient).toContain(`oklch(${end})`)
  })
})
