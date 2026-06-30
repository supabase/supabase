/**
 * WCAG contrast checking (brief §5.3). Pure functions — used in the editor to
 * warn before export if text-against-background legibility is poor. Today the
 * headline is light-on-dark (very high contrast), but this is the guardrail that
 * matters the moment text is ever placed over imagery or a stronger pattern.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const int = parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function linearize(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG contrast ratio (1–21) between two hex colors. */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

export type ContrastRating = 'AAA' | 'AA' | 'Fail'

/**
 * WCAG rating. Large text (≥24px, or ≥18.66px bold) uses the relaxed thresholds
 * (AA 3:1, AAA 4.5:1); normal text uses AA 4.5:1, AAA 7:1.
 */
export function rating(ratio: number, largeText: boolean): ContrastRating {
  const aa = largeText ? 3 : 4.5
  const aaa = largeText ? 4.5 : 7
  if (ratio >= aaa) return 'AAA'
  if (ratio >= aa) return 'AA'
  return 'Fail'
}
