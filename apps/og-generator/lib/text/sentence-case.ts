import { PROPER_NOUNS } from './proper-nouns'

export interface SentenceCaseOptions {
  /** Override the proper-noun allowlist (defaults to PROPER_NOUNS). */
  properNouns?: string[]
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Convert a headline to sentence case (brief §3):
 *   "Announcing PGVector 2.0" -> "Announcing pgvector 2.0"
 *
 * Rules:
 *  1. Lowercase everything (whitespace/line breaks preserved).
 *  2. Capitalize the first letter of each sentence (start, and after . ! ?).
 *  3. Restore canonical casing for allowlisted proper nouns/acronyms — this
 *     wins over step 2, so brand-lowercase terms like "pgvector" stay lowercase
 *     even at the start of the headline.
 *
 * Pure function — safe to unit test and to call from the stateless render route.
 */
export function toSentenceCase(input: string, options: SentenceCaseOptions = {}): string {
  const nouns = options.properNouns ?? PROPER_NOUNS

  // 1. Lowercase.
  let out = input.toLowerCase()

  // 2. Capitalize sentence starts (string start, or after sentence punctuation
  //    followed by whitespace — so version numbers like "2.0" are untouched).
  out = out.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, lead: string, ch: string) => lead + ch.toUpperCase())

  // 3. Restore proper-noun casing. Longest-first so e.g. "PostgREST" is handled
  //    before "Postgres" can't (different words, but length-ordering is the safe
  //    general rule for overlapping/multi-word terms like "Edge Functions").
  const ordered = [...nouns].sort((a, b) => b.length - a.length)
  for (const term of ordered) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi')
    out = out.replace(re, term)
  }

  return out
}
