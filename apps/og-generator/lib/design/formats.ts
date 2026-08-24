/**
 * Format abstraction (Supaimage multi-brand/multi-platform phase).
 *
 * A Format is a canvas size + the size-dependent constants that used to be
 * hardcoded assuming a single 1200×630 canvas (icon size, Thumb bounds).
 * Templates already take W/H/padX/padY as render-time parameters (see
 * lib/design/templates.tsx), so adding a format is mostly just declaring its
 * dimensions here — no template-layout code needs to change for a
 * same-width, different-height format like Twitter's.
 */

export type FormatId = 'og' | 'twitter' | 'newsletter' | 'luma'

export interface Format {
  id: FormatId
  /** Display name, shown in the Format selector. */
  label: string
  /** One-line description shown under the label in the Format selector. */
  blurb: string
  width: number
  height: number
  outerMargin: number
  headlineInset: { x: number; y: number }
  /** OG icon display size (1x design px). */
  iconSize: number
  /**
   * The icon-only "Thumb" variant's size bounds — undefined for formats that
   * don't have a Thumb concept (e.g. a single social post image like Twitter).
   */
  thumb?: { default: number; min: number; max: number }
  /** Label for the PRIMARY composition's preview card, if different from `label`. */
  primaryLabel?: string
  /**
   * A second FULL composition at different dimensions (not an icon-only crop
   * like `thumb`) — e.g. Social's Instagram variant alongside its primary
   * Twitter/X/LinkedIn size. Rendered with the same headline/icon/template
   * recipe as the primary, just a different canvas.
   */
  secondary?: { id: string; label: string; width: number; height: number }
}

export const FORMATS: Record<FormatId, Format> = {
  og: {
    id: 'og',
    label: 'OG',
    blurb: 'Blog posts and articles',
    width: 1200,
    height: 630, // -> effective safe area 1072 x 502, centered (outerMargin 64)
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 }, // tighter inset -> headline text box is 1040 wide
    iconSize: 220,
    thumb: { default: 380, min: 160, max: 480 },
  },
  twitter: {
    id: 'twitter',
    label: 'Social',
    blurb: 'Twitter/X, LinkedIn & Instagram',
    width: 1200,
    height: 627, // Twitter/X/LinkedIn's shared link-card size — same width as
    // OG, so template headline widths carry over unchanged; only the
    // vertical anchor math (already H-parametric) adapts.
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 },
    iconSize: 220,
    primaryLabel: 'Twitter/X/LinkedIn',
    // Full second composition (not an icon-only crop) at Instagram's 4:5 feed
    // ratio — same headline/icon/template recipe, different canvas.
    secondary: { id: 'instagram', label: 'Instagram', width: 1080, height: 1350 },
  },
  newsletter: {
    id: 'newsletter',
    label: 'Newsletter',
    blurb: 'Email header banners',
    width: 1200,
    height: 600, // common 2:1 email-header banner width, same headline-box math as OG.
    outerMargin: 64,
    headlineInset: { x: 80, y: 72 },
    iconSize: 220,
    // No Thumb — a newsletter banner isn't cropped down to an icon-only variant.
  },
  luma: {
    id: 'luma',
    label: 'Luma',
    blurb: 'Event cover images',
    width: 800,
    height: 800, // Luma's square event cover size.
    outerMargin: 43,
    headlineInset: { x: 54, y: 48 }, // same proportions as before, scaled to 800 wide
    iconSize: 145,
    // No Thumb — an event cover isn't cropped down to an icon-only variant.
  },
}

export const DEFAULT_FORMAT_ID: FormatId = 'og'

export const FORMAT_OPTIONS: { id: FormatId; label: string }[] = Object.values(FORMATS).map((f) => ({
  id: f.id,
  label: f.label,
}))

/** Resolve a format id (e.g. from a query param) to a Format, defaulting to OG. */
export function getFormat(id: string | null | undefined): Format {
  if (id && id in FORMATS) return FORMATS[id as FormatId]
  return FORMATS[DEFAULT_FORMAT_ID]
}

/** Width (px) of the headline text box for a plain full-width template, given the format's inset. */
export function fullHeadlineBoxWidth(format: Format): number {
  return format.width - format.headlineInset.x * 2
}
