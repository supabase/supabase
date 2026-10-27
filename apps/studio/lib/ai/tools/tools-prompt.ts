import {
  isToolAvailable,
  REMOTE_TOOL_CONTRACTS,
  TOOL_CONTRACTS,
  type ToolRequest,
} from './registry'
import type { RemoteToolContract } from './types'

/**
 * The chat system prompt's tool section, built from the contracts available to the request:
 * every available tool by name, then the `promptGuidance` of those that have it. A tool the
 * request doesn't have never appears, so the prompt can't tell the model to call it.
 *
 * The system prompt is cached, so the output must depend only on the request, never on
 * per-request data. It changes only when the tool set does, which already invalidates the cached
 * system prompt because providers cache tools first; see `generateAssistantResponse`. Tools the
 * opt-in level blocks are still listed, since they stay registered as stubs. The self-hosted
 * fallback tools aren't contracts, so they aren't listed.
 */
export function buildToolsPrompt(request: ToolRequest): string {
  const contracts: RemoteToolContract[] = [
    ...Object.values(TOOL_CONTRACTS),
    ...Object.values(REMOTE_TOOL_CONTRACTS),
  ]
  const available = contracts
    .filter((contract) => isToolAvailable(contract.availability, request))
    .sort((a, b) => (a.name < b.name ? -1 : 1))

  const names = available.map(({ name }) => `\`${name}\``).join(', ')
  const sections = available.flatMap(({ name, promptGuidance }) =>
    promptGuidance ? [`### \`${name}\`\n${promptGuidance.trim()}`] : []
  )

  return [`## Tools\nTools available in this chat: ${names}.`, ...sections].join('\n\n')
}
