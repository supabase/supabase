import { getMcpClientIconAssetUrl } from './mcpIconAssets'

/**
 * Returns the URL to an imported MCP client icon asset.
 * Dark variants are only used when the client has a distinct dark asset.
 */
export function getMcpClientIconSrc({
  icon,
  useDarkVariant,
  hasDistinctDarkIcon,
}: {
  icon: string
  useDarkVariant: boolean
  hasDistinctDarkIcon?: boolean
}): string {
  return getMcpClientIconAssetUrl(icon, useDarkVariant && Boolean(hasDistinctDarkIcon))
}
