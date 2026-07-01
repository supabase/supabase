/**
 * Background pattern library (brief §6.7). Tileable SVG patterns used as a
 * subtle texture layer BENEATH the headline/illustration. Controls are kept
 * curated, same philosophy as §5: a fixed set of types, scales, two approved
 * low-contrast colors, and an opacity locked to a low range so a pattern can
 * never threaten text contrast.
 */

export type PatternType = 'grid' | 'dots' | 'hlines' | 'vlines'
export type PatternScale = 'sm' | 'md' | 'lg'
export type PatternColor = 'white' | 'green'

/** Grid spacing per scale, in 1x design px. */
export const PATTERN_SCALE_PX: Record<PatternScale, number> = { sm: 24, md: 40, lg: 64 }

/** Approved low-contrast pattern colors (faint white / faint green). */
export const PATTERN_COLOR_HEX: Record<PatternColor, string> = {
  white: '#FAFAFA',
  green: '#3ECF8E',
}

/** Opacity is locked low — these are texture, not foreground (§6.7). */
export const PATTERN_OPACITY = { min: 0.04, max: 0.12, default: 0.06 }

export function clampPatternOpacity(o: number): number {
  if (!Number.isFinite(o)) return PATTERN_OPACITY.default
  return Math.min(PATTERN_OPACITY.max, Math.max(PATTERN_OPACITY.min, o))
}

export interface PatternConfig {
  type: PatternType | 'none'
  scale: PatternScale
  color: PatternColor
  opacity: number
}

interface PatternRenderOptions extends PatternConfig {
  /** Canvas size in px (already scaled). */
  width: number
  height: number
  /** 1 or 2 — scales grid spacing + line weight with the export. */
  scaleFactor: number
  /** Phase offset (px) to align the grid to the composition (§4 grid-snap). */
  offsetX?: number
  offsetY?: number
}

function tile(type: PatternType, g: number, lineW: number, hex: string): string {
  switch (type) {
    case 'dots':
      return `<circle cx="${g / 2}" cy="${g / 2}" r="${(lineW * 1.2).toFixed(2)}" fill="${hex}"/>`
    case 'grid':
      return `<path d="M0 0 H ${g} M0 0 V ${g}" stroke="${hex}" stroke-width="${lineW}" fill="none"/>`
    case 'hlines':
      return `<path d="M0 0 H ${g}" stroke="${hex}" stroke-width="${lineW}" fill="none"/>`
    case 'vlines':
      return `<path d="M0 0 V ${g}" stroke="${hex}" stroke-width="${lineW}" fill="none"/>`
  }
}

/** Build a full-canvas SVG that tiles the chosen pattern. */
export function patternSvg(o: PatternRenderOptions): string {
  if (o.type === 'none') return ''
  const g = PATTERN_SCALE_PX[o.scale] * o.scaleFactor
  const lineW = 1 * o.scaleFactor
  const hex = PATTERN_COLOR_HEX[o.color]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" ` +
    `viewBox="0 0 ${o.width} ${o.height}">` +
    `<defs><pattern id="p" x="${o.offsetX ?? 0}" y="${o.offsetY ?? 0}" width="${g}" height="${g}" patternUnits="userSpaceOnUse">` +
    `${tile(o.type, g, lineW, hex)}</pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#p)" opacity="${clampPatternOpacity(o.opacity)}"/>` +
    `</svg>`
  )
}

export function patternDataUri(o: PatternRenderOptions): string {
  return `data:image/svg+xml;base64,${Buffer.from(patternSvg(o)).toString('base64')}`
}
