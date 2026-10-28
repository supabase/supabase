import type { JSONValue } from 'ai'
import { z } from 'zod'

import { isOptInLevelAtLeast } from '../opt-in-level'
import type { LegacyToolContract } from './types'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

const HIDDEN_LEGACY_OUTPUT_MESSAGE =
  'The output of this tool is not shared with the Assistant at the current permission level. It requires the `schema` opt-in level.'

const INVALID_LEGACY_OUTPUT_MESSAGE =
  'The tool ran, but its saved output could not be read, so it is not shared with the Assistant.'

/** Output that describes the project, so it needs at least the `schema` level. */
function gatedBySchemaLevel(output: JSONValue, optInLevel: AiOptInLevel): JSONValue {
  return isOptInLevelAtLeast(optInLevel, 'schema') ? output : HIDDEN_LEGACY_OUTPUT_MESSAGE
}

const stringOutputSchema = z.string()

// Marks where `getRlsKnowledge` started its saved policies, after a block of RLS instructions
// that the model now gets from `load_knowledge`.
const EXISTING_POLICIES_MARKER = 'Here are my existing policies:'
const STALE_RLS_INSTRUCTIONS_START =
  "You're a Supabase Postgres expert in writing row level security"

const NO_LEGACY_POLICIES_MESSAGE = 'No existing policies were found when this tool ran.'

/** Replays only the policies, not the stale instructions saved with them. */
function trimRlsKnowledge(output: string, optInLevel: AiOptInLevel): JSONValue {
  const gated = gatedBySchemaLevel(output, optInLevel)
  if (gated !== output) return gated

  // Without the instructions there's nothing to trim, which keeps this safe on its own result.
  if (!output.includes(STALE_RLS_INSTRUCTIONS_START)) return output
  const markerIndex = output.indexOf(EXISTING_POLICIES_MARKER)
  if (markerIndex === -1) return NO_LEGACY_POLICIES_MESSAGE
  const policies = output.slice(markerIndex + EXISTING_POLICIES_MARKER.length).trim()
  return policies || NO_LEGACY_POLICIES_MESSAGE
}

const EDGE_FUNCTION_KNOWLEDGE_MOVED_MESSAGE =
  'The Edge Function guidance returned here is no longer available in this tool. Call `load_knowledge` with `edge_functions` to load it.'

/** The row `getEntityDefinitionsSql` returns. */
const entityDefinitionsRowSchema = z.object({
  data: z.object({
    definitions: z.array(z.object({ id: z.number(), sql: z.string().nullable() })),
  }),
})

/**
 * Removed self-hosted fallback tools. Saved chats still hold their outputs,
 * so they replay through these contracts. Nothing registers them as tools.
 */
export const LEGACY_TOOL_CONTRACTS = {
  getSchemaTables: {
    name: 'getSchemaTables',
    outputSchema: z.union([z.array(entityDefinitionsRowSchema), stringOutputSchema]),
    toModelOutput: gatedBySchemaLevel,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  getRlsKnowledge: {
    name: 'getRlsKnowledge',
    outputSchema: stringOutputSchema,
    toModelOutput: trimRlsKnowledge,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  getFunctions: {
    name: 'getFunctions',
    outputSchema: stringOutputSchema,
    toModelOutput: gatedBySchemaLevel,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  // The saved guidance is stale and `load_knowledge` replaces it, so replay a pointer instead.
  // It holds no project data, so it is safe at every level.
  getEdgeFunctionKnowledge: {
    name: 'getEdgeFunctionKnowledge',
    outputSchema: stringOutputSchema,
    toModelOutput: () => EDGE_FUNCTION_KNOWLEDGE_MOVED_MESSAGE,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
} as const satisfies Record<string, LegacyToolContract>

export type LegacyToolName = keyof typeof LEGACY_TOOL_CONTRACTS

/** The contract for a removed tool, or `undefined` if the name isn't a legacy tool. */
export function getLegacyToolContract(toolName: string): LegacyToolContract | undefined {
  const contracts: Partial<Record<string, LegacyToolContract>> = LEGACY_TOOL_CONTRACTS
  return Object.hasOwn(contracts, toolName) ? contracts[toolName] : undefined
}
