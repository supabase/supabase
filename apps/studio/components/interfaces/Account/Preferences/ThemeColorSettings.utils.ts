import type { CSSProperties } from 'react'

import type { ThemeOverrideKey, ThemeOverrideMode } from '@/lib/theme-overrides'

/** Full-hue OKLCH spectrum for the spot color track. */
const HUE_SPECTRUM_TRACK =
  'linear-gradient(to right, oklch(0.7 0.14 0), oklch(0.7 0.14 60), oklch(0.7 0.14 120), oklch(0.7 0.14 180), oklch(0.7 0.14 240), oklch(0.7 0.14 300), oklch(0.7 0.14 360))'

type SliderTrackStyle = CSSProperties & {
  '--slider-track-fill': string
}

export function sliderTrackStyle(
  key: ThemeOverrideKey,
  mode: ThemeOverrideMode
): SliderTrackStyle | undefined {
  switch (key) {
    case 'primaryHue':
      return { '--slider-track-fill': HUE_SPECTRUM_TRACK }
    case 'chroma':
      // Grey → tinted at the live surface hue (follows spot via CSS offset).
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.4 0 var(--surface-hue)), oklch(0.4 0.07 var(--surface-hue)))'
            : 'linear-gradient(to right, oklch(0.9 0 var(--surface-hue)), oklch(0.9 0.05 var(--surface-hue)))',
      }
    case 'contrast':
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.35 0 0), oklch(0.9 0 0))'
            : 'linear-gradient(to right, oklch(0.82 0 0), oklch(0.2 0 0))',
      }
    case 'surface':
      // Chroma 0 at the ends avoids out-of-gamut flashes at the caps.
      return {
        '--slider-track-fill':
          'linear-gradient(to right, oklch(0.14 0 0), oklch(0.5 0.015 var(--surface-hue)), oklch(0.97 0 0))',
      }
    case 'elevationStep':
      // Flat → stronger lift between layers (smooth ramp, not hard bands).
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.28 0 var(--surface-hue)), oklch(0.55 0 var(--surface-hue)))'
            : 'linear-gradient(to right, oklch(0.92 0 var(--surface-hue)), oklch(0.99 0 var(--surface-hue)))',
      }
  }
}
