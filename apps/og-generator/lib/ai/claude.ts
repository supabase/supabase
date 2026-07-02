import Anthropic from '@anthropic-ai/sdk'

import { FEATURED_EXAMPLES, type FeaturedExample } from '@/lib/ai/examples'
import type { Suggestion } from '@/lib/ai/suggest'
import { ICON_LIBRARY, ICON_MAP } from '@/lib/assets/icon-library'
import {
  clampPatternOpacity,
  type PatternColor,
  type PatternScale,
  type PatternType,
} from '@/lib/design/patterns'

/**
 * The REAL art-direction brain (brief §6.6).
 *
 * When `ANTHROPIC_API_KEY` is set, this reasons over the same constrained
 * vocabulary the renderer supports (icons + templates + patterns) plus the
 * curated featured examples as few-shot precedent, and picks the strongest
 * on-brand composition for a post — instead of the keyword matcher's overlap
 * score. Every field it returns is validated/coerced back into the allowed set,
 * so a bad model answer can never produce an invalid recipe.
 *
 * No key? `hasClaude()` returns false and the route falls back to the
 * backend-free keyword matcher in `suggest.ts`. Same `Suggestion` shape either
 * way, so the editor doesn't care which engine ran.
 */

// Snappy, on-brand model choice for a scoped selection task. Opus is the
// default per Anthropic's guidance; adaptive thinking + low effort keeps the
// suggestion fast while still reasoning over the precedent.
const MODEL = 'claude-opus-4-8'

// Keep in sync with lib/design/templates.tsx (4 layouts) — validated below.
const TEMPLATE_IDS = ['bottom-left', 'split-right', 'centered', 'stacked'] as const
const DEFAULT_TEMPLATE = 'split-right'

const PATTERN_TYPES: PatternType[] = ['grid', 'dots', 'hlines', 'vlines']
// Backgrounds are white-only, medium/large scale — kept in sync with the
// editor's SCALE_OPTS/PATTERN_COLOR (app/page.tsx).
const PATTERN_SCALES: PatternScale[] = ['md', 'lg']
const PATTERN_COLORS: PatternColor[] = ['white']

export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const ICON_CATALOG = ICON_LIBRARY.map(
  (i) => `- ${i.name} (${i.label}) — represents: ${i.tags.join(', ')}`
).join('\n')

const TEMPLATE_CATALOG = [
  '- bottom-left: headline lower-left, icon upper-right. Default for longer, technical titles — most headline room.',
  '- split-right: headline on the left, icon centered on the right. Best when one icon strongly represents the topic and the headline is medium length.',
  '- centered: headline + icon centered. Best for launches/announcements; reads well shrunk to a thumbnail.',
  '- stacked: headline top, icon bottom-left. Structured, technical feel for infrastructure/architecture posts.',
].join('\n')

export function buildSystem(examples: FeaturedExample[]): string {
  const exampleCatalog = examples
    .map((ex) => {
      const pattern = ex.pattern
        ? `${ex.pattern.type}/${ex.pattern.scale}/${ex.pattern.color}`
        : 'none'
      return `- "${ex.subject}" → icon=${ex.iconName}, template=${ex.templateId}, eyebrow=${
        ex.eyebrow ?? '—'
      }, pattern=${pattern}\n  why: ${ex.whyItWorks}`
    })
    .join('\n')

  return `You are the art director for Supabase's blog OG images (1200×630, dark mode, headline of at most two lines). Given a short description of a blog post, choose the strongest, most on-brand composition using ONLY the vocabulary below. Do not invent icons, templates, or colors.

ICONS (pick the single best \`name\`, or null if none genuinely fits — never force an unrelated icon):
${ICON_CATALOG}

TEMPLATES (pick one \`id\`):
${TEMPLATE_CATALOG}

BACKGROUND PATTERNS (subtle white texture only — color is always white): type ∈ grid|dots|hlines|vlines|none, scale ∈ md|lg, opacity between 0.20 and 0.35. Prefer "none" over a busy pattern.

FEATURED EXAMPLES (approved precedent — reuse the recipe when the subject is similar):
${exampleCatalog}

RULES:
- Match the post to the closest featured example first; if it fits, follow that recipe.
- eyebrow: a short 1–2 word category label that fits the post (e.g. Security, Engineering, Product, AI, Launch Week), or "" if unsure.
- rationale: ONE concrete sentence explaining why this icon + layout suits THIS post (like the examples' "why"). No preamble, no restating the brief.
- alternateIconNames: up to 2 other plausible icon \`name\`s from the list (most relevant first), or [].
- Respond with the JSON object only.`
}

