import { getMcpClientIconSrc } from '../utils/getMcpIconSrc'

interface ConnectionIconProps {
  basePath: string
  theme?: 'light' | 'dark'
  iconFolder: string
  connection: string
  /** Set when this client has a separate -icon-dark.svg; otherwise the same icon is used for both themes. */
  hasDistinctDarkIcon?: boolean
  iconExtension?: string
}

export const ConnectionIcon = ({
  basePath,
  theme = 'dark',
  iconFolder,
  connection,
  hasDistinctDarkIcon,
  iconExtension,
}: ConnectionIconProps) => {
  const src = getMcpClientIconSrc({
    basePath,
    iconFolder,
    icon: connection,
    useDarkVariant: theme === 'dark',
    hasDistinctDarkIcon,
    iconExtension,
  })
  return <img src={src} alt={`${connection} logo`} width={14} height={14} />
}
