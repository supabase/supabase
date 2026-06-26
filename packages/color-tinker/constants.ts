import type { ColorInputConfig } from './types'

export const ENABLED_STORAGE_KEY = 'color-system-tinker-enabled'
export const VALUES_STORAGE_KEY = 'color-system-tinker'

export const COLOR_INPUTS = [
  { name: '--surface-hue', label: 'Surface hue', min: 0, max: 360, step: 1, decimals: 0 },
  { name: '--primary-hue', label: 'Brand hue', min: 0, max: 360, step: 1, decimals: 0 },
  { name: '--surface', label: 'Surface', min: 0, max: 1, step: 0.01, decimals: 2 },
  {
    name: '--elevation-step',
    label: 'Surface step',
    min: -0.08,
    max: 0.08,
    step: 0.001,
    decimals: 4,
  },
  { name: '--chroma', label: 'Chroma', min: 0, max: 0.15, step: 0.001, decimals: 3 },
  { name: '--contrast', label: 'Contrast', min: 0, max: 1, step: 0.01, decimals: 2 },
] as const satisfies readonly ColorInputConfig[]
