import type { JSONValue, Tool } from 'ai'
import type { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

export type ToolContext = {
  projectRef?: string
  connectionString?: string
  authorization?: string
  aiOptInLevel: AiOptInLevel
  /** Public dashboard URL, used by tools that call Studio's own API routes. */
  baseUrl?: string
}

/**
 * Where Studio is running, from `IS_PLATFORM`:
 * - `platform`: the hosted dashboard, where the remote MCP server and Management API are available.
 * - `self-hosted`: self-hosted or local Studio, which talks only to the project's database.
 */
export type ToolEnvironment = 'platform' | 'self-hosted'

/**
 * Request-level conditions a tool needs beyond its environment. `getTools` marks each one as met:
 * - `explorer`: the Explorer feature flag is on for the user, which gates notebooks.
 * - `supportMode`: the chat is a support conversation.
 * - `baseUrl`: the request has the public dashboard URL, for tools that call Studio's own API routes.
 */
export type ToolRequirement = 'explorer' | 'supportMode' | 'baseUrl'

/** Where a tool is offered. A request gets the tool only in a listed environment, with every requirement met. */
export type ToolAvailability = {
  environments: ReadonlySet<ToolEnvironment>
  requires?: ReadonlySet<ToolRequirement>
}

/**
 * Isomorphic: zod and pure functions only, so nothing here may import the data layer.
 */
export type ToolContract<TInput = unknown, TOutput = unknown> = {
  name: string
  description: string
  inputSchema: z.ZodType<TInput, z.ZodTypeDef, unknown>
  /**
   * For tools whose stored input depends on the request, since the SDK stores the parsed value.
   * It must produce the same type `inputSchema` describes. `inputSchema` stays the shape stored
   * on the message, which is what history and the client parse. Omit it to parse with `inputSchema`.
   */
  createInputSchema?(ctx: ToolContext): z.ZodType<TInput, z.ZodTypeDef, unknown>
  outputSchema: z.ZodType<TOutput, z.ZodTypeDef, unknown>
  /** Where the tool exists, and what else the request must provide for it to be offered. */
  availability: ToolAvailability
  /** Lowest opt-in level at which the tool runs. `null` means always available. */
  minOptInLevel: AiOptInLevel | null
  needsApproval: boolean
  /**
   * Rules for using the tool that its description doesn't cover. Omit it when the description
   * is enough. The chat system prompt includes it only for requests where the tool is available,
   * so it may name only tools that are available whenever this one is. Keep it static: the
   * system prompt is cached, so nothing here may depend on a single request.
   */
  promptGuidance?: string
  /**
   * What the model may see of the output. Required, so a contract can't forget to decide.
   * Applied to the current turn and again on history replay, so it must be safe to run on
   * its own result. Return the output unchanged only if all of it is safe at every level.
   */
  toModelOutput(output: TOutput, optInLevel: AiOptInLevel): JSONValue
  /**
   * What history replay shows the model when a persisted output doesn't match `outputSchema`.
   * Omit it to drop the output.
   */
  outputOnInvalid?: JSONValue
}

/** A tool that no longer exists, kept so its outputs in saved chats replay safely. */
export type LegacyToolContract<TOutput = unknown> = Pick<
  ToolContract<unknown, TOutput>,
  'name' | 'outputSchema' | 'toModelOutput' | 'outputOnInvalid'
>

/**
 * A tool the remote MCP server implements. The server owns the description, input schema,
 * execution and output; Studio decides who may run it, whether it needs approval, and how the
 * system prompt tells the model to use it.
 */
export type RemoteToolContract = Pick<
  ToolContract,
  'name' | 'availability' | 'minOptInLevel' | 'needsApproval' | 'promptGuidance'
>

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
