import type { KnowledgeName } from './knowledge-topics'
import { contract } from './load-knowledge'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import {
  EDGE_FUNCTION_PROMPT,
  LOGS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  STORAGE_PROMPT,
} from '@/lib/ai/prompts'

const KNOWLEDGE = {
  pg_best_practices: PG_BEST_PRACTICES,
  rls: RLS_PROMPT,
  storage: STORAGE_PROMPT,
  edge_functions: EDGE_FUNCTION_PROMPT,
  realtime: REALTIME_PROMPT,
  logs: LOGS_PROMPT,
} satisfies Record<KnowledgeName, string>

export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, ({ name }) => KNOWLEDGE[name])
