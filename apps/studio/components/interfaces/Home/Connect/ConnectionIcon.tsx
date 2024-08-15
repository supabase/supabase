import { BASE_PATH } from 'lib/constants'

import { useTheme } from 'next-themes'
import Image from 'next/image'
interface ConnectionIconProps {
  connection: any
}

const ConnectionIcon = ({ connection }: ConnectionIconProps) => {
  const { resolvedTheme } = useTheme()

  const imageFolder = ['ionic-angular'].includes(connection) ? 'icons/frameworks' : 'libraries'
  const imageExtension = imageFolder === 'icons/frameworks' ? '' : '-icon'

  return (
    <Image
      className="transition-all group-hover:scale-110"
      src={`${BASE_PATH}/img/${imageFolder}/${connection.toLowerCase()}${
        ['expo', 'nextjs', 'prisma', 'drizzle', 'astro', 'remix'].includes(connection.toLowerCase())
          ? resolvedTheme?.includes('dark')
            ? '-dark'
            : ''
          : ''
      }${imageExtension}.svg`}
      alt={`${connection} logo`}
      width={14}
      height={14}
    />
  )
}

export default ConnectionIcon
