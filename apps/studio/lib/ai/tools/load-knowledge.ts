import { z } from 'zod'

import { KNOWLEDGE_TOPIC_LABELS, type KnowledgeName } from './knowledge-topics'
import type { ToolContract } from './types'

const inputSchema = z.object({
  name: z
    .enum(Object.keys(KNOWLEDGE_TOPIC_LABELS) as [KnowledgeName, ...KnowledgeName[]])
    .describe('The knowledge to load'),
})

export const contract = {
  name: 'load_knowledge',
  description:
    'Load detailed knowledge about a Supabase topic before answering questions about it.',
  inputSchema,
  outputSchema: z.string(),
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform', 'self-hosted']),
  },
  needsApproval: false,
  promptGuidance: `Before writing SQL or answering questions about the following topics, call \`load_knowledge\` to load detailed knowledge:
- \`pg_best_practices\` — PostgreSQL best practices. Always load before writing any SQL, even simple queries.
- \`logs\` — ClickHouse SQL against the project's logs table.
- \`rls\` — Row Level Security policies for database tables.
- \`storage\` — Supabase Storage buckets, public/private bucket access, and \`storage.objects\` policies. Always load before creating Storage buckets or \`storage.objects\` policies.
- \`edge_functions\` — Supabase Edge Functions
- \`realtime\` — Supabase Realtime`,
  toModelOutput: (output: string) => output,
} as const satisfies ToolContract
