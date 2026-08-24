import type { CSSProperties, ReactElement, ReactNode } from 'react'

import type { Format } from '@/lib/design/formats'
import { fullHeadlineBoxWidth } from '@/lib/design/formats'

/**
 * Multi-template registry (brief §5.6). Each template is a guardrailed layout
 * that already satisfies the safe area + alignment rules — the user picks one
 * and customizes copy/icon within it, rather than building from a blank canvas.
 *
 * Templates are data: id, the headline text-box width the auto-fit measures
 * against, intrinsic text alignment, and a `build` that arranges the
 * pre-rendered pieces into the satori root. This shape maps onto the future
 * `templates` table's og_schema_json (§8).
 */

export interface TemplateParts {
  W: number
  H: number
  padX: number
  padY: number
  bg: string
  scaleFactor: number
  textBlock: ReactNode
  iconEl: ReactNode | null
  hasIcon: boolean
  /** Fixed Supabase wordmark, pre-sized to `logoHeight` — for `noIcon` templates. */
  logoEl: ReactNode
  logoHeight: number
  /** Resolved partner logo/icon tiles (1-4), for logo-grid. */
  logoTiles?: ReactNode[]
  /** Which element-arrangement variant to render (0-based) — see `Template.arrangementCount`. */
  arrangement?: number
  /** Single icon/logo pre-sized to 50% of `thumbBox` — Announcement's OG logo. */
  halfThumbLogoEl?: ReactNode | null
  /** Single icon pre-sized to `ICON_TILE_ICON_SIZE_1X` — icon-layout's icon inside its chip bounding box. */
  boxedIconEl?: ReactNode | null
  /** Same icon, pre-sized to `GRID_ARRANGEMENT_ICON_GLYPH_SIZE_1X` — icon-layout arrangement 0's larger chip. */
  gridArrangementIconEl?: ReactNode | null
  /** Same icon, pre-sized to `GRAPH_PAPER_ICON_GLYPH_SIZE_1X` — icon-layout arrangement 1's chip. */
  graphPaperIconEl?: ReactNode | null
  /** Same icon, pre-sized to `CIRCLES_ARRANGEMENT_ICON_GLYPH_SIZE_1X` — icon-layout arrangement 3's chip. */
  circlesArrangementIconEl?: ReactNode | null
  /** Whether to render the Supabase wordmark signature — logo-grid only, toggleable since it already shows partner marks. Defaults to true. */
  showBrandLogo?: boolean
  /** Rendered height (px, pre-scaled) of the eyebrow pill + its gap above the headline, or 0 if no eyebrow — Announcement uses this to keep the headline from drifting too far down when an eyebrow is present. */
  eyebrowBlockHeight?: number
  /** Number of headline lines actually rendered (from fitHeadline) — Announcement shifts a 2-line headline up so it doesn't crowd the logo below. */
  headlineLineCount?: number
  /** Full-canvas background texture data URI (lib/design/og-backgrounds.ts), or null for a flat `bg` color — applied by backgroundPanel() so any template can opt in. */
  backgroundImageUri?: string | null
}

