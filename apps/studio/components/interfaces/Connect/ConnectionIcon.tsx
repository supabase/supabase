import { useTheme } from 'next-themes'
import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

interface ConnectionIconProps {
  icon: string
  iconFolder?: string
  supportsDarkMode?: boolean
}

export const ConnectionIcon = ({ icon, iconFolder, supportsDarkMode }: ConnectionIconProps) => {
  const { resolvedTheme } = useTheme()

  const imageFolder =
    iconFolder || (['ionic-angular'].includes(icon) ? 'icons/frameworks' : 'libraries')

  const imageExtension = imageFolder === 'icons/frameworks' ? '' : '-icon'

  const shouldUseDarkMode =
    supportsDarkMode ||
    ['expo', 'nextjs', 'prisma', 'drizzle', 'astro', 'remix'].includes(icon.toLowerCase())

  const iconImgSrc = icon.startsWith('http')
    ? icon
    : `${BASE_PATH}/img/${imageFolder}/${icon.toLowerCase()}${
        shouldUseDarkMode && resolvedTheme?.includes('dark') ? '-dark' : ''
      }${imageExtension}.svg`

  return (
    <Image
      className="transition-all group-hover:scale-110"
      src={iconImgSrc}
      alt={`${icon} logo`}
      width={14}
      height={14}
    />
  )
}
