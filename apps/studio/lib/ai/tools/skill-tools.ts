import { tool } from 'ai'
import { z } from 'zod'
import {
  PG_BEST_PRACTICES,
  RLS_PROMPT,
  EDGE_FUNCTION_PROMPT,
  REALTIME_PROMPT,
} from 'lib/ai/prompts'

const SKILLS = {
  pg_best_practices: PG_BEST_PRACTICES,
  rls: RLS_PROMPT,
  edge_functions: EDGE_FUNCTION_PROMPT,
  realtime: REALTIME_PROMPT,
} as const

export type SkillName = keyof typeof SKILLS

export const getSkillTools = () => ({
  load_skill: tool({
    description:
      'Load detailed knowledge about a Supabase topic before answering questions about it.',
    inputSchema: z.object({
      skill: z
        .enum(['pg_best_practices', 'rls', 'edge_functions', 'realtime'])
        .describe('The topic to load knowledge for'),
    }),
    execute: async ({ skill }) => SKILLS[skill],
  }),
})
