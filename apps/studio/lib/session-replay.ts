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

/** Attributes whose value is CSS, so `url()` has to be masked inside them. */
const CSS_VALUED_ATTRIBUTES = new Set(['style', '_csstext'])

/**
 * Quoted forms are matched first and on their own, so a target containing `)` (legal in a
 * storage object name) does not end the match early and leave the rest of it unmasked.
 */
const CSS_URL = /url\(\s*"[^"]*"\s*\)|url\(\s*'[^']*'\s*\)|url\([^)]*\)/gi

/**
 * Replaces the target of every CSS `url()` while leaving the rest of the declaration
 * alone, so gradients and transforms still replay.
 *
 * Studio interpolates customer content into inline background images: a screenshot of
 * the user's own dashboard in the feedback widget, and signed object URLs in the storage
 * preview panes. Neither text masking nor blocking canvas reaches a CSS background.
 */
export function maskReplayCssUrls(css: string): string {
  return css.replace(CSS_URL, 'url(*)')
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
  // Styling and document structure. `style` and rrweb's inlined `_cssText` are handled
  // by CSS_VALUED_ATTRIBUTES above, which keeps the declarations but masks url() targets.
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
  'fill',
  'fill-rule',
  'fill-opacity',
  'clip-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-opacity',
  'offset',
  'stop-color',
  'stop-opacity',
  // Reference other SVG nodes as `url(#id)`, which the charting library relies on for
  // clipping and gradients. Masking these silently drops the effect they name.
  'clip-path',
  'mask',
  'filter',
  'marker-start',
  'marker-mid',
  'marker-end',
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
  'data-state',
  'data-side',
  'data-align',
  'data-orientation',
  'data-disabled',
  'data-highlighted',
  'data-placeholder',
  'data-slot',
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
  // Stylesheet URLs, for sheets rrweb could not inline. Anchor and image URLs stay
  // masked, since project and storage paths ride in them.
  if (attributeName === 'href' && element?.tagName === 'LINK') return value
  // SVG ids are generated by the charting library, and `fill="url(#id)"` references
  // them, so masking them breaks gradients and clip paths. HTML ids stay masked
  // because Studio binds customer-named values to them (storage bucket names).
  if (attributeName === 'id' && element?.namespaceURI === SVG_NAMESPACE) return value
  return '*'.repeat(value.length)
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
