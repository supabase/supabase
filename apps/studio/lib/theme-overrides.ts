/**
 * POC: user-facing overrides for the primary colour-system inputs defined in
 * `packages/ui/build/css/source/semantic.css`.
 *
 * `semantic.css` derives every semantic colour in OKLCH from a small set of
 * inputs. Four of those are exposed here as knobs; hue is deliberately left
 * out for now. Defaults mirror the values the shipped themes set
 * (`packages/ui/build/css/themes/dark.css` and `light.css`) so a slider starts
 * where the active theme actually sits, and clearing an override falls back to
 * the stylesheet value rather than a hardcoded one.
 */

export type ThemeOverrideKey = 'chroma' | 'contrast' | 'surface' | 'elevationStep'

export type ThemeOverrideMode = 'dark' | 'light'

export interface ThemeOverrideKnob {
  key: ThemeOverrideKey
  /** Custom property the knob writes to on the document element. */
  cssVar: string
  label: string
  description: string
  min: number
  max: number
  step: number
  /**
   * CSS `background-image` for the expressive slider's track, so the control
   * previews the property it sets. Built from the live theme custom properties
   * rather than fixed colours, so each track re-renders as the theme changes.
   */
  trackImage: string
}

export const THEME_OVERRIDE_KNOBS: readonly ThemeOverrideKnob[] = [
  {
    key: 'chroma',
    cssVar: '--chroma',
    label: 'Chroma',
    description: 'Colour saturation of the neutral surface, text and border ramp. 0 is grayscale.',
    min: 0,
    max: 0.06,
    step: 0.001,
    // Neutral on the left, tinted at the theme's own hue on the right.
    trackImage:
      'linear-gradient(to right, oklch(from var(--foreground) l 0 h / 0.08), oklch(from var(--foreground) l 0.14 h / 0.16))',
  },
  {
    key: 'contrast',
    cssVar: '--contrast',
    label: 'Contrast',
    description: 'Strength of text, borders and accents against their surface. 0.5 is baseline.',
    min: 0,
    max: 1,
    step: 0.01,
    // Flat on the left, fully separated from the surface on the right.
    trackImage: 'linear-gradient(to right, transparent, var(--tertiary))',
  },
  {
    key: 'surface',
    cssVar: '--surface',
    label: 'Surface',
    description: 'Base lightness of the canvas that every elevated surface steps away from.',
    min: 0,
    max: 1,
    step: 0.005,
    // The canvas lightness range the knob sweeps, at the theme's chroma and hue.
    trackImage:
      'linear-gradient(to right, oklch(0.15 var(--chroma) var(--surface-hue) / 0.22), oklch(0.98 var(--chroma) var(--surface-hue) / 0.22))',
  },
  {
    key: 'elevationStep',
    cssVar: '--elevation-step',
    label: 'Elevation step',
    description: 'Lightness added per elevation level. 0 renders every surface flat.',
    min: 0,
    max: 0.08,
    step: 0.001,
    // Four flat bands: the surface, then the elevation 1-3 overlays the knob
    // spaces apart. Flattening the knob visibly flattens the bands.
    trackImage:
      'linear-gradient(to right, transparent 0 25%, var(--muted) 25% 50%, var(--accent) 50% 75%, var(--tertiary) 75% 100%)',
  },
]

/** Mirrors the values each shipped theme sets for the knobs above. */
export const THEME_OVERRIDE_DEFAULTS: Record<
  ThemeOverrideMode,
  Record<ThemeOverrideKey, number>
> = {
  dark: { chroma: 0.005, contrast: 0.5, surface: 0.19, elevationStep: 0.025 },
  light: { chroma: 0, contrast: 0.53, surface: 0.995, elevationStep: 0.024 },
}

export type ThemeOverrides = Partial<Record<ThemeOverrideKey, number>>

/**
 * Overrides are stored per mode: `--surface` is 0.19 in dark and 0.995 in
 * light, so a single shared value would be meaningless across a mode switch.
 */
export type ThemeOverridesByMode = Partial<Record<ThemeOverrideMode, ThemeOverrides>>

/** next-themes exposes `classic-dark` too, which resolves to the dark defaults. */
export function resolveThemeOverrideMode(resolvedTheme: string | undefined): ThemeOverrideMode {
  return resolvedTheme?.includes('dark') ? 'dark' : 'light'
}

export function clampThemeOverride(knob: ThemeOverrideKnob, value: number): number {
  return Math.min(knob.max, Math.max(knob.min, value))
}

export function getThemeOverrideValue(
  knob: ThemeOverrideKnob,
  mode: ThemeOverrideMode,
  overrides: ThemeOverrides
): number {
  return overrides[knob.key] ?? THEME_OVERRIDE_DEFAULTS[mode][knob.key]
}

/** Renders a value at the knob's step precision, avoiding float noise like 0.019000000000000003. */
export function formatThemeOverrideValue(knob: ThemeOverrideKnob, value: number): string {
  const decimals = (String(knob.step).split('.')[1] ?? '').length
  return value.toFixed(decimals)
}

/**
 * Merges one knob value into the per-mode store.
 *
 * Pure, so the merge can be exercised without React: writing one knob must
 * leave its siblings alone, and writing one mode must leave the other mode's
 * overrides alone.
 */
export function mergeThemeOverride(
  current: ThemeOverridesByMode,
  mode: ThemeOverrideMode,
  key: ThemeOverrideKey,
  value: number
): ThemeOverridesByMode {
  return { ...current, [mode]: { ...current[mode], [key]: value } }
}

/** Drops every override for one mode, leaving the other mode's untouched. */
export function clearThemeOverridesForMode(
  current: ThemeOverridesByMode,
  mode: ThemeOverrideMode
): ThemeOverridesByMode {
  return { ...current, [mode]: {} }
}

export function hasThemeOverrides(overrides: ThemeOverrides): boolean {
  return THEME_OVERRIDE_KNOBS.some((knob) => overrides[knob.key] !== undefined)
}

/**
 * Writes the overrides as inline custom properties on the document element.
 * Inline styles outrank the theme's own `[data-theme='…']` rule, and removing
 * a property hands control back to the stylesheet.
 */
export function applyThemeOverrides(root: HTMLElement, overrides: ThemeOverrides) {
  THEME_OVERRIDE_KNOBS.forEach((knob) => {
    const value = overrides[knob.key]
    if (value === undefined) {
      root.style.removeProperty(knob.cssVar)
    } else {
      root.style.setProperty(knob.cssVar, String(clampThemeOverride(knob, value)))
    }
  })
}

/**
 * Writes a single knob straight to the document element while a slider is
 * being dragged. The sliders are driven from local state during interaction,
 * so the visual update must not depend on `ThemeOverridesProvider` re-running
 * its effect — that only happens once the value is persisted on commit.
 */
export function previewThemeOverride(knob: ThemeOverrideKnob, value: number) {
  document.documentElement.style.setProperty(knob.cssVar, String(clampThemeOverride(knob, value)))
}
