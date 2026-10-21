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
  needsApproval: false,
  toModelOutput: (output: string) => output,
} as const satisfies ToolContract
