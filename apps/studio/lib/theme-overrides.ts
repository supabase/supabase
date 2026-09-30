import * as z from 'zod'

export type ThemeOverrideKey = 'chroma' | 'contrast' | 'surface' | 'elevationStep'
export type ThemeOverrideMode = 'dark' | 'light'

type ThemeOverrideRange = { min: number; max: number }

export interface ThemeOverrideKnob {
  key: ThemeOverrideKey
  cssVar: string
  label: string
  description: string
  ranges: Record<ThemeOverrideMode, ThemeOverrideRange>
}

export const THEME_OVERRIDE_KNOBS: readonly ThemeOverrideKnob[] = [
  {
    key: 'chroma',
    cssVar: '--chroma',
    label: 'Color intensity',
    description: 'Controls how vivid interface colors appear.',
    ranges: { dark: { min: 0, max: 0.04 }, light: { min: 0, max: 0.03 } },
  },
  {
    key: 'contrast',
    cssVar: '--contrast',
    label: 'Contrast',
    description: 'Controls the difference between text, borders, and backgrounds.',
    ranges: { dark: { min: 0.4, max: 0.8 }, light: { min: 0.45, max: 0.8 } },
  },
  {
    key: 'surface',
    cssVar: '--surface',
    label: 'Surface brightness',
    description: 'Controls how light or dark background surfaces appear.',
    ranges: { dark: { min: 0.12, max: 0.32 }, light: { min: 0.82, max: 0.995 } },
  },
  {
    key: 'elevationStep',
    cssVar: '--elevation-step',
    label: 'Layer contrast',
    description: 'Controls the difference between stacked surfaces.',
    ranges: { dark: { min: 0, max: 0.24 }, light: { min: 0, max: 0.024 } },
  },
]

export const THEME_OVERRIDE_DEFAULTS: Record<
  ThemeOverrideMode,
  Record<ThemeOverrideKey, number>
> = {
  dark: { chroma: 0.005, contrast: 0.5, surface: 0.19, elevationStep: 0.025 },
  light: { chroma: 0, contrast: 0.53, surface: 0.995, elevationStep: 0.024 },
}

export type ThemeOverrides = Partial<Record<ThemeOverrideKey, number>>
export type ThemeOverridesByMode = Partial<Record<ThemeOverrideMode, ThemeOverrides>>

const themeOverridesSchema = z
  .object({
    chroma: z.number().finite().optional(),
    contrast: z.number().finite().optional(),
    surface: z.number().finite().optional(),
    elevationStep: z.number().finite().optional(),
  })
  .strip()

const themeOverridesByModeSchema = z
  .object({ dark: themeOverridesSchema.optional(), light: themeOverridesSchema.optional() })
  .strip()

export function resolveThemeOverrideMode(resolvedTheme: string | undefined): ThemeOverrideMode {
  return resolvedTheme?.includes('dark') ? 'dark' : 'light'
}

export function getThemeOverrideRange(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode
): ThemeOverrideRange {
  return knob.ranges[mode]
}

export function clampThemeOverride(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  value: number
): number {
  const { min, max } = getThemeOverrideRange(knob, mode)
  return Math.min(max, Math.max(min, value))
}

export function themeOverrideToSliderValue(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  value: number
): number {
  const { min, max } = getThemeOverrideRange(knob, mode)
  const clamped = clampThemeOverride(knob, mode, value)
  return Math.round(((clamped - min) / (max - min)) * 100)
}

export function sliderValueToThemeOverride(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  value: number
): number {
  const { min, max } = getThemeOverrideRange(knob, mode)
  const clamped = Math.min(100, Math.max(0, value))
  return Number((min + (max - min) * (clamped / 100)).toFixed(6))
}

export function getThemeOverrideValue(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  overrides: ThemeOverrides
): number {
  const value = overrides[knob.key] ?? THEME_OVERRIDE_DEFAULTS[mode][knob.key]
  return clampThemeOverride(knob, mode, value)
}

function isDefaultValue(knob: ThemeOverrideKnob, mode: ThemeOverrideMode, value: number): boolean {
  const defaultValue = THEME_OVERRIDE_DEFAULTS[mode][knob.key]
  return (
    themeOverrideToSliderValue(knob, mode, value) ===
    themeOverrideToSliderValue(knob, mode, defaultValue)
  )
}

export function mergeThemeOverride(
  current: ThemeOverridesByMode,
  mode: ThemeOverrideMode,
  key: ThemeOverrideKey,
  value: number
): ThemeOverridesByMode {
  const knob = THEME_OVERRIDE_KNOBS.find((candidate) => candidate.key === key)
  if (knob === undefined) return current

  const nextMode = { ...current[mode] }
  const clamped = clampThemeOverride(knob, mode, value)

  if (isDefaultValue(knob, mode, clamped)) delete nextMode[key]
  else nextMode[key] = clamped

  if (!hasThemeOverrides(nextMode)) return clearThemeOverridesForMode(current, mode)
  return { ...current, [mode]: nextMode }
}

export function clearThemeOverridesForMode(
  current: ThemeOverridesByMode,
  mode: ThemeOverrideMode
): ThemeOverridesByMode {
  const { [mode]: _removed, ...rest } = current
  return rest
}

export function hasThemeOverrides(overrides: ThemeOverrides): boolean {
  return THEME_OVERRIDE_KNOBS.some((knob) => overrides[knob.key] !== undefined)
}

function sanitizeThemeOverrides(
  mode: ThemeOverrideMode,
  overrides: ThemeOverrides
): ThemeOverrides {
  return THEME_OVERRIDE_KNOBS.reduce<ThemeOverrides>((result, knob) => {
    const value = overrides[knob.key]
    if (value === undefined) return result

    const clamped = clampThemeOverride(knob, mode, value)
    if (!isDefaultValue(knob, mode, clamped)) result[knob.key] = clamped
    return result
  }, {})
}

export function parseThemeOverridesByMode(value: unknown): ThemeOverridesByMode {
  const parsed = themeOverridesByModeSchema.safeParse(value)
  if (!parsed.success) return {}

  const dark = sanitizeThemeOverrides('dark', parsed.data.dark ?? {})
  const light = sanitizeThemeOverrides('light', parsed.data.light ?? {})

  return {
    ...(hasThemeOverrides(dark) ? { dark } : {}),
    ...(hasThemeOverrides(light) ? { light } : {}),
  }
}

export function applyThemeOverrides(
  root: HTMLElement,
  mode: ThemeOverrideMode,
  overrides: ThemeOverrides
) {
  THEME_OVERRIDE_KNOBS.forEach((knob) => {
    const value = overrides[knob.key]
    if (value === undefined) root.style.removeProperty(knob.cssVar)
    else root.style.setProperty(knob.cssVar, String(clampThemeOverride(knob, mode, value)))
  })
}

export function previewThemeOverride(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  value: number
) {
  document.documentElement.style.setProperty(
    knob.cssVar,
    String(clampThemeOverride(knob, mode, value))
  )
}
