import type { Brand } from './types'

/**
 * Supabase brand tokens — the exact v1 palette from the original
 * (pre-multi-brand) lib/design/tokens.ts, moved here verbatim. No visual
 * change for existing Supabase renders (brief §4 "researched draft" palette,
 * pending Design sign-off; real brand green confirmed #3ECF8E on the live site).
 */
export const supabase: Brand = {
  id: 'supabase',
  name: 'Supabase',
  colorPalette: {
    'bg.primary': '#121212',
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
    'illustration.stroke': '#FFFFFF',
  },
  illustration: { defaultStrokePx: 4 },
  strokeWidthRange: { min: 1.22, max: 2 },
}
