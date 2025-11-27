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

    // If the theme is dark, the button background will be light and vice-versa
    const imageSrc = `${basePath}/img/mcp-clients/${client.icon}${
      theme === 'light' ? '-dark' : ''
    }-icon.svg`

    return {
      deepLink,
      imageSrc,
      label: client.label,
    }
  }
  return null
}
