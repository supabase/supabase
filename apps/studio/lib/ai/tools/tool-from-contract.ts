import type { Tool, ToolExecutionOptions } from 'ai'

import { approvalGate, type ApprovalGate } from './approval-gate'
import type { ToolContext, ToolContract } from './types'

/**
 * Builds the SDK tool for a contract. Description, input schema, approval and the model's
 * view of the output all come from the contract; only `execute` is supplied.
 */
export function toolFromContract<TInput, TOutput>(
  contract: ToolContract<TInput, TOutput>,
  { aiOptInLevel = 'schema' }: ToolContext,
  execute: (input: TInput, options: ToolExecutionOptions<unknown>) => PromiseLike<TOutput> | TOutput
): Tool<TInput, TOutput> {
  const { toModelOutput } = contract

  // The SDK's `Tool` type is conditional on whether `TOutput` is `never`, which TypeScript
  // can't resolve for a generic `TOutput`. Each factory's `ToolFactory<typeof contract>`
  // annotation checks the concrete types instead.
  return {
    description: contract.description,
    inputSchema: contract.inputSchema,
    needsApproval: contract.needsApproval,
    execute,
    toModelOutput: ({ output }: { output: TOutput }) => ({
      type: 'json' as const,
      value: toModelOutput(output, aiOptInLevel),
    }),
  } as unknown as Tool<TInput, TOutput>
}

/**
 * Like `toolFromContract`, for a contract that requires user approval. `execute` also receives
 * the `ApprovalGate`, which is how it gets the functions that promote untrusted SQL.
 */
export function approvalGatedToolFromContract<TInput, TOutput>(
  contract: ToolContract<TInput, TOutput> & { readonly needsApproval: true },
  ctx: ToolContext,
  execute: (
    input: TInput,
    options: ToolExecutionOptions<unknown>,
    gate: ApprovalGate
  ) => PromiseLike<TOutput> | TOutput
): Tool<TInput, TOutput> {
  return toolFromContract(contract, ctx, (input, options) => execute(input, options, approvalGate))
}
