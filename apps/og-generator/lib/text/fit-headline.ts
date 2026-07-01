import type { Font } from 'fontkit'

/**
 * Headline auto-fit (brief §3) + line-break quality rules.
 *
 * Finds the largest font size in [minSize, maxSize] at which the headline lays
 * out to <= maxLines within the box, applying two typographic rules in auto mode:
 *
 *  - No full-width span: a headline that would sit on ONE line wider than
 *    `singleLineMaxFraction` of the box is broken into two BALANCED lines
 *    instead (minimizing the wider line), so headlines never stretch edge-to-edge.
 *  - No widows/orphans: a 2-line split that leaves a single word alone on the
 *    first or last line is avoided when a better split exists.
 *
 * Manual mode (explicit "\n") respects the user's own breaks and skips these.
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
  /** Keep a 1-line headline no wider than this fraction of the box (else break). Default 0.7. */
  singleLineMaxFraction?: number
}

export interface FitResult {
  fontSize: number
  lines: string[]
  lineCount: number
  widestLinePx: number
  fits: boolean
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
  const gaps = Math.max(0, [...text].length - 1)
  return base + letterSpacingEm * sizePx * gaps
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function wrapGreedy(
  font: Font,
  text: string,
  sizePx: number,
  boxWidth: number,
  letterSpacingEm: number
): string[] {
  const ws = words(text)
  if (ws.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of ws) {
    const trial = current ? `${current} ${word}` : word
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

/**
 * Best 2-line split: balanced (minimizes the wider line) and avoiding
 * widows/orphans (single-word first/last line) when a valid alternative exists.
 * Returns null if no split keeps both lines within the box.
 */
function balancedSplit(
  font: Font,
  ws: string[],
  sizePx: number,
  box: number,
  ls: number
): { lines: string[]; widest: number } | null {
  let best: { lines: string[]; widest: number; bad: boolean } | null = null
  for (let i = 1; i < ws.length; i++) {
    const l1 = ws.slice(0, i).join(' ')
    const l2 = ws.slice(i).join(' ')
    const w1 = measureLineWidth(font, l1, sizePx, ls)
    const w2 = measureLineWidth(font, l2, sizePx, ls)
    if (w1 > box || w2 > box) continue
    const widest = Math.max(w1, w2)
    // orphan (single word on line 1) or widow (single word on line 2)
    const bad = i === 1 || ws.length - i === 1
    if (!best || (best.bad && !bad) || (best.bad === bad && widest < best.widest)) {
      best = { lines: [l1, l2], widest, bad }
    }
  }
  return best ? { lines: best.lines, widest: best.widest } : null
}

/** Auto layout at a given size: 1 line if short enough, else balanced 2 lines. */
function autoLayout(
  font: Font,
  text: string,
  sizePx: number,
  box: number,
  ls: number,
  singleFrac: number
): { lines: string[]; widest: number } {
  const ws = words(text)
  if (ws.length <= 1) {
    return { lines: [text || ' '], widest: measureLineWidth(font, text, sizePx, ls) }
  }
  const oneLine = measureLineWidth(font, ws.join(' '), sizePx, ls)
  // Keep on one line only if it's short enough not to stretch across the box.
  if (oneLine <= box && oneLine <= box * singleFrac) {
    return { lines: [ws.join(' ')], widest: oneLine }
  }
  const split = balancedSplit(font, ws, sizePx, box, ls)
  if (split) return split
  // Can't fit <=2 lines within the box — fall back to greedy so the caller sees
  // the (overflowing) line count and steps the size down / flags overflow.
  const greedy = wrapGreedy(font, ws.join(' '), sizePx, box, ls)
  const widest = Math.max(0, ...greedy.map((l) => measureLineWidth(font, l, sizePx, ls)))
  return { lines: greedy, widest }
}

export function fitHeadline(text: string, font: Font, opts: FitOptions): FitResult {
  const { boxWidth, minSize, maxSize, step = 2, maxLines = 2, letterSpacingEm = 0 } = opts
  const safetyPx = opts.safetyPx ?? 20
  const singleFrac = opts.singleLineMaxFraction ?? 0.7
  const effectiveBox = Math.max(0, boxWidth - safetyPx)
  const manual = opts.manualBreaks ?? /\n/.test(text)
  const mode: 'auto' | 'manual' = manual ? 'manual' : 'auto'
  const trimmed = text.trim()

  const layoutAt = (size: number): { lines: string[]; widest: number } => {
    if (manual) {
      const lines = trimmed.split('\n').map((l) => l.trim())
      const widest = Math.max(0, ...lines.map((l) => measureLineWidth(font, l, size, letterSpacingEm)))
      return { lines: lines.length ? lines : [''], widest }
    }
    return autoLayout(font, trimmed, size, effectiveBox, letterSpacingEm, singleFrac)
  }

  for (let size = maxSize; size >= minSize; size -= step) {
    const { lines, widest } = layoutAt(size)
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

  const { lines, widest } = layoutAt(minSize)
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
