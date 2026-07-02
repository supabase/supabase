/**
 * Conservative SVG sanitizer for uploaded assets (brief §6 "normalize on import").
 *
 * Uploaded icons are treated as line art: we keep only safe drawing elements and
 * hand back `{ viewBox, body }` in the same shape as a seed icon, so the renderer
 * re-draws them with the locked brand stroke + neutral color (fill/gradients are
 * intentionally dropped — the icon system is stroke-only, §4).
 *
 * Rendering never executes SVG (satori rasterizes; the editor renders inline
 * from this already-sanitized body), but we still strip all active content here
 * so nothing executable is ever stored — defense in depth.
 */

const ALLOWED_ELEMENTS = new Set([
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'g',
])

// Elements that can carry active content — drop the whole subtree.
const DANGEROUS_BLOCKS =
  /<\s*(script|style|foreignObject|animate\w*|set|a|image|text|iframe|marker|use)\b[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_SELFCLOSE =
  /<\s*(script|style|foreignObject|animate\w*|set|image|iframe|use)\b[^>]*\/?\s*>/gi

export interface SanitizedSvg {
  viewBox: string
  body: string
}

export function sanitizeSvg(input: string): SanitizedSvg | null {
  if (!input || input.length > 100_000) return null
  const s = input.trim()

  // Reject DOCTYPE / entity / external-stylesheet declarations (XXE, expansion).
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(s)) return null

  const svgMatch = s.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)
  if (!svgMatch) return null
  const attrs = svgMatch[1]
  let body = svgMatch[2]

  // viewBox: explicit, else derive from width/height, else a 24-unit default.
  let viewBox = '0 0 24 24'
  const vb = attrs.match(/viewBox\s*=\s*["']([^"']+)["']/i)
  if (vb) {
    viewBox = vb[1].trim()
  } else {
    const w = attrs.match(/\bwidth\s*=\s*["']([\d.]+)/i)
    const h = attrs.match(/\bheight\s*=\s*["']([\d.]+)/i)
    if (w && h) viewBox = `0 0 ${w[1]} ${h[1]}`
  }
  if (!/^[-\d.\s]+$/.test(viewBox)) viewBox = '0 0 24 24'

  body = body.replace(/<!--[\s\S]*?-->/g, '')
  body = body.replace(DANGEROUS_BLOCKS, '')
  body = body.replace(DANGEROUS_SELFCLOSE, '')

  // Drop any element whose tag isn't allowlisted (keeps its harmless inner text).
  body = body.replace(/<\s*\/?\s*([a-zA-Z][\w:-]*)\b[^>]*>/g, (tag, name: string) =>
    ALLOWED_ELEMENTS.has(name.toLowerCase()) ? tag : ''
  )

  // Strip event handlers, inline styles, hrefs, and js/data URIs from survivors.
  body = body.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  body = body.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  body = body.replace(/\s(?:xlink:)?href\s*=\s*["'][^"']*["']/gi, '')
  body = body.replace(/\sstyle\s*=\s*["'][^"']*["']/gi, '')
  body = body.replace(/(?:javascript|data)\s*:/gi, '')

  body = body.trim()
  if (!body || !/<(path|circle|ellipse|rect|line|polyline|polygon)\b/i.test(body)) return null

  return { viewBox, body }
}

/**
 * Sanitizer for uploaded LOGOS (partnerships, acquisitions, co-marketing) —
 * unlike `sanitizeSvg`, this preserves the logo's original colors (fill,
 * stroke, gradients) instead of forcing the stroke-only brand treatment, since
 * a partner's logo must render in its own brand colors, not ours. Still an
 * allowlist: no scripts, no external references, no event handlers — the
 * safety bar is the same, only the "what survives" set is different.
 */

const ALLOWED_LOGO_ELEMENTS = new Set([
  'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'g',
  'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'symbol', 'use',
])

const DANGEROUS_LOGO_BLOCKS =
  /<\s*(script|style|foreignObject|animate\w*|set|a|image|text|iframe|marker)\b[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_LOGO_SELFCLOSE =
  /<\s*(script|style|foreignObject|animate\w*|set|image|iframe)\b[^>]*\/?\s*>/gi

const SAFE_STYLE_PROPS = new Set([
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'opacity', 'fill-opacity', 'stroke-opacity', 'stop-color', 'stop-opacity', 'fill-rule', 'clip-rule',
])

/** Only allow `url(#internal)` references; reject external/data/js URLs. */
function isSafeUrlRef(value: string): boolean {
  const m = value.match(/url\(\s*['"]?([^'")]*)['"]?\s*\)/i)
  if (!m) return true // no url(...) present — nothing to check
  return m[1].startsWith('#')
}

function sanitizeStyleValue(raw: string): string | null {
  const kept = raw
    .split(';')
    .map((decl) => {
      const i = decl.indexOf(':')
      if (i === -1) return null
      const prop = decl.slice(0, i).trim().toLowerCase()
      const val = decl.slice(i + 1).trim()
      if (!SAFE_STYLE_PROPS.has(prop)) return null
      if (/javascript|expression\(|@import/i.test(val)) return null
      if (!isSafeUrlRef(val)) return null
      return `${prop}:${val}`
    })
    .filter((d): d is string => d !== null)
  return kept.length ? kept.join(';') : null
}

export function sanitizeLogoSvg(input: string): SanitizedSvg | null {
  if (!input || input.length > 300_000) return null
  const s = input.trim()

  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(s)) return null

  const svgMatch = s.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)
  if (!svgMatch) return null
  const attrs = svgMatch[1]
  let body = svgMatch[2]

  let viewBox = '0 0 300 300'
  const vb = attrs.match(/viewBox\s*=\s*["']([^"']+)["']/i)
  if (vb) {
    viewBox = vb[1].trim()
  } else {
    const w = attrs.match(/\bwidth\s*=\s*["']([\d.]+)/i)
    const h = attrs.match(/\bheight\s*=\s*["']([\d.]+)/i)
    if (w && h) viewBox = `0 0 ${w[1]} ${h[1]}`
  }
  if (!/^[-\d.\s]+$/.test(viewBox)) viewBox = '0 0 300 300'

  body = body.replace(/<!--[\s\S]*?-->/g, '')
  body = body.replace(DANGEROUS_LOGO_BLOCKS, '')
  body = body.replace(DANGEROUS_LOGO_SELFCLOSE, '')

  // Drop any element whose tag isn't allowlisted (case-insensitively).
  body = body.replace(/<\s*\/?\s*([a-zA-Z][\w:-]*)\b[^>]*>/g, (tag, name: string) =>
    ALLOWED_LOGO_ELEMENTS.has(name.toLowerCase()) ? tag : ''
  )

  // Event handlers: always stripped.
  body = body.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  body = body.replace(/\son\w+\s*=\s*'[^']*'/gi, '')

  // href/xlink:href: keep only internal (#id) references — needed for <use>
  // and gradient reuse; strip anything external, data:, or javascript:.
  body = body.replace(/\s(xlink:)?href\s*=\s*"([^"]*)"/gi, (m, xl, val) =>
    val.startsWith('#') ? ` ${xl ?? ''}href="${val}"` : ''
  )
  body = body.replace(/\s(xlink:)?href\s*=\s*'([^']*)'/gi, (m, xl, val) =>
    val.startsWith('#') ? ` ${xl ?? ''}href='${val}'` : ''
  )

  // style="...": keep only a safe color/opacity property allowlist.
  body = body.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (m, val) => {
    const safe = sanitizeStyleValue(val)
    return safe ? ` style="${safe}"` : ''
  })
  body = body.replace(/\sstyle\s*=\s*'([^']*)'/gi, (m, val) => {
    const safe = sanitizeStyleValue(val)
    return safe ? ` style='${safe}'` : ''
  })

  // fill/stroke/clip-path/mask/filter as plain attributes: block external
  // url(...) refs (internal #id refs, hex colors, named colors all pass).
  body = body.replace(/\sfilter\s*=\s*["'][^"']*["']/gi, '') // no filter support
  for (const attr of ['fill', 'stroke', 'clip-path', 'mask']) {
    const re = new RegExp(`\\s${attr}\\s*=\\s*(["'])([^"']*)\\1`, 'gi')
    body = body.replace(re, (m, q, val) => (isSafeUrlRef(val) ? m : ''))
  }

  // Defense in depth — href/url(...) refs above already reject non-# targets,
  // so this shouldn't normally match anything, but strip stray javascript:
  // schemes if they slipped through in some other attribute.
  body = body.replace(/\bjavascript\s*:/gi, '')

  body = body.trim()
  if (!body) return null

  return { viewBox, body }
}