// Structured-output schema (all objects: additionalProperties:false + every key
// required, per the API's strict-schema rules).
export const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    iconName: { type: ['string', 'null'], description: 'One icon name from the list, or null.' },
    templateId: { type: 'string', enum: [...TEMPLATE_IDS] },
    eyebrow: { type: 'string', description: 'Short category label, or "".' },
    pattern: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['grid', 'dots', 'hlines', 'vlines', 'none'] },
        scale: { type: 'string', enum: ['md', 'lg'] },
        color: { type: 'string', enum: ['white'] },
        opacity: { type: 'number' },
      },
      required: ['type', 'scale', 'color', 'opacity'],
    },
    rationale: { type: 'string' },
    alternateIconNames: { type: 'array', items: { type: 'string' } },
  },
  required: ['iconName', 'templateId', 'eyebrow', 'pattern', 'rationale', 'alternateIconNames'],
} as const

export interface RawSuggestion {
  iconName: string | null
  templateId: string
  eyebrow: string
  pattern: { type: string; scale: string; color: string; opacity: number } | null
  rationale: string
  alternateIconNames: string[]
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Coerce the model's answer into a valid Suggestion — nothing off-menu survives. */
export function toSuggestion(raw: RawSuggestion): Suggestion {
  const iconName =
    typeof raw.iconName === 'string' && ICON_MAP[raw.iconName] ? raw.iconName : null

  let pattern: Suggestion['pattern']
  if (raw.pattern && raw.pattern.type && raw.pattern.type !== 'none') {
    pattern = {
      type: oneOf<PatternType>(raw.pattern.type, PATTERN_TYPES, 'dots'),
      scale: oneOf<PatternScale>(raw.pattern.scale, PATTERN_SCALES, 'md'),
      color: oneOf<PatternColor>(raw.pattern.color, PATTERN_COLORS, 'white'),
      opacity: clampPatternOpacity(Number(raw.pattern.opacity)),
    }
  }

  const alternates = Array.isArray(raw.alternateIconNames)
    ? raw.alternateIconNames
        .filter((n): n is string => typeof n === 'string' && !!ICON_MAP[n] && n !== iconName)
        .slice(0, 2)
        .map((n) => ({ iconName: n, label: ICON_MAP[n].label, score: 0 }))
    : []

  const eyebrow = typeof raw.eyebrow === 'string' && raw.eyebrow.trim() ? raw.eyebrow.trim() : undefined
  const rationale =
    typeof raw.rationale === 'string' && raw.rationale.trim()
      ? raw.rationale.trim()
      : iconName
        ? `${ICON_MAP[iconName].label} suits this post.`
        : 'Suggested composition for this post.'

  return {
    iconName,
    templateId: oneOf(raw.templateId, TEMPLATE_IDS, DEFAULT_TEMPLATE),
    eyebrow,
    pattern,
    rationale,
    source: 'ai',
    alternates,
  }
}

/** Best-effort JSON extraction — tolerant of stray prose around the object. */
export function parseJson(text: string): RawSuggestion {
  try {
    return JSON.parse(text) as RawSuggestion
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1)) as RawSuggestion
    throw new Error('suggest: model did not return JSON')
  }
}

/**
 * Ask Claude for an art-direction suggestion. Assumes `hasClaude()` — throws on
 * any failure (bad key, refusal, unparseable output) so the route can fall back.
 */
export async function suggestWithClaude(
  description: string,
  examples: FeaturedExample[] = FEATURED_EXAMPLES
): Promise<Suggestion> {
  const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: buildSystem(examples),
    messages: [{ role: 'user', content: `Blog post: ${description}` }],
  })

  if (response.stop_reason === 'refusal') throw new Error('suggest: request was refused')

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('suggest: no text block in response')

  return toSuggestion(parseJson(textBlock.text))
}
