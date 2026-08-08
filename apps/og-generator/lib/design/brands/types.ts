/**
 * Brand abstraction (Supaimage multi-brand phase).
 *
 * Everything that visually differs BETWEEN brands (colors, illustration
 * stroke weight) lives on a `Brand` object; everything that's the SAME across
 * brands (typography scale, the 8px grid unit, canvas/format dimensions)
 * stays in lib/design/tokens.ts and lib/design/formats.ts. A brand is chosen
 * per-request (query param) and threaded explicitly through the renderer —
 * never a hidden global — so adding a third brand later is just a new file
 * here, no other module needs to change.
 */

export type BrandId = 'supabase' | 'multigres' | 'oriole' | 'supasquad'

/**
 * The full set of token names every brand's palette must supply. Keeping this
 * as an explicit union (rather than `keyof typeof someBrand.colorPalette`)
 * means TypeScript enforces that EVERY brand defines EVERY token — a new
 * brand can't silently omit one and fall through to `undefined` at render time.
 */
export type ColorToken =
  | 'bg.primary'
  | 'bg.alt'
  | 'surface.100'
  | 'surface.200'
  | 'border.subtle'
  | 'border.default'
  | 'border.strong'
  | 'brand.default'
  | 'brand.dark'
  | 'brand.tint'
  | 'text.primary'
  | 'text.secondary'
  | 'text.muted'
  | 'illustration.stroke'

export interface Brand {
  id: BrandId
  /** Display name, shown in the Brand selector. */
  name: string
  colorPalette: Record<ColorToken, string>
  illustration: { defaultStrokePx: number }
  strokeWidthRange: { min: number; max: number }
}
