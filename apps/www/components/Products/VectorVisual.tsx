import { useBreakpoint } from 'common'
import Image from 'next/image'
import React from 'react'

const VectorVisual = () => {
  const isTablet = useBreakpoint(1023)

  return (
    <div className="absolute inset-0 z-0">
      <Image
        src={`/images/index/products/vector${isTablet ? '-mobile' : ''}2.svg`}
        alt="Supabase Postgres Vector AI"
        layout="fill"
        objectFit="cover"
        objectPosition={isTablet ? 'center' : 'right'}
        className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        quality={100}
      />
      <Image
        src={`/images/index/products/vector${isTablet ? '-mobile' : ''}1.svg`}
        alt="Supabase Postgres Vector AI"
        layout="fill"
        objectFit="cover"
        objectPosition={isTablet ? 'center' : 'right'}
        className="absolute inset-0"
        quality={100}
      />
    </div>
  )
}

export default VectorVisual
