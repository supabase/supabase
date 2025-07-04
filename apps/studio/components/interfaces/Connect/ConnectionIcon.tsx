import { useTheme } from 'next-themes'
import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

interface ConnectionIconProps {
  connection: any
  iconFolder?: string
  supportsDarkMode?: boolean
}

export const ConnectionIcon = ({
  connection,
  iconFolder,
  supportsDarkMode,
}: ConnectionIconProps) => {
  const { resolvedTheme } = useTheme()

  const imageFolder =
    iconFolder || (['ionic-angular'].includes(connection) ? 'icons/frameworks' : 'libraries')

  const imageExtension = imageFolder === 'icons/frameworks' ? '' : '-icon'

  const shouldUseDarkMode =
    supportsDarkMode ||
    ['expo', 'nextjs', 'prisma', 'drizzle', 'astro', 'remix'].includes(connection.toLowerCase())

  return (
    <Image
      className="transition-all group-hover:scale-110"
      src={`${BASE_PATH}/img/${imageFolder}/${connection.toLowerCase()}${
        shouldUseDarkMode && resolvedTheme?.includes('dark') ? '-dark' : ''
      }${imageExtension}.svg`}
      alt={`${connection} logo`}
      width={14}
      height={14}
    />
  )
}
