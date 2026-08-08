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

/**
 * Illustrator/Figma-style exports often define colors via a `<defs><style>`
 * block of `.st0 { fill: #fff; }` class rules rather than inline attributes.
 * The dangerous-block strip below removes `<style>` entirely (it's active
 * content, not drawing data) — without this step that silently drops the
 * logo's actual color, since the surviving `class="st0"` attribute no longer
 * refers to anything and SVG paths default to black fill. Resolves simple
 * class selectors into inline `style="..."` attributes first, through the
 * same safe-property allowlist as any other style value.
 */
function inlineClassStyles(body: string): string {
  const styleMatch = body.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  if (!styleMatch) return body

  const rules = new Map<string, string>()
  // Selector list before `{` — Illustrator commonly groups several classes
  // sharing one color into `.st0, .st1, .st2 { fill: #000; }` to shrink the
  // CSS, so each rule can have more than one class selector.
  const ruleRe = /([^{}]+)\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = ruleRe.exec(styleMatch[1]))) {
    const safe = sanitizeStyleValue(m[2])
    if (!safe) continue
    for (const selector of m[1].split(',')) {
      const classMatch = selector.trim().match(/^\.([\w-]+)$/)
      if (classMatch) rules.set(classMatch[1], safe)
    }
  }
  if (!rules.size) return body

  // A class rule's declarations always WIN over any pre-existing inline
  // style on the same element (Illustrator/Figma never emit both on one
  // node in practice) — merged, not appended, so an element never ends up
  // with two `style="..."` attributes.
  const resolveClassAttr = (classList: string) =>
    classList
      .trim()
      .split(/\s+/)
      .map((c) => rules.get(c))
      .filter((v): v is string => !!v)
      .join(';')

  return body.replace(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g, (tag, tagName: string, rawAttrs: string) => {
    const classMatch = rawAttrs.match(/\sclass\s*=\s*(["'])([^"']*)\1/i)
    if (!classMatch) return tag
    const merged = resolveClassAttr(classMatch[2])
    if (!merged) return tag

    // Pull the self-closing `/` out before mutating attrs, and put it back
    // at the very end — otherwise it ends up stranded mid-tag (e.g.
    // `<path d="M0"/ style="...">`), which is malformed XML that a strict
    // parser (resvg, underneath satori) may reject outright.
    const selfClosing = /\/\s*$/.test(rawAttrs)
    let attrs = rawAttrs.replace(classMatch[0], '').replace(/\/\s*$/, '')
    const existingStyleMatch = attrs.match(/\sstyle\s*=\s*(["'])([^"']*)\1/i)
    if (existingStyleMatch) {
      attrs = attrs.replace(existingStyleMatch[0], ` style="${merged};${existingStyleMatch[2]}"`)
    } else {
      attrs += ` style="${merged}"`
    }
    if (selfClosing) attrs += ' /'
    return `<${tagName}${attrs}>`
  })
}

/**
 * SVG's own default fill (opaque black) kicks in whenever an element sets
 * `stroke` but omits `fill` entirely — a very common Illustrator/Figma
 * export mistake where a stroke-only outline shape was meant to be
 * `fill="none"`. Left alone, that shape paints a solid black copy directly
 * over whatever color shape it's tracing (a duplicate-path outline
 * technique), which can hide the real color almost entirely. This never
 * touches a fill that's actually specified — only resolves the ambiguous
 * "unset" case, so it doesn't count as "changing" the logo's declared
 * colors.
 */
function defaultMissingFillToNone(body: string): string {
  return body.replace(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g, (tag, tagName: string, rawAttrs: string) => {
    const hasStrokeColor = /\bstroke\s*=\s*["']/.test(rawAttrs) || /\bstroke\s*:/.test(rawAttrs)
    if (!hasStrokeColor) return tag
    const hasFill = /\bfill\s*=\s*["']/.test(rawAttrs) || /\bfill\s*:/.test(rawAttrs)
    if (hasFill) return tag

    const selfClosing = /\/\s*$/.test(rawAttrs)
    let attrs = rawAttrs.replace(/\/\s*$/, '')
    attrs += ' fill="none"'
    if (selfClosing) attrs += ' /'
    return `<${tagName}${attrs}>`
  })
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
  body = inlineClassStyles(body)
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

  body = defaultMissingFillToNone(body)

  body = body.trim()
  if (!body) return null

  return { viewBox, body }
}
