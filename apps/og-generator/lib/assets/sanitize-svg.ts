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
