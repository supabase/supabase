import type { CapturedNetworkRequest, SessionRecordingOptions } from 'common'

/**
 * Enables session replay in Studio. Recording also requires "Record user
 * sessions" in PostHog, which www and docs share.
 */
export const IS_SESSION_REPLAY_ENABLED = process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY === 'true'

/**
 * Setting `data-ph-capture="true"` on an element opts its text in to session
 * recording. All text is opted out by default.
 */
const CAPTURE_DATASET_KEY = 'phCapture'

/**
 * Returns asterisks for all text except text inside elements marked
 * `data-ph-capture="true"`.
 */
export function maskReplayText(text: string, element?: HTMLElement): string {
  if (element?.dataset[CAPTURE_DATASET_KEY] === 'true') return text
  return '*'.repeat(text.trim().length)
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

/**
 * Masked attributes collapse to one asterisk rather than one per character. Attribute
 * length has no effect on how replay lays the page out, so preserving it would publish
 * the length of every bucket name, title and URL for nothing. Text nodes still mask
 * per-character, where the width does affect layout.
 */
function mask(_value: string): string {
  return '*'
}

/**
 * Attributes whose value is CSS, so `url()` has to be masked inside them.
 *
 * `_cssText` is deliberately absent. rrweb puts inlined stylesheet text there, which in
 * Studio is our own build output: `fonts.css` points at font files and `grid.css` draws
 * the data grid's checkbox marks from `data:` URIs, so masking those targets costs the
 * replay its fonts and its checkboxes. The customer content this function exists for
 * rides in inline `style` attributes, which stay masked.
 *
 * Allowing `_cssText` through does not widen what gets recorded. rrweb only sets it for a
 * `<link>`, or for a `<style>` with no text content; a `<style>` that has text keeps it as
 * a text node, and rrweb never passes `<style>` text to `maskTextFn`. CSS written as
 * element text is therefore a channel neither this function nor `maskTextFn` covers,
 * whatever this set contains. GROWTH-1229 has the one instance Studio had of writing
 * customer data through it, a chart keying its CSS variables by column name, and the
 * scope of what the channel still exposes.
 */
const CSS_VALUED_ATTRIBUTES = new Set(['style'])

/**
 * Quoted forms are matched first and on their own, so a target containing `)` (legal in a
 * storage object name) does not end the match early and leave the rest of it unmasked.
 *
 * Every alternative consumes backslash escapes. A target containing a quote serializes as
 * `\"`, and an unquoted target containing a bracket serializes as `\)`; a naive `[^")]*`
 * stops at the backslash and leaves the tail of the URL recorded.
 *
 * The last two alternatives are fallbacks for a token the escape-aware form cannot parse:
 * the escape-blind form, then an unterminated `url(` running to the end of the value.
 * Without them an input like `url(trailing\` matches nothing and passes through unmasked,
 * which is the wrong direction to fail in. CSSOM serialization should never hand us one,
 * so these only exist to keep the failure mode closed.
 */
const CSS_URL =
  /url\(\s*"(?:[^"\\]|\\.)*"\s*\)|url\(\s*'(?:[^'\\]|\\.)*'\s*\)|url\((?:[^)\\]|\\.)*\)|url\([^)]*\)|url\([^)]*$/gi

