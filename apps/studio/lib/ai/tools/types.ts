import type { JSONValue, Tool } from 'ai'
import type { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export type ToolContext = {
  projectRef?: string
  connectionString?: string
  authorization?: string
  aiOptInLevel?: AiOptInLevel
}

/**
 * Isomorphic: zod and pure functions only, so nothing here may import the data layer.
 */
export type ToolContract<TInput = unknown, TOutput = unknown> = {
  name: string
  description: string
  inputSchema: z.ZodType<TInput, z.ZodTypeDef, unknown>
  outputSchema: z.ZodType<TOutput, z.ZodTypeDef, unknown>
  /** Lowest opt-in level at which the tool runs. `null` means always available. */
  minOptInLevel: AiOptInLevel | null
  needsApproval: boolean
  /**
   * What the model may see of the output. Applied to the current turn and again on
   * history replay, so it must be safe to run on its own result.
   */
  toModelOutput?(output: TOutput, optInLevel: AiOptInLevel): JSONValue
}

export type ToolContractInput<C extends ToolContract> = z.infer<C['inputSchema']>
export type ToolContractOutput<C extends ToolContract> = z.infer<C['outputSchema']>

/** The server half of a tool: builds the executable tool for a contract. */
export type ToolFactory<C extends ToolContract> = (
  ctx: ToolContext
) => Tool<ToolContractInput<C>, ToolContractOutput<C>>

/**
 * A server half whose `execute` runs after the user approves. Only a contract declared with
 * `needsApproval: true` satisfies the constraint. Build it with `approvalGatedToolFromContract`,
 * which gives `execute` the `ApprovalGate` it needs to promote untrusted SQL.
 */
export type ApprovalGatedToolFactory<C extends ToolContract & { readonly needsApproval: true }> =
  ToolFactory<C>
