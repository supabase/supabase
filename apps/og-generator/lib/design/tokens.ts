/**
 * Design tokens — v1.
 *
 * Per brief §6.5, the rendered image references colors and fonts by TOKEN NAME
 * (e.g. `bg.primary`), never by raw hex. This module IS the v1 `design_tokens`
 * record. Later it moves to a versioned DB table and the render pipeline
 * resolves names against the active version at render time — so a palette or
 * typeface change is a one-line edit here (or one new DB row), and no stored
 * post layout has to change.
 *
 * Colors are the brief §4 "researched draft" palette, pending Design sign-off.
 * (Verified against the live site: the real brand green IS #3ECF8E. Backgrounds
 * differ slightly — the site uses ~#121212 — but per instruction we keep the §4
 * draft for now; changing a value here is the intended one-line update.)
 */

export const TOKEN_VERSION = 1

// --- Color palette (dark mode only, brief §4) --------------------------------
export const colorPalette = {
  'bg.primary': '#1C1C1C',
  'bg.alt': '#171717',
  'surface.100': '#2A2A2A',
  'surface.200': '#2E2E2E',
  'border.subtle': '#242424',
  'border.default': '#2E2E2E',
  'border.strong': '#363636',
  'brand.default': '#3ECF8E',
  'brand.dark': '#249361',
  'brand.tint': 'rgba(62, 207, 142, 0.14)',
  'text.primary': '#FAFAFA',
  'text.secondary': '#B4B4B4',
  'text.muted': '#898989',
  'illustration.stroke': '#A0A0A0',
} as const

export type ColorToken = keyof typeof colorPalette

/** Resolve a named color token to its hex value for the active version. */
export function color(token: ColorToken): string {
  return colorPalette[token]
}

// --- Typography (Manrope throughout, brief §4) -------------------------------
// Roles map to weights. Headline auto-fits within [min,max]; eyebrow is fixed.
export const typography = {
  family: 'Manrope',
  roles: {
    headline: {
      weight: 500 as const,
      minSize: 40,
      maxSize: 64,
      lineHeight: 1.1,
      letterSpacing: -0.02, // em
    },
    eyebrow: {
      weight: 500 as const,
      size: 22,
      lineHeight: 1.2,
      letterSpacing: 0.06, // em — slight tracking for the kicker label
    },
  },
} as const

// --- Canvas + safe area (brief §3) -------------------------------------------
export const canvas = {
  width: 1200,
  height: 630,
  outerMargin: 64, // -> effective safe area 1072 x 502, centered
  headlineInset: { x: 80, y: 72 }, // tighter inset -> headline text box is 1040 wide
} as const

/** Width (px) of the headline text box, given the headline inset. */
export const headlineBoxWidth = canvas.width - canvas.headlineInset.x * 2 // 1040

// --- Composition aids + illustration constraints (brief §4) ------------------
export const grid = { base: 8 } as const
// Illustration/icon stroke. Default 2px in a neutral gray (illustration.stroke)
// per current direction — Design to finalize. Range widened to include 2px.
export const strokeWidthRange = { min: 1.22, max: 2 } as const
export const illustration = { defaultStrokePx: 2 } as const

/**
 * Serialized v1 record — shape mirrors the future `design_tokens` DB row
 * (version, typeface_config_json, color_palette_json, stroke_width_range,
 * is_active). Kept here so the eventual DB migration is a lift-and-shift.
 */
export const designTokensV1 = {
  version: TOKEN_VERSION,
  is_active: true,
  typeface_config_json: typography,
  color_palette_json: colorPalette,
  stroke_width_range: strokeWidthRange,
  canvas,
  grid,
} as const
