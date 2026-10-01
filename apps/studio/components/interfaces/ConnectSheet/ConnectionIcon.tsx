import { useTheme } from 'next-themes'
import Image from 'next/image'

import { BASE_PATH } from '@/lib/constants'

interface ConnectionIconProps {
  icon: string
  supportsDarkMode?: boolean
  className?: string
}

export const ConnectionIcon = ({ icon, supportsDarkMode, className }: ConnectionIconProps) => {
  const { resolvedTheme } = useTheme()

  const imageFolder = ['ionic-angular'].includes(icon) ? 'icons/frameworks' : 'libraries'

  const imageExtension = imageFolder === 'icons/frameworks' ? '' : '-icon'

  const shouldUseDarkMode =
    supportsDarkMode ||
    ['expo', 'nextjs', 'prisma', 'drizzle', 'astro', 'remix', 'refine'].includes(icon.toLowerCase())

  const iconImgSrc = icon.startsWith('http')
    ? icon
    : `${BASE_PATH}/img/${imageFolder}/${icon.toLowerCase()}${
        shouldUseDarkMode && resolvedTheme?.includes('dark') ? '-dark' : ''
      }${imageExtension}.svg`

  return (
    <Image className={className} src={iconImgSrc} alt={`${icon} logo`} width={14} height={14} />
  )
}
