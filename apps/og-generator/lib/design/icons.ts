import type { SeedIcon } from '@/lib/assets/seed-icons'

/**
 * Icon rendering + stroke-width normalization (brief §4 / §6).
 *
 * Brand rule: minimal line-art with a locked stroke width (range is
 * brand-specific — see lib/design/brands/). We treat that as the stroke as it
 * appears IN THE FINAL IMAGE — so regardless of an icon's source artboard, we
 * set the SVG's stroke-width in user units such that, scaled to the requested
 * display size, the rendered stroke lands in range. This is the runtime side
 * of the §6 "auto-normalize stroke-width on import" rule; the upload pipeline
 * will apply the same clamp to stored assets later.
 */

// Safe fallback only — every real caller passes `strokePx` explicitly (see
// route.tsx), so this never actually renders; kept as a sane universal
// midpoint rather than threading a brand through a pure rendering-math module.
const FALLBACK_STROKE_PX = 1.6

/** Clamp a desired stroke (px, in the final image) into a brand's locked range. */
export function normalizeStrokePx(px: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, px))
}

interface IconRenderOptions {
  /** Rendered size in px (already scaled for 1x/2x by the caller). */
  sizePx: number
  /** Stroke as it should appear in the final image, px (already scaled). */
  strokePx?: number
  /** Color baked into the SVG (token hex) — an <img> can't inherit CSS color. */
  color: string
}

/** Build a normalized, self-contained SVG string for a seed icon. */
export function iconSvg(icon: SeedIcon, opts: IconRenderOptions): string {
  const strokePx = opts.strokePx ?? FALLBACK_STROKE_PX
  const viewBoxSize = Number(icon.viewBox.split(/\s+/)[2]) || 24
  // user-space stroke so that, scaled to sizePx, the rendered stroke == strokePx
  const strokeWidth = (strokePx * viewBoxSize) / opts.sizePx
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.sizePx}" height="${opts.sizePx}" ` +
    `viewBox="${icon.viewBox}" fill="none" stroke="currentColor" ` +
    `stroke-width="${strokeWidth.toFixed(4)}" stroke-linecap="round" stroke-linejoin="round">` +
    `${icon.body}</svg>`
  return svg.replaceAll('currentColor', opts.color)
}

/** Base64 data-URI (the form satori embeds most reliably) for an `<img src>`. */
export function iconDataUri(icon: SeedIcon, opts: IconRenderOptions): string {
  const svg = iconSvg(icon, opts)
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
