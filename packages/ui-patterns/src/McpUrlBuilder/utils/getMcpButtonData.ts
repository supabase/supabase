import type { McpClient, McpClientConfig } from '../types'
import { getMcpClientIconSrc } from './getMcpIconSrc'

interface GetMcpButtonDataOptions {
  basePath: string
  theme?: 'light' | 'dark'
  client: McpClient
  clientConfig: McpClientConfig
  isPlatform?: boolean
}

export function getMcpButtonData({
  basePath,
  theme,
  client,
  clientConfig,
  isPlatform,
}: GetMcpButtonDataOptions) {
  if (client.generateDeepLink) {
    const deepLink = client.generateDeepLink(clientConfig, { isPlatform })
    if (!deepLink) return null

    // If the theme is dark, the button background will be light and vice-versa
    const imageSrc = getMcpClientIconSrc({
      basePath,
      iconFolder: 'mcp-clients',
      icon: client.icon!,
      useDarkVariant: theme === 'light',
      hasDistinctDarkIcon: client.hasDistinctDarkIcon,
    })

    return {
      deepLink,
      imageSrc,
      label: client.label,
    }
  }
  return null
}
