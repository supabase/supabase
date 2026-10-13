import type { InferUITools, Tool, ToolUIPart, UIDataTypes, UIMessage } from 'ai'

import type { ToolName } from '../tool-filter'
import type { ToolContract, ToolContractInput, ToolContractOutput } from './types'
import { contract as updateNotebook } from './update-notebook'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

/**
 * Every tool that has migrated to a contract. Tools not listed here are still described
 * by hand in the places the contract replaces.
 */
export const TOOL_CONTRACTS = {
  update_notebook: updateNotebook,
} as const satisfies Partial<Record<ToolName, ToolContract>>

export type ContractToolName = keyof typeof TOOL_CONTRACTS

type ContractTools = {
  [K in ContractToolName]: Tool<
    ToolContractInput<(typeof TOOL_CONTRACTS)[K]>,
    ToolContractOutput<(typeof TOOL_CONTRACTS)[K]>
  >
}

export type ContractUITools = InferUITools<ContractTools>

/**
 * A message whose `tool-<name>` parts are typed for every contract tool. The first two type
 * parameters are the SDK defaults, since the assistant types neither message metadata nor
 * custom data parts.
 */
export type StudioUIMessage = UIMessage<unknown, UIDataTypes, ContractUITools>

/** The contract for a migrated tool, or `undefined` if the tool hasn't been migrated. */
export function getToolContract(toolName: string): ToolContract | undefined {
  return Object.hasOwn(TOOL_CONTRACTS, toolName)
    ? TOOL_CONTRACTS[toolName as ContractToolName]
    : undefined
}

/**
 * Applies the contract's `toModelOutput` to a persisted tool part, for history replay (where
 * the SDK doesn't call it). Returns `undefined` when the tool has no contract. An output that
 * doesn't match the contract's schema is dropped rather than passed through unchecked.
 */
export function sanitizeContractPart<Part extends ToolUIPart>(
  part: Part,
  optInLevel: AiOptInLevel
): Part | undefined {
  const contract = getToolContract(part.type.slice('tool-'.length))
  if (!contract) return undefined
  if (!contract.toModelOutput) return part

  const parsed = contract.outputSchema.safeParse(part.output)
  return {
    ...part,
    output: parsed.success ? contract.toModelOutput(parsed.data, optInLevel) : undefined,
  }
}
