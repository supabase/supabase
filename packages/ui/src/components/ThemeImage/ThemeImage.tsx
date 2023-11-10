import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export const ThemeImage = ({ src, ...props }: any) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <span className="next-image--dynamic-fill !border-none">
      <Image
        {...props}
        src={
          typeof src === 'string'
            ? src
            : mounted && resolvedTheme?.includes('dark')
            ? src.dark
            : src.light
        }
      />
    </span>
  )
}

export default ThemeImage
