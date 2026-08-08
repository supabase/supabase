/**
 * "Quotation" headline override (brief follow-up): wrapping a run in "double
 * quotes" highlights it in the brand accent color instead of the default
 * text color, mirroring the [bracket] casing override's "type a marker,
 * it's removed from the rendered text" pattern. Composable with [brackets]
 * in either nesting order — brackets are already resolved to plain text by
 * the time this runs (lib/text/sentence-case.ts), so from here it's just
 * "some of these characters happen to sit inside quote marks".
 */

// Matches straight quotes and the curly variants some browsers/OSes swap in
// via autocorrect/smart-quotes (typed or pasted) — otherwise those look
// identical to a straight quote on screen but silently fail to trigger the
// override.
const QUOTE_CHARS = /["“”]/

/** Remove every quote character — a simple toggle marker, not a paired regex. */
export function stripQuoteMarks(text: string): string {
  return text.replace(new RegExp(QUOTE_CHARS, 'g'), '')
}

/**
 * Flat, in-order highlight flag per word in the quote-stripped text —
 * recombine with the auto-fit's wrapped lines by walking both in lockstep
 * (wrapping only regroups words into lines; it never reorders or duplicates
 * them).
 *
 * Built by walking `text` once, toggling "inside quotes" on each quote char
 * (which is dropped from the output) and tracking a highlight flag per
 * character of the resulting clean string, then folding those per-character
 * flags into per-word flags using the EXACT same whitespace-splitting
 * fitHeadline uses downstream. A regex tokenizer that treated quotes as
 * their own word boundaries used to desync from the real word count
 * whenever a quote/bracket marker had no surrounding whitespace (e.g.
 * `["p"]ostgres`, where the quoted run is fused to the next word) —
 * character-position tracking can't drift like that since it's derived
 * from the same string it's later split from.
 */
export function headlineWordHighlights(text: string): boolean[] {
  let clean = ''
  const charFlags: boolean[] = []
  let inQuotes = false
  for (const ch of text) {
    if (QUOTE_CHARS.test(ch)) {
      inQuotes = !inQuotes
      continue
    }
    clean += ch
    charFlags.push(inQuotes)
  }

  const wordFlags: boolean[] = []
  let i = 0
  while (i < clean.length) {
    while (i < clean.length && /\s/.test(clean[i])) i++
    if (i >= clean.length) break
    let highlighted = false
    while (i < clean.length && !/\s/.test(clean[i])) {
      if (charFlags[i]) highlighted = true
      i++
    }
    wordFlags.push(highlighted)
  }
  return wordFlags
}
