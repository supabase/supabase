import { MCP_CLIENT_DATA } from './clients.data'
import { MCP_CLIENT_INSTRUCTIONS } from './clients.instructions.md'
import { InlineContent, InstructionContent } from './components/InstructionBlocks'
import type { McpClient } from './types'
import { getMcpUrl } from './types'

/**
 * The client list for the React surfaces: the React-free `MCP_CLIENT_DATA` joined with the
 * per-client instruction trees from `MCP_CLIENT_INSTRUCTIONS`, rendered to UI by
 * the `InstructionContent`/`InlineContent` adapters. The markdown docs render the
 * same trees via their own adapter, so the two surfaces can't drift.
 */
export const MCP_CLIENTS: McpClient[] = MCP_CLIENT_DATA.map((data) => {
  const instructions = MCP_CLIENT_INSTRUCTIONS[data.key]
  return {
    ...data,
    ...(instructions?.primary && {
      primaryInstructions: (config, onCopy, options) => (
        <InstructionContent
          tree={instructions.primary!({
            isPlatform: !!options?.isPlatform,
            url: getMcpUrl(config),
          })}
          onCopy={onCopy}
        />
      ),
    }),
    ...(instructions?.alternate && {
      alternateInstructions: (config, onCopy, options) => (
        <InstructionContent
          tree={instructions.alternate!({
            isPlatform: !!options?.isPlatform,
            url: getMcpUrl(config),
          })}
          onCopy={onCopy}
        />
      ),
    }),
    ...(instructions?.deepLinkDescription && {
      deepLinkDescription: <InlineContent tree={instructions.deepLinkDescription} />,
    }),
  }
})
