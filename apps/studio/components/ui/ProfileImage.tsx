import Image from 'next/image'
import { ReactNode, useState } from 'react'

import { User } from 'icons'
import { cn } from 'ui'

interface ProfileImageProps {
  alt?: string
  src?: unknown
  placeholder?: ReactNode
  className?: string
}

export const getSafeProfileImageSrc = (src: unknown): string | undefined => {
  if (typeof src !== 'string') return undefined
  const trimmed = src.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const ProfileImage = ({ alt, src, placeholder, className }: ProfileImageProps) => {
  const [hasInvalidImg, setHasInvalidImg] = useState(false)
  const safeSrc = getSafeProfileImageSrc(src)

  return !!safeSrc && !hasInvalidImg ? (
    <Image
      alt={alt ?? ''}
      src={safeSrc}
      width="24"
      height="24"
      className={cn('aspect-square bg-foreground rounded-full object-cover', className)}
      onError={() => setHasInvalidImg(true)}
    />
  ) : (
    placeholder ?? (
      <figure
        className={cn('bg-foreground rounded-full flex items-center justify-center', className)}
      >
        <User size={18} strokeWidth={1.5} className="text-background" />
      </figure>
    )
  )
}
