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
function gatedBySchemaLevel(output: string | unknown[], optInLevel: AiOptInLevel): JSONValue {
  return isOptInLevelAtLeast(optInLevel, 'schema')
    ? (output as JSONValue)
    : HIDDEN_LEGACY_OUTPUT_MESSAGE
}

const stringOutputSchema = z.string()

/**
 * Self-hosted fallback tools that are being replaced. Saved chats still hold their outputs,
 * so they replay through these contracts. Nothing registers them as tools.
 */
export const LEGACY_TOOL_CONTRACTS = {
  getSchemaTables: {
    name: 'getSchemaTables',
    outputSchema: z.union([z.array(z.unknown()), stringOutputSchema]),
    toModelOutput: gatedBySchemaLevel,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  getRlsKnowledge: {
    name: 'getRlsKnowledge',
    outputSchema: stringOutputSchema,
    toModelOutput: gatedBySchemaLevel,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  getFunctions: {
    name: 'getFunctions',
    outputSchema: stringOutputSchema,
    toModelOutput: gatedBySchemaLevel,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
  // Static guidance with no project data, so it is safe at every level
  getEdgeFunctionKnowledge: {
    name: 'getEdgeFunctionKnowledge',
    outputSchema: stringOutputSchema,
    toModelOutput: (output: string) => output,
    outputOnInvalid: INVALID_LEGACY_OUTPUT_MESSAGE,
  },
} as const satisfies Record<string, LegacyToolContract>

export type LegacyToolName = keyof typeof LEGACY_TOOL_CONTRACTS

/** The contract for a removed tool, or `undefined` if the name isn't a legacy tool. */
export function getLegacyToolContract(toolName: string): LegacyToolContract | undefined {
  const contracts: Partial<Record<string, LegacyToolContract>> = LEGACY_TOOL_CONTRACTS
  return Object.hasOwn(contracts, toolName) ? contracts[toolName] : undefined
}
