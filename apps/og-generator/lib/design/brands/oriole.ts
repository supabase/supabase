import type { Brand } from './types'

/**
 * Oriole brand tokens — PLACEHOLDER.
 *
 * Oriole doesn't have finalized visual guidelines yet. These values exist
 * only to prove the multi-brand system works end-to-end (deliberately
 * distinct from Supabase's green and Multigres's indigo so brand-switching
 * is visibly obvious). Swap this file for real brand colors/stroke weights
 * whenever Design finalizes them — nothing else in the app needs to change
 * to pick up new values here, that's the point of the abstraction.
 */
export const oriole: Brand = {
  id: 'oriole',
  name: 'Oriole',
  colorPalette: {
    'bg.primary': '#121212',
    'bg.alt': '#15110E',
    'surface.100': '#2A231D',
    'surface.200': '#2E2620',
    'border.subtle': '#241E19',
    'border.default': '#2E2620',
    'border.strong': '#3D3226',
    'brand.default': '#F97316', // placeholder orange accent
    'brand.dark': '#C2410C',
    'brand.tint': 'rgba(249, 115, 22, 0.14)',
    'text.primary': '#FAFAFA',
    'text.secondary': '#B4B4B4',
    'text.muted': '#898989',
    'illustration.stroke': '#FFFFFF',
  },
  illustration: { defaultStrokePx: 4 },
  strokeWidthRange: { min: 1.22, max: 2 },
}
