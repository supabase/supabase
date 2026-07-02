import type { PatternColor, PatternScale, PatternType } from '@/lib/design/patterns'

/**
 * Featured examples (brief §6.8) — the curated precedent the AI reasons from.
 *
 * Each record maps a plain-language subject to a real, approved composition
 * (icon + template + optional pattern/eyebrow) plus a note on WHY it works. The
 * suggester matches a post's subject against these FIRST and reuses the winning
 * example's recipe — so suggestions reflect good, on-brand decisions instead of
 * generic keyword guesses.
 *
 * HOW TO ADD EXAMPLES:
 *  - Quick: in the editor, set up a composition you like, then click
 *    "Save current as example" to copy a ready-to-paste entry — paste it below.
 *  - Or hand-write an entry here. `subject` is free text (the AI tokenizes it);
 *    pack it with the words a writer would use for that kind of post.
 *
 * In production this becomes the Supabase `featured_examples` table — the same
 * shape, but Design-approved and read by the Claude-backed suggester at request
 * time (with a relevant slice injected as few-shot precedent).
 */
export interface FeaturedExample {
  id: string
  /** Plain-language subject the AI matches against. */
  subject: string
  iconName: string
  templateId: string
  eyebrow?: string
  pattern?: { type: PatternType | 'none'; scale: PatternScale; color: PatternColor; opacity: number }
  /** Why this composition works — shown as the suggestion's rationale. */
  whyItWorks: string
}

export const FEATURED_EXAMPLES: FeaturedExample[] = [
  {
    id: 'ex-rls',
    subject: 'row level security rls multi-tenant data isolation access control policies auth',
    iconName: 'lock',
    templateId: 'split-right',
    eyebrow: 'Security',
    pattern: { type: 'grid', scale: 'md', color: 'white', opacity: 0.2 },
    whyItWorks:
      'A padlock reads instantly as access control; the split layout keeps a longer security headline legible beside the icon.',
  },
  {
    id: 'ex-scale',
    subject: 'scale postgres database to millions of users read replicas performance throughput',
    iconName: 'database',
    templateId: 'bottom-left',
    eyebrow: 'Engineering',
    pattern: { type: 'dots', scale: 'md', color: 'white', opacity: 0.2 },
    whyItWorks:
      'A single database icon top-right keeps a technical scaling post clean; the bottom-left headline gives room for a longer title.',
  },
  {
    id: 'ex-launch',
    subject: 'launch week announcement announcing introducing new features keynote',
    iconName: 'zap',
    templateId: 'centered',
    eyebrow: 'Launch Week',
    pattern: { type: 'dots', scale: 'lg', color: 'green', opacity: 0.2 },
    whyItWorks:
      'A centered composition with the bolt icon signals a big launch moment and reads well at thumbnail size.',
  },
  {
    id: 'ex-edge',
    subject: 'edge functions global network cdn regions low latency serverless',
    iconName: 'globe',
    templateId: 'split-right',
    eyebrow: 'Product',
    pattern: { type: 'grid', scale: 'md', color: 'white', opacity: 0.2 },
    whyItWorks:
      'The globe conveys global/edge reach; the split layout pairs it cleanly with the feature name.',
  },
  {
    id: 'ex-infra',
    subject: 'infrastructure multi-region stacked services architecture platform migration',
    iconName: 'layers',
    templateId: 'stacked',
    eyebrow: 'Engineering',
    pattern: { type: 'hlines', scale: 'md', color: 'white', opacity: 0.2 },
    whyItWorks:
      'The layers icon suggests stacked infrastructure; headline-top / icon-bottom gives a structured, technical feel.',
  },
  {
    id: 'ex-realtime',
    subject: 'realtime presence broadcast live collaboration multiplayer websockets subscriptions',
    iconName: 'zap',
    templateId: 'split-right',
    eyebrow: 'Product',
    pattern: { type: 'dots', scale: 'md', color: 'green', opacity: 0.2 },
    whyItWorks:
      'The bolt reads as speed/real-time; a split layout keeps the feature headline front and center.',
  },
  {
    id: 'ex-vector',
    subject: 'pgvector vector embeddings similarity search ai semantic retrieval rag',
    iconName: 'database',
    templateId: 'split-right',
    eyebrow: 'AI',
    pattern: { type: 'grid', scale: 'sm', color: 'green', opacity: 0.2 },
    whyItWorks:
      'A database icon anchors a Postgres-native AI feature; the split layout supports a descriptive headline.',
  },
]