export interface Template {
  id: string
  label: string
  /**
   * Groups templates into labeled sections in the Layout picker (§ editor
   * UI) — a flat grid stops scaling once a format has more than a
   * handful of layouts.
   */
  category: string
  /** Headline text-box width (1x px) the auto-fit measures against, for a given format + arrangement. */
  headlineBox: (format: Format, arrangement?: number) => number
  textAlign: 'left' | 'center' | 'right'
  /** Overrides `textAlign` per arrangement variant — only needed by grouped templates whose sub-layouts don't share one alignment (e.g. icon-layout's centered variant). */
  textAlignForArrangement?: (arrangement: number) => 'left' | 'center' | 'right'
  /** Where the content sits (§4). */
  anchorX: 'left' | 'center' | 'right'
  anchorY: 'top' | 'center' | 'bottom'
  build: (p: TemplateParts) => ReactElement
  /**
   * Renders the fixed Supabase wordmark instead of the user-selectable
   * icon/logo system — hides the Icon control in the sidebar since there's
   * nothing for it to affect.
   */
  noIcon?: boolean
  /** Hides the Eyebrow control and omits the eyebrow pill from the render. */
  noEyebrow?: boolean
  /** Per-arrangement override of `noEyebrow` — for grouped templates where only some sub-layouts have no room for an eyebrow. */
  noEyebrowForArrangement?: (arrangement: number) => boolean
  /** Number of alternate element-arrangement variants (default 1 = none) — drives the "Alternate layouts" pager. */
  arrangementCount?: number
  /** Overrides the default square Thumb box (1x px) — e.g. Announcement's 375×200 logo-only thumb. */
  thumbBox?: { width: number; height: number }
  /** Caps headline line count below the default 3 (e.g. Announcement's 2-line max). */
  maxHeadlineLines?: number
  /** Pins the auto-fit font-size range instead of the default hasIcon-based tier (e.g. Announcement's fixed 72px-at-one-line). */
  headlineSizeTier?: { minSize: number; maxSize: number }
  /** Per-arrangement override of fitHeadline's singleLineMaxFraction (default 0.7) — for arrangements whose headline box is already narrower than the format's full width, so the same fraction would force a 2-line wrap much sooner than the canvas actually needs. */
  singleLineMaxFractionForArrangement?: (arrangement: number) => number | undefined
}

// Shared icon "chip" bounding box (Partner logos' tile look, reused by
// icon-layout) — fixed 160px dark rounded box, sized to hold a 64px icon.
export const ICON_TILE_SIZE_1X = 160
export const ICON_TILE_ICON_SIZE_1X = 64
const ICON_TILE_RADIUS_1X = 16
const ICON_TILE_BORDER_WIDTH_1X = 1.5
const ICON_TILE_BG = '#171717'
const ICON_TILE_BORDER_COLOR = '#444444'

/** Wraps `content` (expected to be `ICON_TILE_ICON_SIZE_1X`-sized) in the shared dark chip box. */
function iconTile(p: TemplateParts, content: ReactNode): ReactElement {
  return iconTileAtScale(p.scaleFactor, content)
}

function iconTileAtScale(scaleFactor: number, content: ReactNode, sizePx1x: number = ICON_TILE_SIZE_1X): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizePx1x * scaleFactor,
        height: sizePx1x * scaleFactor,
        borderRadius: ICON_TILE_RADIUS_1X * scaleFactor,
        backgroundColor: ICON_TILE_BG,
        border: `${ICON_TILE_BORDER_WIDTH_1X * scaleFactor}px solid ${ICON_TILE_BORDER_COLOR}`,
      }}
    >
      {content}
    </div>
  )
}

/**
 * Row of logo-grid's tile chips (with the "x" separator for the 2-tile
 * case) at an arbitrary scale — shared by the OG composition and the Thumb
 * view so Thumb renders exactly the same tile look, just bigger/smaller.
 */
export function logoTilesRow(tiles: ReactNode[], scaleFactor: number): ReactElement | null {
  if (tiles.length === 0) return null
  const tileGap = 20 * scaleFactor
  const sepFontSize = 32 * scaleFactor
  const rowChildren: ReactNode[] = []
  tiles.forEach((tile, i) => {
    rowChildren.push(
      <div key={`tile-${i}`} style={{ display: 'flex' }}>
        {iconTileAtScale(scaleFactor, tile)}
      </div>
    )
    if (tiles.length === 2 && i === 0) {
      rowChildren.push(
        <div
          key="sep"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sepFontSize,
            color: 'rgba(255,255,255,0.35)',
            fontSize: sepFontSize,
            fontWeight: 500,
          }}
        >
          x
        </div>
      )
    }
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: tileGap }}>
      {rowChildren}
    </div>
  )
}

// Gap (1x px) between the headline and the icon column in split-right.
const SPLIT_RIGHT_GAP = 56