/** A `url()` target that is only a fragment, so it names a node in this document. */
const FRAGMENT_ONLY_URL = /^url\(\s*(['"]?)#[^)'"]*\1\s*\)$/i

/** Case-insensitive, because `URL(#id)` and `url(#id)` are the same CSS function. */
const CONTAINS_CSS_URL = /url\(/i

/**
 * Replaces the target of every CSS `url()` while leaving the rest of the declaration
 * alone, so gradients and transforms still replay. Fragment-only targets are kept,
 * because `clip-path: url(#id)` names a node in the recording rather than a resource.
 *
 * Studio interpolates customer content into inline background images: a screenshot of
 * the user's own dashboard in the feedback widget, and signed object URLs in the storage
 * preview panes. Neither text masking nor blocking canvas reaches a CSS background.
 */
export function maskReplayCssUrls(css: string): string {
  return css.replace(CSS_URL, (match) => (FRAGMENT_ONLY_URL.test(match) ? match : 'url(*)'))
}

/**
 * Attribute names replay needs to reconstruct the page. Everything else is masked, so
 * an attribute nobody considered is masked rather than recorded. Compared against the
 * lowercased attribute name.
 *
 * Deliberately excludes every attribute that carries free text (`title`, `alt`,
 * `placeholder`, `aria-label`, `value`, `label`) or a URL (`href`, `src`, `srcset`,
 * `action`, `poster`), which is where interpolated customer data shows up.
 */
const RENDER_CRITICAL_ATTRIBUTES = new Set([
  // rrweb's own synthetic attributes: layout it measured, and stylesheets it inlined.
  // posthog-js only exempts these when `maskAllElementAttributes` does the masking, so
  // the callback has to allow them itself or replay cannot lay out the page.
  'rr_width',
  'rr_height',
  'rr_left',
  'rr_top',
  'rr_position',
  'rr_transform',
  'rr_display',
  'rr_scrollleft',
  'rr_scrolltop',
  'rr_mediastate',
  'rr_open_mode',
  // rrweb's inlined stylesheet text. See CSS_VALUED_ATTRIBUTES above for why this passes
  // through rather than having its url() targets masked.
  '_csstext',
  // Styling and document structure. `style` is absent: CSS_VALUED_ATTRIBUTES handles it,
  // keeping the declarations while masking url() targets.
  'class',
  'type',
  'rel',
  'media',
  'colspan',
  'rowspan',
  // SVG geometry, which every icon in Studio depends on
  'xmlns',
  'viewbox',
  'preserveaspectratio',
  'd',
  'points',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'transform',
  'fill-rule',
  'fill-opacity',
  'clip-rule',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  // Pairs with `stroke-dasharray` to draw a partial ring. `PlanUsageCard` and
  // `BillingMetric` set it from a usage ratio, and a masked value is invalid, so the
  // browser falls back to 0 and every usage ring replays as full.
  'stroke-dashoffset',
  'stroke-opacity',
  'offset',
  'stop-color',
  'stop-opacity',
  // Text and gradient placement. recharts emits these on every axis tick, and masking
  // them shifts the labels even though the label text itself is already asterisks.
  'text-anchor',
  'dominant-baseline',
  'dx',
  'dy',
  'opacity',
  'gradientunits',
  // Positions the promo toast's radial gradients. Static values in `PromoBg.tsx`.
  'gradienttransform',
  'stroke-miterlimit',
  // Both take a value from a fixed SVG vocabulary. Spelled as the DOM carries them:
  // `maskUnits` is camelCase in the SVG spec, `shape-rendering` is hyphenated, and React's
  // `shapeRendering` prop sets the hyphenated one. Set on the mask elements in the MCP
  // provider icon assets and on the header and breadcrumb separators.
  'maskunits',
  'shape-rendering',
  // `<pattern>` tiling, which `@xyflow/react`'s `Background` uses to draw the dot grid
  // behind the schema graph, the infrastructure diagram and the replication diagram.
  // Masked, `patternUnits` is invalid and falls back to `objectBoundingBox`, which scales
  // the tile to the whole fill rect and leaves a blank canvas.
  'patternunits',
  'patterntransform',
  // `<marker>` geometry, the arrowhead counterpart to the pattern attributes above and
  // emitted by the same library. Integers and a fixed vocabulary.
  'markerwidth',
  'markerheight',
  'markerunits',
  'orient',
  'refx',
  'refy',
  // Set on SVG text by recharts tick props. Masked it is invalid, so labels inherit the
  // surrounding size and the chart relayouts around them.
  'font-size',
  'font-weight',
  'font-family',
  // Enumerated state. Values come from a fixed vocabulary rather than user input, and
  // Tailwind variants select on the `data-` ones.
  'disabled',
  'checked',
  'selected',
  'readonly',
  'required',
  'multiple',
  'open',
  'hidden',
  'dir',
  'lang',
  'role',
  'tabindex',
  'aria-hidden',
  'aria-expanded',
  'aria-selected',
  'aria-checked',
  'aria-disabled',
  'aria-current',
  'aria-haspopup',
  'aria-modal',
  'aria-orientation',
  'aria-live',
  'aria-level',
  'aria-invalid',
  'aria-pressed',
  // Sizes a textarea's box, so masking it collapses every textarea in replay to the
  // two-row default.
  'rows',
  'cols',
  // Selected on by value in Studio's own stylesheets: `grid.css` sizes the grid header's
  // drag wrapper via `div[draggable='true']`, and `markdown-preview.css` pads floated
  // images via `img[align='right'|'left']`. Both vocabularies are fixed.
  'draggable',
  'align',
  // Every `data-` attribute anything selects on, derived by grepping rather than from
  // memory. Two greps are needed, and the first one alone is what let `data-chart`,
  // sonner's toast markers and the Radix portal attributes through as masked:
  //
  //   Tailwind variants:  data-\[([a-z-]+)   over packages/ui, packages/ui-patterns, apps/studio
  //   CSS selectors:      \[data-[a-z-]+     over apps/studio/styles/*.css and every
  //                                          shipped UI lib in node_modules: sonner, vaul,
  //                                          cmdk, @xyflow/react, react-data-grid,
  //                                          react-medium-image-zoom, monaco-editor, radix
  //
  // Re-run both when adding one. A masked attribute that a stylesheet selects on is
  // invisible in the unit tests and only shows up as broken rendering in a replay.
  'data-state',
  'data-side',
  'data-align',
  'data-orientation',
  'data-disabled',
  'data-highlighted',
  'data-placeholder',
  'data-slot',
  'data-active',
  'data-collapsible',
  'data-expanded',
  'data-front',
  'data-invalid',
  'data-invisible',
  'data-motion',
  'data-selected',
  'data-separator',
  'data-sidebar',
  'data-size',
  'data-variant',
  'data-vaul-drawer-direction',
  // `ComputeSizeSelector` hides the price rows inside its closed trigger with
  // `[&>span>div>div>[data-field=instance-details]]:hidden`. Masked, the selector stops
  // matching and the project creation form replays with two extra rows and a taller
  // trigger. One literal value.
  'data-field',
  // Scopes the chart colour variables. `ChartStyle` writes `[data-chart=<id>]` into a
  // `<style>` element, and rrweb records `<style>` text unmasked, so masking the
  // attribute leaves a selector that can no longer match and every chart loses its
  // series colours. The value is always `chart-${useId()}`; no caller passes `id`.
  'data-chart',
  // Presence and state markers set by the UI libraries we ship, found by grepping
  // `\[data-[a-z-]+` through sonner, vaul and cmdk. Plain CSS attribute selectors, so
  // the Tailwind-variant grep above does not see them. sonner's base rule hides every
  // toast until `[data-mounted="true"]` matches, so masking these makes toasts and
  // drawers invisible in replay rather than merely unstyled.
  // `data-` attributes the shipped UI libraries set with a value. Presence-only markers
  // are absent on purpose: posthog-js returns an empty attribute before it reaches this
  // callback, so allowlisting one does nothing for rendering and only widens the surface
  // if a component later writes a value into a generically named attribute.
  'data-sonner-toast',
  'data-sonner-toaster',
  'data-mounted',
  'data-visible',
  'data-removed',
  'data-swiping',
  'data-swipe-out',
  'data-styled',
  'data-type',
  'data-x-position',
  'data-y-position',
  'data-rich-colors',
  'data-invert',
  'data-promise',
  'data-content',
  'data-button',
  'data-cancel',
  'data-close-button',
  'data-vaul-drawer',
  'data-vaul-drawer-wrapper',
  'data-vaul-overlay',
  'data-vaul-handle',
  'data-vaul-handle-hitarea',
  'data-vaul-snap-points',
  'data-vaul-snap-points-overlay',
  'data-vaul-delayed-snap-points',
  'data-vaul-animate',
  'data-vaul-no-drag',
  'data-vaul-custom-container',
  // Integer index, selected on by monaco-editor's quick-input CSS
  // (`[data-index="0"] .quick-in...`) to drop the separator border on the first row.
  'data-index',
  // 0 to 4, selected on by `Select26Promotion.module.css` as `.cell[data-band='N']`.
  // The banner ships in Studio through `BannerSelect2026.tsx`.
  'data-band',
  // Selected on by Studio's own stylesheets and by Radix's portal positioning.
  'data-footnote-ref',
  'data-radix-portal',
  'data-radix-popper-content-wrapper',
  'data-rmiz-modal',
  'data-rmiz-modal-img',
  'data-rmiz-modal-overlay',
])

/**
 * `data-value` is deliberately absent from the allowlist above, even though two places
 * select on it: `multi-select.tsx` has a `peer-data-[value=true]` variant, and
 * `graphiql.module.css` hides sidebar buttons via `[data-value='settings']` and
 * `[data-value='short-keys']`. cmdk writes the item's own value into this attribute,
 * which in Studio is customer content such as a column name, so it stays masked. The
 * cost is a hover background and some GraphiQL buttons reappearing in a replay.
 */

/**
 * Themes Studio can be in. `next-themes` writes the active one to `data-theme` on
 * `<html>` (its default attribute, which nothing overrides), and monaco.css, grid.css,
 * ui.css and markdown-preview.css all select on it, so masking it strips dark styling
 * from the SQL editor and the data grid. Gated on the value so the attribute cannot
 * carry anything else.
 */
const THEME_VALUES = new Set(['dark', 'light', 'classic-dark', 'system'])

/**
 * SVG presentation attributes that take either a plain value (`fill="#fff"`) or a
 * reference to another node (`fill="url(#gradient)"`). recharts clips every series with
 * `clip-path`, so these have to survive, but only the in-document form: an external
 * `url(https://...)` here would be a recorded URL like any other.
 */
const SVG_REFERENCE_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'clip-path',
  'mask',
  'filter',
  'marker-start',
  'marker-mid',
  'marker-end',
])

/**
 * Returns asterisks for every attribute value except the ones replay needs to render.
 *
 * Attributes are a separate capture channel from text: `maskTextFn` only sees DOM text
 * nodes, so a component interpolating customer data into a `placeholder` or `title`
 * records it verbatim without this.
 */
export function maskReplayAttribute(name: string, value: string, element?: Element): string {
  const attributeName = name.toLowerCase()
  if (CSS_VALUED_ATTRIBUTES.has(attributeName)) return maskReplayCssUrls(value)
  if (RENDER_CRITICAL_ATTRIBUTES.has(attributeName)) return value
  if (attributeName === 'data-theme') return THEME_VALUES.has(value) ? value : mask(value)
  if (SVG_REFERENCE_ATTRIBUTES.has(attributeName)) {
    return CONTAINS_CSS_URL.test(value) && !FRAGMENT_ONLY_URL.test(value.trim())
      ? mask(value)
      : value
  }
  // Stylesheet URLs, for sheets rrweb could not inline. Checked by namespace and
  // `localName` because an XHTML document reports `tagName` lowercased, and gated on
  // `rel` so a `<link rel="preload" as="image">` pointing at customer content does not
  // ride through. Anchor and image URLs stay masked, since project and storage paths
  // ride in them.
  if (
    attributeName === 'href' &&
    element?.namespaceURI === HTML_NAMESPACE &&
    element.localName === 'link' &&
    element.getAttribute('rel') === 'stylesheet'
  ) {
    return value
  }
  // SVG ids are generated by the charting library, and `fill="url(#id)"` references
  // them, so masking them breaks gradients and clip paths. HTML ids stay masked
  // because Studio binds customer-named values to them (storage bucket names).
  if (attributeName === 'id' && element?.namespaceURI === SVG_NAMESPACE) return value
  return mask(value)
}

/**
 * Strips query strings and fragments from recorded URLs, which posthog-js applies
 * to page URLs as well as network requests. Auth callbacks carry tokens in the
 * fragment.
 */
export function maskReplayNetworkRequest(request: CapturedNetworkRequest): CapturedNetworkRequest {
  if (request.name) {
    const separatorIndex = request.name.search(/[?#]/)
    if (separatorIndex !== -1) {
      request.name = request.name.slice(0, separatorIndex)
    }
  }
  return request
}

export const SESSION_REPLAY_CONFIG: SessionRecordingOptions = {
  // Match posthog-js defaults, but set here so the PostHog UI can't relax them.
  maskAllInputs: true,
  maskTextSelector: '*',
  maskTextFn: maskReplayText,
  maskAttributeFn: maskReplayAttribute,
  // posthog-js treats this and `maskAttributeFn` as mutually exclusive, and it resolves
  // from the PostHog UI when unset. Pinning it to false keeps the policy above in force.
  maskAllElementAttributes: false,
  // Keeps network capture to URL, status and timing. Overrides the PostHog UI.
  recordHeaders: false,
  recordBody: false,
  // Canvas is captured as images, which text masking can't reach.
  captureCanvas: { recordCanvas: false },
  maskCapturedNetworkRequestFn: maskReplayNetworkRequest,
}
