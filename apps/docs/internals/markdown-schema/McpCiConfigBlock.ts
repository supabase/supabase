import { buildMcpCiConfig } from '~/components/McpCiConfigBlock.utils'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

export const McpCiConfigBlock = (): string => {
  const { mcpServers } = getCustomContent(['mcp:servers'])
  const config = buildMcpCiConfig(mcpServers?.remote)

  return '```json\n' + JSON.stringify(config, null, 2) + '\n```'
}
