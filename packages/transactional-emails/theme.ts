/**
 * Email clients strip CSS custom properties, so the design tokens cannot travel here as
 * `var(--brand-default)` the way they do in Studio. These are the same values, resolved to
 * hex at the point they were lifted from `packages/ui/build/css/themes/light.css`. If the
 * brand scale moves, re-derive rather than eyeballing a near match.
 *
 * Light only. Dark-mode email is a per-client guess — Gmail and Outlook invert colours by
 * their own rules whatever we declare — so the palette is chosen to survive inversion
 * (no pure white, no pure black) instead of trying to control it.
 */
export const theme = {
  brand: '#3FCF8E',
  brandInk: '#097C4F',
  brandSurface: '#D3F8E4',

  warning: '#DC7B18',
  warningSurface: '#FFF4D5',

  destructive: '#E54D2E',
  destructiveInk: '#CA3214',
  destructiveSurface: '#FFF0EE',

  /** Page canvas behind the 600px card. */
  canvas: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  foreground: '#171717',
  foregroundLight: '#525252',
  foregroundLighter: '#737373',

  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
} as const

export const font = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
} as const

export const CONTAINER_WIDTH = 600
