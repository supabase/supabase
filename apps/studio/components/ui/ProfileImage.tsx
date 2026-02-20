import { User } from 'icons'
import Image from 'next/image'
import { ReactNode, useState } from 'react'
import { cn } from 'ui'

interface ProfileImageProps {
  alt?: string
  src?: string
  placeholder?: ReactNode
  className?: string
}

export const ProfileImage = ({ alt, src, placeholder, className }: ProfileImageProps) => {
  const [hasInvalidImg, setHasInvalidImg] = useState(false)

  return !!src && !hasInvalidImg ? (
    <Image
      alt={alt ?? ''}
      src={src}
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
