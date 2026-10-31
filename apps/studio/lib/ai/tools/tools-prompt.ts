import { REMOTE_TOOL_CONTRACTS, TOOL_CONTRACTS } from './registry'
import type { RemoteToolContract } from './types'

/**
 * The chat system prompt's tool section, built from the contracts of the tools the model is
 * given: every tool by name, then the `promptGuidance` of those that have it. Deriving it from
 * the tool set itself means the prompt can't name a tool the model doesn't have, whoever built
 * the set (`getTools`, the evals) and even when the remote MCP tools fail to load.
 *
 * The system prompt is cached, so the output must depend only on the tool set, never on
 * per-request data. A change to the tool set already invalidates the cached system prompt
 * because providers cache tools first; see `generateAssistantResponse`. Tools the opt-in level
 * blocks are still listed, since they stay registered as stubs. Names without a contract, such as
 * the legacy ones, aren't listed.
 */
export function buildToolsPrompt(toolNames: Iterable<string>): string {
  // A local contract wins over a remote one of the same name, as in `getTools`.
  const contractsByName = new Map<string, RemoteToolContract>([
    ...Object.values(REMOTE_TOOL_CONTRACTS).map((contract) => [contract.name, contract] as const),
    ...Object.values(TOOL_CONTRACTS).map((contract) => [contract.name, contract] as const),
  ])
  const available = [...new Set(toolNames)]
    .flatMap((name) => contractsByName.get(name) ?? [])
    .sort((a, b) => (a.name < b.name ? -1 : 1))

  const names = available.map(({ name }) => `\`${name}\``).join(', ')
  const sections = available.flatMap(({ name, promptGuidance }) =>
    promptGuidance ? [`### \`${name}\`\n${promptGuidance.trim()}`] : []
  )

  return [`## Tools\nTools available in this chat: ${names}.`, ...sections].join('\n\n')
}
