import type { Tool, ToolSet } from 'ai'
import { z } from 'zod'

import { isOptInLevelAtLeast } from './opt-in-level'
import {
  getRemoteToolContract,
  getToolContract,
  REMOTE_TOOL_CONTRACTS,
  TOOL_CONTRACTS,
  type ToolName,
} from './tools/registry'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

// Add the DatabaseExtension type import
export type DatabaseExtension = {
  comment: string | null
  default_version: string
  installed_version: string | null
  name: string
  schema: string | null
}

const basicToolSchema = z.custom<Tool>((value) => typeof value === 'object')

const TOOL_NAMES: ReadonlySet<string> = new Set([
  ...Object.keys(TOOL_CONTRACTS),
  ...Object.keys(REMOTE_TOOL_CONTRACTS),
])

/**
 * Schema for validating that a tool set only contains known tools. The allowlist is the
 * registry: a tool is known when it has a local or remote contract.
 */
export const toolSetValidationSchema = z.record(
  z.custom<ToolName>((name) => typeof name === 'string' && TOOL_NAMES.has(name), 'Unknown tool'),
  basicToolSchema
)

/**
 * The lowest opt-in level a tool needs, `null` if it's always available, or `undefined` if the
 * tool isn't on the allowlist. A name with both a local and a remote contract has the same
 * level in each (a registry test enforces it).
 */
function getToolMinimumLevel(toolName: string): AiOptInLevel | null | undefined {
  return (getToolContract(toolName) ?? getRemoteToolContract(toolName))?.minOptInLevel
}

/**
 * Check if a tool is allowed based on the current opt-in level
 */
function isToolAllowed(toolName: string, aiOptInLevel: AiOptInLevel): boolean {
  const minimumLevel = getToolMinimumLevel(toolName)

  if (minimumLevel === undefined) {
    return false
  }

  // UI tools are always allowed
  if (!minimumLevel) {
    return true
  }

  return isOptInLevelAtLeast(aiOptInLevel, minimumLevel)
}

/**
 * Replaces a blocked tool with a stub that explains the opt-in instead of executing.
 *
 * Names no provider. Studio switches inference providers, and a stale name here becomes a
 * false privacy claim shown to users.
 */
export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
  const privacyMessage =
    'This tool needs a higher opt-in level than your organization has set. The opt-in level is an organization-wide setting. Call `update_opt_in_level` with the lowest level that unlocks this tool so the user can review it. By default, no data is shared. A higher level allows Supabase to send information (like schema, logs, or data) to third-party AI providers solely to generate responses.'
  const condensedPrivacyMessage =
    'Requires opting in to a higher level of sharing data with third-party AI providers. Call `update_opt_in_level` to ask the user to update it.'
  const toolDescription = toolInstance.description
  const description =
    typeof toolDescription === 'function'
      ? (...args: Parameters<typeof toolDescription>) =>
          `${toolDescription(...args)} (Note: ${condensedPrivacyMessage})`
      : `${toolDescription ?? ''} (Note: ${condensedPrivacyMessage})`

  return {
    ...toolInstance,
    description,
    execute: async (_args: any, _context: any) => ({ status: privacyMessage }),
    // The original transformer expects the original tool's output shape. The privacy
    // stub returns only a status message, so retaining it can crash the response stream.
    toModelOutput: undefined,
  }
}

/**
 * Filter tools based on the AI opt-in level
 */
export function filterToolsByOptInLevel(tools: ToolSet, aiOptInLevel: AiOptInLevel): ToolSet {
  return Object.fromEntries(
    Object.entries(tools)
      .filter(([toolName]) => getToolMinimumLevel(toolName) !== undefined)
      .map(([toolName, toolInstance]) => {
        if (isToolAllowed(toolName, aiOptInLevel)) {
          return [toolName, toolInstance]
        }

        // If the tool is not allowed, provide a stub that returns a privacy message
        return [toolName, createPrivacyMessageTool(toolInstance)]
      })
  )
}

/**
 * Drops tools that need approval. A one-shot request can't answer an approval request, so a
 * call to one ends generation without output.
 */
export function withoutApprovalTools(tools: ToolSet): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).filter(([, toolInstance]) => !toolInstance.needsApproval)
  )
}
