import type { McpClient, McpClientConfig } from '../types'

interface GetMcpButtonDataOptions {
  basePath: string
  theme?: 'light' | 'dark'
  client: McpClient
  clientConfig: McpClientConfig
}

export function getMcpButtonData({
  basePath,
  theme,
  client,
  clientConfig,
}: GetMcpButtonDataOptions) {
  if (client.generateDeepLink) {
    const deepLink = client.generateDeepLink(clientConfig)
    if (!deepLink) return null

    const imageSrc = `${basePath}/img/mcp-clients/${client.icon}${
      theme === 'dark' ? '-dark' : ''
    }-icon.svg`

    return {
      deepLink,
      imageSrc,
      label: client.label,
    }
  }
  return null
}
