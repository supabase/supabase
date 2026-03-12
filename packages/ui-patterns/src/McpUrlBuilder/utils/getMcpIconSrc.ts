/**
 * Returns the path to an MCP client icon.
 * Light: {icon}-icon.svg, dark (when hasDistinctDarkIcon): {icon}-icon-dark.svg.
 * Only uses the dark variant when useDarkVariant is true AND hasDistinctDarkIcon is set.
 */
export function getMcpClientIconSrc({
  basePath,
  iconFolder,
  icon,
  useDarkVariant,
  hasDistinctDarkIcon,
}: {
  basePath: string
  iconFolder: string
  icon: string
  useDarkVariant: boolean
  hasDistinctDarkIcon?: boolean
}): string {
  const suffix = useDarkVariant && hasDistinctDarkIcon ? '-dark' : ''
  return `${basePath}/img/${iconFolder}/${icon.toLowerCase()}-icon${suffix}.svg`
}
