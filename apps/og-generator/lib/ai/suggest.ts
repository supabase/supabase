import { SEED_ICONS, type SeedIcon } from '@/lib/assets/seed-icons'

/**
 * Lightweight art-direction suggestion (brief §6.6), backend-free.
 *
 * Given a plain-language subject, it keyword/tag-matches the seed icons and
 * suggests an icon + template + rationale. This is the "smart retrieval over the
 * library" idea in miniature — it can only suggest on-brand assets that already
 * exist. The full version (embeddings + a Claude API call over the uploadable
 * library, with per-user caps + caching per §11.3) lands with the Supabase
 * backend; the UI contract (this structured result) stays the same.
 */

export interface Suggestion {
  iconName: string | null
  templateId: string
  rationale: string
  score: number
  alternates: { iconName: string; label: string; score: number }[]
}

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'in', 'on', 'is', 'are',
  'our', 'your', 'new', 'how', 'why', 'what', 'this', 'that', 'using', 'use', 'build',
  'building', 'post', 'blog', 'about', 'from', 'into',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

function scoreIcon(icon: SeedIcon, tokens: string[]): number {
  const hay = [icon.name, icon.label.toLowerCase(), ...icon.tags.map((t) => t.toLowerCase())]
  let score = 0
  for (const tok of tokens) {
    for (const h of hay) {
      if (h === tok) score += 3 // exact tag/name match
      else if (h.includes(tok) || tok.includes(h)) score += 1 // partial
    }
  }
  return score
}

// Template heuristic from the subject wording (launch/announcement → centered).
function suggestTemplate(tokens: string[], hasIcon: boolean): string {
  const t = new Set(tokens)
  if (t.has('launch') || t.has('announcing') || t.has('announce') || t.has('introducing') || t.has('week')) {
    return 'centered'
  }
  return hasIcon ? 'split-right' : 'bottom-left'
}

export function suggestArtDirection(description: string): Suggestion {
  const tokens = tokenize(description)
  const ranked = SEED_ICONS.map((icon) => ({ icon, score: scoreIcon(icon, tokens) })).sort(
    (a, b) => b.score - a.score
  )
  const top = ranked[0]
  const hasMatch = !!top && top.score > 0
  const templateId = suggestTemplate(tokens, hasMatch)

  const matchedTags = hasMatch
    ? top.icon.tags.filter((tag) =>
        tokens.some((tok) => tag.toLowerCase().includes(tok) || tok.includes(tag.toLowerCase()))
      )
    : []
  const rationale = hasMatch
    ? `${top.icon.label} — matches ${
        matchedTags.slice(0, 3).map((t) => `“${t}”`).join(', ') || 'the subject'
      }`
    : 'No strong match in the current icon set — try different wording, or request a new illustration from Design.'

  const alternates = ranked
    .slice(1)
    .filter((r) => r.score > 0)
    .slice(0, 2)
    .map((r) => ({ iconName: r.icon.name, label: r.icon.label, score: r.score }))

  return {
    iconName: hasMatch ? top.icon.name : null,
    templateId,
    rationale,
    score: top?.score ?? 0,
    alternates,
  }
}
