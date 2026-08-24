/**
 * Design tokens — v1, GENERIC/STRUCTURAL only (Supaimage multi-brand phase).
 *
 * Everything that differs BY BRAND (colors, illustration stroke) moved to
 * lib/design/brands/ — see that module's doc comment. Everything that differs
 * BY FORMAT/PLATFORM (canvas dimensions, icon sizing) moved to
 * lib/design/formats.ts. What's left here is genuinely shared across every
 * brand and format: the typeface and the base grid unit.
 */

export const TOKEN_VERSION = 1

// --- Typography (Manrope throughout, brief §4) -------------------------------
// Roles map to weights. Headline auto-fits within [min,max]; eyebrow is fixed.
export const typography = {
  family: 'Manrope',
  roles: {
    headline: {
      weight: 400 as const,
      // Two auto-fit size tiers instead of one fixed range: `default` (no
      // icon, headline fits in <=2 lines) reads larger since there's nothing
      // else competing for attention; `compact` kicks in whenever an icon is
      // present or the headline needs a 3rd line, so the extra content
      // doesn't crowd the composition.
      sizeTiers: {
        default: { minSize: 48, maxSize: 64 },
        compact: { minSize: 40, maxSize: 56 },
      },
      lineHeight: 1.1,
      // Slightly looser leading once a headline wraps to 2 lines — 1.1 reads
      // fine for a single line but feels a touch tight once there's a
      // second line stacked underneath.
      lineHeightTwoLine: 1.2,
      letterSpacing: -0.02, // em
    },
    eyebrow: {
      weight: 500 as const,
      size: 20,
      lineHeight: 1.2,
      letterSpacing: 0.06, // em — slight tracking for the kicker label
    },
  },
} as const

// --- Composition aids (brief §4) ---------------------------------------------
export const grid = { base: 8 } as const
