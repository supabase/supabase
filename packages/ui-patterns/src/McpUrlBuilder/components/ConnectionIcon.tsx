interface ConnectionIconProps {
  basePath: string
  theme?: 'light' | 'dark'
  supportsDarkMode?: boolean
  iconFolder: string
  connection: string
}

export const ConnectionIcon = ({
  basePath,
  theme = 'dark',
  supportsDarkMode,
  iconFolder,
  connection,
}: ConnectionIconProps) => {
  return (
    <img
      src={`${basePath}/img/${iconFolder}/${connection.toLowerCase()}${
        supportsDarkMode && theme === 'dark' ? '-dark' : ''
      }-icon.svg`}
      alt={`${connection} logo`}
      width={14}
      height={14}
    />
  )
}