// icon-layout arrangement 0 (headline bottom-left, icon top-right, paired
// with the grid-background texture) — its own icon chip size, distinct from
// the shared ICON_TILE_SIZE_1X other arrangements use.
const GRID_ARRANGEMENT_ICON_TILE_SIZE_1X = 244.07
// Fixed distance (1x px) from the true canvas edges, not from the padded
// content box — a brand-guideline placement independent of headlineInset.
const GRID_ARRANGEMENT_ICON_TOP_1X = 73
const GRID_ARRANGEMENT_ICON_RIGHT_1X = 69

// icon-layout arrangement 1 (headline left, icon right, paired with the
// graph-paper texture) — its own headline cap and fixed icon chip/position.
const GRAPH_PAPER_HEADLINE_MAX_WIDTH_1X = 559
const GRAPH_PAPER_ICON_TILE_SIZE_1X = 320
const GRAPH_PAPER_ICON_TOP_1X = 160
const GRAPH_PAPER_ICON_RIGHT_1X = 84

// icon-layout arrangement 3 (paired with the concentric-circles texture) —
// same headline position as arrangement 1, its own fixed icon chip/position.
// 575 keeps the widest possible line clear of the pattern's leftmost visible
// point (measured at ~x669 on the OG canvas, i.e. ~589px of clear space from
// the left inset — 575 leaves a small safety margin).
const CIRCLES_ARRANGEMENT_HEADLINE_MAX_WIDTH_1X = 575
const CIRCLES_ARRANGEMENT_ICON_TILE_SIZE_1X = 210.72
const CIRCLES_ARRANGEMENT_ICON_TOP_1X = 209.65
const CIRCLES_ARRANGEMENT_ICON_RIGHT_1X = 76.09

// How far (1x px) logo-center-left's logo sits above dead-center vertically.
const LOGO_CENTER_LIFT_1X = 40

// Announcement: distance (1x px) from the canvas bottom edge to the *bottom*
// of the centered logo — a fixed brand guideline, not tied to headlineInset.
const ANNOUNCEMENT_LOGO_BOTTOM_1X = 80

// Announcement headline: fixed max box width (brand guideline). This box
// width only feeds the wrap-fit decision (satori still renders each line at
// its own natural width, centered) — 1100 is the smallest round number past
// the ~1067px needed for the default "Hydra joins Supabase" example to pass
// the single-line-max-fraction check (fit-headline.ts) and render on one
// line at 72px instead of force-wrapping to two.
const ANNOUNCEMENT_HEADLINE_MAX_WIDTH_1X = 1100

// The headline block is vertically centered on the canvas, which centers a
// 2-line headline's extra height evenly above AND below — pushing it down
// closer to the logo. Shift a 2-line headline up by this much (1x px) so it
// reads as growing upward instead of crowding the logo below.
const ANNOUNCEMENT_TWO_LINE_SHIFT_UP_1X = 40

function rootBase(p: TemplateParts): CSSProperties {
  return {
    position: 'relative',
    width: p.W,
    height: p.H,
    display: 'flex',
    padding: `${p.padY}px ${p.padX}px`,
    backgroundColor: p.bg,
    fontFamily: 'Manrope',
  }
}

/**
 * Background-texture layer — spans the full canvas (the source PNGs are
 * authored at exactly 2x the canvas, 2400x1260, so `auto ${p.H}px` scales
 * them down to fill it edge-to-edge with no crop). Render first (behind
 * other content) in any template that opts in via `backgroundImageUri`.
 */
