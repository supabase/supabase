import type { Font } from 'fontkit'

/**
 * Headline auto-fit (brief §3).
 *
 * Pure function: given the headline text + a fontkit Font (the headline weight)
 * + the text-box width, it finds the largest font size in [minSize, maxSize]
 * (stepping down) at which the headline wraps to <= maxLines AND every line fits
 * the box width. If nothing fits even at minSize, it returns the min-size result
 * flagged with `overflow: true` so the caller can warn / block rather than
 * silently clip (brief §3).
 *
 * Two modes:
 *  - auto (default): greedy word-wrap, the algorithm chooses the line breaks.
 *  - manual: the text contains explicit "\n" breaks (power-user override, §3) —
 *    those lines are respected as-is (no reflow); the result is still validated
 *    against the 2-line / width rules so the caller can warn.
 */

export interface FitOptions {
  boxWidth: number
  minSize: number
  maxSize: number
  step?: number
  maxLines?: number
  /** em, matching the rendered letter-spacing so measurement tracks the render. */
  letterSpacingEm?: number
  /** Force manual mode. Otherwise inferred from presence of "\n" in the text. */
  manualBreaks?: boolean
  /**
   * Safety inset (px) subtracted from boxWidth for the fit decision, to absorb
   * small differences between fontkit measurement and satori's actual layout so
   * the rendered line count always matches what we computed. Default 20.
   */
  safetyPx?: number
}

export interface FitResult {
  fontSize: number
  lines: string[]
  lineCount: number
  widestLinePx: number
  /** Within maxLines AND every line within boxWidth at the chosen size. */
  fits: boolean
  /** Did not fit even at minSize — caller should warn/block. */
  overflow: boolean
  mode: 'auto' | 'manual'
}

/** Width (px) of a single line, including approximate letter-spacing. */
export function measureLineWidth(
  font: Font,
  text: string,
  sizePx: number,
  letterSpacingEm = 0
): number {
  if (!text) return 0
  const run = font.layout(text)
  const base = (run.advanceWidth / font.unitsPerEm) * sizePx
  // satori distributes letter-spacing between glyphs; approximate with the gap count.
  const gaps = Math.max(0, [...text].length - 1)
  return base + letterSpacingEm * sizePx * gaps
}

function wrapGreedy(
  font: Font,
  text: string,
  sizePx: number,
  boxWidth: number,
  letterSpacingEm: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    // Always accept the first word of a line even if it alone overflows (we
    // can't break inside a word) — that case surfaces as a width overflow.
    if (current === '' || measureLineWidth(font, trial, sizePx, letterSpacingEm) <= boxWidth) {
      current = trial
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export function fitHeadline(text: string, font: Font, opts: FitOptions): FitResult {
  const { boxWidth, minSize, maxSize, step = 2, maxLines = 2, letterSpacingEm = 0 } = opts
  const safetyPx = opts.safetyPx ?? 20
  const effectiveBox = Math.max(0, boxWidth - safetyPx)
  const manual = opts.manualBreaks ?? /\n/.test(text)
  const mode: 'auto' | 'manual' = manual ? 'manual' : 'auto'
  const trimmed = text.trim()

  const linesAt = (size: number): { lines: string[]; widest: number } => {
    let lines: string[]
    if (manual) {
      lines = trimmed.split('\n').map((l) => l.trim())
      if (lines.length === 0) lines = ['']
    } else {
      lines = wrapGreedy(font, trimmed.replace(/\n+/g, ' '), size, effectiveBox, letterSpacingEm)
    }
    const widest = Math.max(0, ...lines.map((l) => measureLineWidth(font, l, size, letterSpacingEm)))
    return { lines, widest }
  }

  for (let size = maxSize; size >= minSize; size -= step) {
    const { lines, widest } = linesAt(size)
    if (lines.length <= maxLines && widest <= effectiveBox) {
      return {
        fontSize: size,
        lines,
        lineCount: lines.length,
        widestLinePx: Math.round(widest),
        fits: true,
        overflow: false,
        mode,
      }
    }
  }

  // Nothing fit — return the min-size attempt, flagged for the caller to warn.
  const { lines, widest } = linesAt(minSize)
  const fits = lines.length <= maxLines && widest <= effectiveBox
  return {
    fontSize: minSize,
    lines,
    lineCount: lines.length,
    widestLinePx: Math.round(widest),
    fits,
    overflow: !fits,
    mode,
  }
}
