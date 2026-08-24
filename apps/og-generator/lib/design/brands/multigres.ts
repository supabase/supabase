import type { Brand } from './types'

/**
 * Multigres brand tokens — PLACEHOLDER.
 *
 * Multigres doesn't have finalized visual guidelines yet. These values exist
 * only to prove the multi-brand system works end-to-end (deliberately
 * distinct from Supabase's green so brand-switching is visibly obvious).
 * Swap this file for real brand colors/stroke weights whenever Design
 * finalizes them — nothing else in the app needs to change to pick up new
 * values here, that's the point of the abstraction.
 */
export const multigres: Brand = {
  id: 'multigres',
  name: 'Multigres',
  colorPalette: {
    'bg.primary': '#121212',
    'bg.alt': '#111218',
    'surface.100': '#22242E',
    'surface.200': '#262833',
    'border.subtle': '#1E202A',
    'border.default': '#262833',
    'border.strong': '#333644',
    'brand.default': '#6366F1', // placeholder indigo accent
    'brand.dark': '#4338CA',
    'brand.tint': 'rgba(99, 102, 241, 0.14)',
    'text.primary': '#FAFAFA',
    'text.secondary': '#B4B4B4',
    'text.muted': '#898989',
    'illustration.stroke': '#FFFFFF',
  },
  illustration: { defaultStrokePx: 4 },
  strokeWidthRange: { min: 1.22, max: 2 },
}