function backgroundPanel(p: TemplateParts): ReactNode {
  if (!p.backgroundImageUri) return null
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        // The root container has padY/padX padding, and `top`/`right`/`bottom`
        // on an absolutely-positioned child resolve against its *padding*
        // box — so 0 here would inset the layer from the true canvas edges
        // by that padding instead of reaching them. Negative-offset by the
        // same amount to escape the padding and span the full canvas.
        top: -p.padY,
        right: -p.padX,
        bottom: -p.padY,
        left: -p.padX,
        backgroundImage: `url(${p.backgroundImageUri})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        // Two explicit px values here (`WpxHpx`) makes satori silently drop
        // the whole backgroundImage, so this single-axis `auto` form is the
        // only one that reliably renders — the source's 2x-canvas aspect
        // ratio means it still lands exactly full-bleed, no crop.
        backgroundSize: `auto ${p.H}px`,
      }}
    />
  )
}

/**
 * An icon chip pinned at a fixed distance from the canvas's true top/right
 * edges — used by icon-layout's arrangements 0/1/3, each of which is now
 * tied to its own background texture and never moves regardless of headline
 * length or icon presence. A plain top/left absolute child (no matching
 * bottom/right pair) resolves directly against the true canvas edges in
 * satori — no padding escape needed (unlike backgroundPanel's four-sided
 * stretch, which does need it). satori also doesn't reliably support a
 * negative `right` with an intrinsically-sized child, so the horizontal
 * position is expressed as a computed `left` instead.
 */
function fixedPositionIcon(p: TemplateParts, icon: ReactNode, topPx1x: number, rightPx1x: number, tileSizePx1x: number): ReactNode {
  if (!icon) return null
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: topPx1x * p.scaleFactor,
        left: p.W - rightPx1x * p.scaleFactor - tileSizePx1x * p.scaleFactor,
      }}
    >
      {icon}
    </div>
  )
}

export const TEMPLATES: Template[] = [
  {
    id: 'icon-layout',
    label: 'Headline + icon',
    category: 'Icon layouts',
    // arrangement 0: bottom-left (grid-background) · 1: split-right
    // (graph-paper) · 2: centered (no texture) · 3: split-right variant
    // (concentric-circles) — each background is tied 1:1 to its arrangement
    // (see ICON_LAYOUT_ARRANGEMENT_BACKGROUND in app/api/og/route.tsx), not
    // user-selectable.
    headlineBox: (format, arrangement = 0) =>
      arrangement === 1
        ? Math.min(GRAPH_PAPER_HEADLINE_MAX_WIDTH_1X, fullHeadlineBoxWidth(format) - format.iconSize - SPLIT_RIGHT_GAP)
        : arrangement === 2
          ? Math.round(format.width * 0.75)
          : arrangement === 3
            ? Math.min(CIRCLES_ARRANGEMENT_HEADLINE_MAX_WIDTH_1X, fullHeadlineBoxWidth(format) - format.iconSize - SPLIT_RIGHT_GAP)
            : fullHeadlineBoxWidth(format),
    textAlign: 'left',
    textAlignForArrangement: (arrangement) => (arrangement === 2 ? 'center' : 'left'),
    anchorX: 'left',
    anchorY: 'bottom',
    arrangementCount: 4,
    // Matches Partner logos' headline size (the default tier) rather than
    // the usual hasIcon-driven compact tier — the boxed icon here doesn't
    // need the extra headline room the compact tier exists for.
    headlineSizeTier: { minSize: 48, maxSize: 64 },
    // Centered (3/4) has no room for an eyebrow above the headline.
    noEyebrowForArrangement: (arrangement) => arrangement === 2,
    // Arrangements 1-3 (graph-paper, centered, concentric-circles) each use
    // a headline box already narrower than the format's full width, so the
    // default 0.7 fraction forces a 2-line wrap much sooner than the canvas
    // actually needs — loosen it so more headlines stay on one line.
    singleLineMaxFractionForArrangement: (arrangement) => (arrangement >= 1 && arrangement <= 3 ? 0.85 : undefined),
    build: (p) => {
      const arrangement = p.arrangement ?? 0
      // Icon renders inside the same dark chip bounding box Partner logos
      // uses, not bare — consistent icon treatment across both templates.
      const icon = p.hasIcon ? iconTile(p, p.boxedIconEl) : null
      // Each of arrangements 0/1/3 pairs with its own background texture and
      // gets its own fixed icon chip size — not the shared ICON_TILE_SIZE_1X.
      const gridIcon = p.hasIcon
        ? iconTileAtScale(p.scaleFactor, p.gridArrangementIconEl, GRID_ARRANGEMENT_ICON_TILE_SIZE_1X)
        : null
      const graphPaperIcon = p.hasIcon
        ? iconTileAtScale(p.scaleFactor, p.graphPaperIconEl, GRAPH_PAPER_ICON_TILE_SIZE_1X)
        : null
      const circlesIcon = p.hasIcon
        ? iconTileAtScale(p.scaleFactor, p.circlesArrangementIconEl, CIRCLES_ARRANGEMENT_ICON_TILE_SIZE_1X)
        : null
      // Full-bleed now, so it reads fine behind any arrangement.
      if (arrangement === 1) {
        // Headline left (vertically centered); icon fixed top-right,
        // paired with the graph-paper texture — position never changes.
        return (
          <div
            style={{
              ...rootBase(p),
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            {backgroundPanel(p)}
            {fixedPositionIcon(p, graphPaperIcon, GRAPH_PAPER_ICON_TOP_1X, GRAPH_PAPER_ICON_RIGHT_1X, GRAPH_PAPER_ICON_TILE_SIZE_1X)}
            {p.textBlock}
          </div>
        )
      }
      if (arrangement === 2) {
        // Centered.
        return (
          <div
            style={{
              ...rootBase(p),
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {backgroundPanel(p)}
            {icon ? <div style={{ display: 'flex', marginBottom: 36 * p.scaleFactor }}>{icon}</div> : null}
            {p.textBlock}
          </div>
        )
      }
      if (arrangement === 3) {
        // Same horizontal headline position as arrangement 1 (left), but
        // bottom-aligned (headline + eyebrow sit at the bottom edge, not
        // vertically centered); icon fixed top-right at its own
        // offset/size, paired with the concentric-circles texture —
        // position never changes.
        return (
          <div
            style={{
              ...rootBase(p),
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
            }}
          >
            {backgroundPanel(p)}
            {fixedPositionIcon(p, circlesIcon, CIRCLES_ARRANGEMENT_ICON_TOP_1X, CIRCLES_ARRANGEMENT_ICON_RIGHT_1X, CIRCLES_ARRANGEMENT_ICON_TILE_SIZE_1X)}
            {p.textBlock}
          </div>
        )
      }
      // arrangement 0 (default): headline bottom-left; icon fixed top-right,
      // paired with the grid-background texture — position never changes.
      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            // The icon is absolutely positioned (fixed top/right offset, not
            // part of this flex flow), so the headline always just anchors
            // to the bottom regardless of whether an icon is set.
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          {backgroundPanel(p)}
          {fixedPositionIcon(p, gridIcon, GRID_ARRANGEMENT_ICON_TOP_1X, GRID_ARRANGEMENT_ICON_RIGHT_1X, GRID_ARRANGEMENT_ICON_TILE_SIZE_1X)}
          {p.textBlock}
        </div>
      )
    },
  },
  {
    id: 'logo-layout',
    label: 'Headline + logo',
    category: 'Logo layouts',
    // arrangement 0: logo top-left · 1: logo left, text right · 2: logo center-left
    // (formerly 3 separate template ids — grouped the same way as icon-layout).
    headlineBox: (format, arrangement = 0) =>
      arrangement === 1 ? Math.min(580, fullHeadlineBoxWidth(format) - format.width * 0.28) : fullHeadlineBoxWidth(format),
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    noIcon: true,
    arrangementCount: 3,
    // Logo center, text bottom (3/3) has no room for an eyebrow.
    noEyebrowForArrangement: (arrangement) => arrangement === 2,
    build: (p) => {
      const arrangement = p.arrangement ?? 0
      if (arrangement === 1) {
        // Logo left, text right.
        return (
          <div style={{ ...rootBase(p), flexDirection: 'row', alignItems: 'stretch' }}>
            <div
              style={{
                display: 'flex',
                flex: '0 0 28%',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              {p.logoEl}
            </div>
            <div
              style={{
                display: 'flex',
                flex: '1 1 auto',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <div style={{ display: 'flex', maxWidth: 580 * p.scaleFactor }}>{p.textBlock}</div>
            </div>
          </div>
        )
      }
      if (arrangement === 2) {
        // Logo center, text bottom.
        return (
          <div style={{ ...rootBase(p), position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                left: p.padX,
                top: '50%',
                // Sit a bit above dead-center — nudges the logo up off the
                // true vertical midpoint so it doesn't read as mechanically
                // centered against the bottom-anchored text.
                marginTop: -(p.logoHeight / 2) - LOGO_CENTER_LIFT_1X * p.scaleFactor,
              }}
            >
              {p.logoEl}
            </div>
            <div style={{ display: 'flex', position: 'absolute', left: p.padX, bottom: p.padY }}>
              {p.textBlock}
            </div>
          </div>
        )
      }
      // arrangement 0 (default): logo top-left, text bottom-left.
      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex' }}>{p.logoEl}</div>
          {p.textBlock}
        </div>
      )
    },
  },
  {
    id: 'logo-grid',
    label: 'Partner logos',
    category: 'Announcement layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    // Uses its own multi-tile icon picker (1-4 logos) instead of the
    // single-icon control — hides that control the same way the fixed-logo
    // wordmark templates do.
    noIcon: true,
    // 0/1 = the 2-tile "ChatGPT app" example, 2/3 = the 4-tile "Supabase
    // for Platforms" example — each pairs a base order (icons above
    // headline) with a reversed sibling (headline above icons).
    arrangementCount: 4,
    build: (p) => {
      const tiles = p.logoTiles ?? []
      const tilesRow = logoTilesRow(tiles, p.scaleFactor)

      // Arrangement cycles which row sits top vs. bottom within the
      // space-between column below — the wordmark signature stays fixed in
      // the bottom-right corner regardless. Tile count/content is untouched
      // by this; that's the sidebar's "Logo tiles" stepper's job, not this
      // pager's. 1 and 2 put the headline on top; 0 and 3 put the tiles on
      // top (each content set's reversed sibling flips the other way).
      const headlineOnTop = p.arrangement === 1 || p.arrangement === 2
      const stackedChildren = headlineOnTop ? [p.textBlock, tilesRow] : [tilesRow, p.textBlock]

      return (
        <div
          style={{
            ...rootBase(p),
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {stackedChildren}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              right: p.padX,
              bottom: p.padY,
              alignItems: 'center',
            }}
          >
            {p.showBrandLogo !== false ? p.logoEl : null}
          </div>
        </div>
      )
    },
  },
  {
    id: 'announcement',
    label: 'Announcement',
    category: 'Announcement layouts',
    // Fixed 704px box (brand guideline) rather than a fraction of the format
    // width — pairs with the 72px-at-one-line size tier below.
    headlineBox: () => ANNOUNCEMENT_HEADLINE_MAX_WIDTH_1X,
    textAlign: 'center',
    anchorX: 'center',
    anchorY: 'top',
    // Brand guideline caps this composition at 2 lines (vs. the usual 3),
    // pins the font size (72px at one line, shrinking only if a 2nd line is
    // needed) instead of the default hasIcon-based tier, and its Thumb
    // companion is a fixed 375×200 logo box instead of the default square
    // icon crop — the OG logo below is 50% of that box.
    maxHeadlineLines: 2,
    headlineSizeTier: { minSize: 40, maxSize: 72 },
    thumbBox: { width: 375, height: 200 },
    build: (p) => (
      <div style={{ ...rootBase(p), position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              // Centering the full eyebrow+headline block would push the
              // headline down by the eyebrow's whole height when one's
              // present — shift back up by that full amount (plain px, not
              // a percentage — satori's transform/calc doesn't support
              // mixing the two) so the headline's position is unaffected by
              // whether an eyebrow is showing; the eyebrow just extends the
              // composition upward instead. A 2-line headline gets an extra
              // upward shift (see ANNOUNCEMENT_TWO_LINE_SHIFT_UP_1X) so it
              // doesn't crowd the logo below.
              marginTop:
                -(p.eyebrowBlockHeight ?? 0) -
                (p.headlineLineCount === 2 ? ANNOUNCEMENT_TWO_LINE_SHIFT_UP_1X * p.scaleFactor : 0),
            }}
          >
            {p.textBlock}
          </div>
        </div>
        {p.halfThumbLogoEl && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: p.padX,
              right: p.padX,
              bottom: ANNOUNCEMENT_LOGO_BOTTOM_1X * p.scaleFactor,
              justifyContent: 'center',
            }}
          >
            {p.halfThumbLogoEl}
          </div>
        )}
      </div>
    ),
  },
]

/**
 * Newsletter-only layouts (brief follow-up) — a full hero banner for the
 * top of an email, and a compact divider-style header used to break up
 * sections further down. Kept out of TEMPLATES so the standard 4 layouts
 * stay format-agnostic; the editor swaps in this set only when the
 * Newsletter format is selected.
 */
export const NEWSLETTER_TEMPLATES: Template[] = [
  {
    id: 'newsletter-cover',
    label: 'Newsletter cover',
    category: 'Newsletter layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: p.hasIcon ? 'space-between' : 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        {p.hasIcon ? (
          <div style={{ display: 'flex', width: p.W - p.padX * 2, justifyContent: 'flex-end' }}>
            {p.iconEl}
          </div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'newsletter-section',
    label: 'Section header',
    category: 'Newsletter layouts',
    // A compact divider row, not a full banner — narrower box for a short,
    // single-line section title rather than a full headline.
    headlineBox: (format) => Math.round(fullHeadlineBoxWidth(format) * 0.6),
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'center',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 32 * p.scaleFactor,
        }}
      >
        {p.iconEl}
        {p.textBlock}
      </div>
    ),
  },
]

/**
 * Social-only layouts (brief follow-up) — a centered composition suited to
 * Instagram's square-crop feeds, and the classic bottom-left card layout
 * that's how X/Twitter link previews are actually presented. Kept out of
 * TEMPLATES for the same reason as the Newsletter set; swapped in only when
 * the Social format is selected.
 */
export const SOCIAL_TEMPLATES: Template[] = [
  {
    id: 'social-instagram',
    label: 'Instagram',
    category: 'Social layouts',
    // Narrower box for the tighter, more square-cropped feed presentation.
    headlineBox: (format) => Math.round(format.width * 0.75),
    textAlign: 'center',
    anchorX: 'center',
    anchorY: 'center',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {p.hasIcon ? (
          <div style={{ display: 'flex', marginBottom: 36 * p.scaleFactor }}>{p.iconEl}</div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
  {
    id: 'social-twitter',
    label: 'Twitter / X',
    category: 'Social layouts',
    headlineBox: fullHeadlineBoxWidth,
    textAlign: 'left',
    anchorX: 'left',
    anchorY: 'bottom',
    build: (p) => (
      <div
        style={{
          ...rootBase(p),
          flexDirection: 'column',
          justifyContent: p.hasIcon ? 'space-between' : 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        {p.hasIcon ? (
          <div style={{ display: 'flex', width: p.W - p.padX * 2, justifyContent: 'flex-end' }}>
            {p.iconEl}
          </div>
        ) : null}
        {p.textBlock}
      </div>
    ),
  },
]

export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(
  [...TEMPLATES, ...NEWSLETTER_TEMPLATES, ...SOCIAL_TEMPLATES].map((t) => [t.id, t])
)

export const DEFAULT_TEMPLATE_ID = 'icon-layout'
export const DEFAULT_NEWSLETTER_TEMPLATE_ID = 'newsletter-cover'
export const DEFAULT_SOCIAL_TEMPLATE_ID = 'social-twitter'
// Social's Instagram secondary (portrait, 1080x1350) always renders through
// its own dedicated centered layout, decoupled from whichever template the
// user picked for the primary Twitter/X/LinkedIn composition — none of the
// landscape-tuned icon-layout arrangements (fixed pixel offsets, etc.)
// translate to a portrait canvas.
export const INSTAGRAM_TEMPLATE_ID = 'social-instagram'
