import { getMcpClientIconAssetUrl } from './mcpIconAssets'

/**
 * Returns the URL to an imported MCP client icon asset.
 * Dark variants are only used when the client has a distinct dark asset.
 */
export function getMcpClientIconSrc({
  icon,
  useDarkVariant,
  hasDarkIcon,
}: {
  icon: string
  useDarkVariant: boolean
  hasDarkIcon?: boolean
}): string {
  return getMcpClientIconAssetUrl(icon, useDarkVariant && Boolean(hasDarkIcon))
}
