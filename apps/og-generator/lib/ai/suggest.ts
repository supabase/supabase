import { FEATURED_EXAMPLES, type FeaturedExample } from '@/lib/ai/examples'
import { SEED_ICONS, type SeedIcon } from '@/lib/assets/seed-icons'

/**
 * Art-direction suggestion (brief §6.6), backend-free and grounded in §6.8.
 *
 * Priority:
 *  1. Match the subject against the curated FEATURED_EXAMPLES and, on a strong
 *     match, reuse that example's full recipe (icon + template + pattern + why).
 *  2. Otherwise fall back to a keyword/tag match over the seed-icon library.
 *
 * The full version (embeddings + a Claude API call over the Supabase-hosted
 * asset library + featured_examples, with the §11.3 caps/caching) keeps this
 * same result shape — only the retrieval/reasoning gets smarter.
 */

export interface Suggestion {
  iconName: string | null
  templateId: string
  eyebrow?: string
  pattern?: FeaturedExample['pattern']
  rationale: string
  /** Where the suggestion came from — surfaced in the UI. */
  source: 'ai' | 'example' | 'library' | 'none'
  exampleId?: string
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

/** Overlap score between input tokens and an arbitrary target string. */
function scoreText(target: string, tokens: string[]): number {
  const hay = tokenize(target)
  let s = 0
  for (const tok of tokens) {
    for (const h of hay) {
      if (h === tok) s += 2
      else if (h.includes(tok) || tok.includes(h)) s += 1
    }
  }
  return s
}

function scoreIcon(icon: SeedIcon, tokens: string[]): number {
  const hay = [icon.name, icon.label.toLowerCase(), ...icon.tags.map((t) => t.toLowerCase())]
  let score = 0
  for (const tok of tokens) {
    for (const h of hay) {
      if (h === tok) score += 3
      else if (h.includes(tok) || tok.includes(h)) score += 1
    }
  }
  return score
}

function suggestTemplate(tokens: string[], hasIcon: boolean): string {
  const t = new Set(tokens)
  if (t.has('launch') || t.has('announcing') || t.has('announce') || t.has('introducing') || t.has('week')) {
    return 'centered'
  }
  return hasIcon ? 'split-right' : 'bottom-left'
}

const EXAMPLE_MATCH_THRESHOLD = 3

export function suggestArtDirection(description: string): Suggestion {
  const tokens = tokenize(description)

  const rankedIcons = SEED_ICONS.map((icon) => ({ icon, score: scoreIcon(icon, tokens) })).sort(
    (a, b) => b.score - a.score
  )
  const iconAlternates = (excludeName?: string) =>
    rankedIcons
      .filter((r) => r.score > 0 && r.icon.name !== excludeName)
      .slice(0, 2)
      .map((r) => ({ iconName: r.icon.name, label: r.icon.label, score: r.score }))

  // 1. Featured examples first — grounded precedent (§6.8).
  const rankedEx = FEATURED_EXAMPLES.map((ex) => ({ ex, score: scoreText(ex.subject, tokens) })).sort(
    (a, b) => b.score - a.score
  )
  const topEx = rankedEx[0]
  if (topEx && topEx.score >= EXAMPLE_MATCH_THRESHOLD) {
    const ex = topEx.ex
    return {
      iconName: ex.iconName,
      templateId: ex.templateId,
      eyebrow: ex.eyebrow,
      pattern: ex.pattern,
      rationale: ex.whyItWorks,
      source: 'example',
      exampleId: ex.id,
      alternates: iconAlternates(ex.iconName),
    }
  }

  // 2. Fall back to the icon library — but only on a CONFIDENT match (an exact
  //    tag hit, score >= 3), so a single weak partial can't surface an
  //    irrelevant icon. Below that we say "no confident match" instead.
  const topIcon = rankedIcons[0]
  if (topIcon && topIcon.score >= 3) {
    const matchedTags = topIcon.icon.tags.filter((tag) =>
      tokens.some((tok) => tag.toLowerCase().includes(tok) || tok.includes(tag.toLowerCase()))
    )
    return {
      iconName: topIcon.icon.name,
      templateId: suggestTemplate(tokens, true),
      rationale: `${topIcon.icon.label} — matches ${
        matchedTags.slice(0, 3).map((t) => `“${t}”`).join(', ') || 'the subject'
      }`,
      source: 'library',
      alternates: iconAlternates(topIcon.icon.name),
    }
  }

  // 3. Nothing fits — escalate (add an example, or request an illustration).
  return {
    iconName: null,
    templateId: suggestTemplate(tokens, false),
    rationale:
      'No strong match in the featured examples or icon set yet — add a featured example below, or request a new illustration from Design.',
    source: 'none',
    alternates: [],
  }
}
