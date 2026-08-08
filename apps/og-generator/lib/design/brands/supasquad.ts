import type { Brand } from './types'

/**
 * Supasquad brand tokens — PLACEHOLDER.
 *
 * Supasquad doesn't have finalized visual guidelines yet. These values exist
 * only to prove the multi-brand system works end-to-end (deliberately
 * distinct from the other brands so brand-switching is visibly obvious).
 * Swap this file for real brand colors/stroke weights whenever Design
 * finalizes them — nothing else in the app needs to change to pick up new
 * values here, that's the point of the abstraction.
 */
export const supasquad: Brand = {
  id: 'supasquad',
  name: 'Supasquad',
  colorPalette: {
    'bg.primary': '#121212',
    'bg.alt': '#120C17',
    'surface.100': '#241A2C',
    'surface.200': '#291E32',
    'border.subtle': '#1E1524',
    'border.default': '#291E32',
    'border.strong': '#372842',
    'brand.default': '#D946EF', // placeholder magenta/pink accent
    'brand.dark': '#A21CAF',
    'brand.tint': 'rgba(217, 70, 239, 0.14)',
    'text.primary': '#FAFAFA',
    'text.secondary': '#B4B4B4',
    'text.muted': '#898989',
    'illustration.stroke': '#FFFFFF',
  },
  illustration: { defaultStrokePx: 4 },
  strokeWidthRange: { min: 1.22, max: 2 },
}
