import { useTheme } from 'next-themes'
import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

interface ConnectionIconProps {
  icon: string
}

export const ConnectionIcon = ({ icon }: ConnectionIconProps) => {
  const { resolvedTheme } = useTheme()

  const imageFolder = ['ionic-angular'].includes(icon) ? 'icons/frameworks' : 'libraries'
  const imageExtension = imageFolder === 'icons/frameworks' ? '' : '-icon'
  const iconImgSrc = icon.startsWith('http')
    ? icon
    : `${BASE_PATH}/img/${imageFolder}/${icon.toLowerCase()}${
        ['expo', 'nextjs', 'prisma', 'drizzle', 'astro', 'remix'].includes(icon.toLowerCase())
          ? resolvedTheme?.includes('dark')
            ? '-dark'
            : ''
          : ''
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
