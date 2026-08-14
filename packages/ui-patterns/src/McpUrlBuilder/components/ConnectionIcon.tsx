import { getMcpClientIconSrc } from '../utils/getMcpIconSrc'

interface ConnectionIconProps {
  theme?: 'light' | 'dark'
  connection: string
  /** Set when this client has a separate -icon-dark.svg; otherwise the same icon is used for both themes. */
  hasDistinctDarkIcon?: boolean
}

export const ConnectionIcon = ({
  theme = 'dark',
  connection,
  hasDistinctDarkIcon,
}: ConnectionIconProps) => {
  const src = getMcpClientIconSrc({
    icon: connection,
    useDarkVariant: theme === 'dark',
    hasDistinctDarkIcon,
  })
  return <img src={src} alt={`${connection} logo`} width={14} height={14} />
}
