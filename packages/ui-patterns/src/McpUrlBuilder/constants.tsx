import { MCP_CLIENT_DATA, MCP_CLIENT_INSTRUCTIONS } from './clients.data'
import { InlineContent, InstructionBlocks } from './components/InstructionBlocks'
import type { McpClient } from './types'
import { getMcpUrl } from './types'

export {
  DEFAULT_MCP_URL_NON_PLATFORM,
  DEFAULT_MCP_URL_PLATFORM,
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  MCP_CLIENT_GROUPS,
} from './clients.data'

/**
 * The dashboard's client list. Built from the React-free `MCP_CLIENT_DATA` plus
 * the portable instruction blocks in `MCP_CLIENT_INSTRUCTIONS`, rendered to UI
 * by the `InstructionBlocks` adapter. The markdown docs render the same blocks
 * via their own adapter, so the two surfaces can't drift.
 */
export const MCP_CLIENTS: McpClient[] = MCP_CLIENT_DATA.map((data) => {
  const instructions = MCP_CLIENT_INSTRUCTIONS[data.key]
  return {
    ...data,
    ...(instructions?.primary && {
      primaryInstructions: (config, onCopy, options) => (
        <InstructionBlocks
          blocks={instructions.primary!({ isPlatform: !!options?.isPlatform })}
          url={getMcpUrl(config)}
          onCopy={onCopy}
        />
      ),
    }),
    ...(instructions?.alternate && {
      alternateInstructions: (config, onCopy, options) => (
        <InstructionBlocks
          blocks={instructions.alternate!({ isPlatform: !!options?.isPlatform })}
          url={getMcpUrl(config)}
          onCopy={onCopy}
        />
      ),
    }),
    ...(instructions?.deepLinkDescription && {
      deepLinkDescription: <InlineContent parts={instructions.deepLinkDescription} />,
    }),
  }
})
