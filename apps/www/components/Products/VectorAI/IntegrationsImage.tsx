import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useBreakpoint } from 'common'

const IntegrationsImage = () => {
  const { resolvedTheme } = useTheme()
  const isMobile = useBreakpoint(767)

  const ResolvedImage = () => (
    <Image
      src={
        resolvedTheme === 'dark'
          ? `/images/product/vector/vector-tools-dark${isMobile ? '-mobile' : ''}.svg`
          : `/images/product/vector/vector-tools-light${isMobile ? '-mobile' : ''}.svg`
      }
      alt="Diagram of Machine Learning tools that integrate with Supabase Vector"
      layout="fill"
      objectFit="contain"
    />
  )
  return (
    <div className="relative w-full h-full">
      <ResolvedImage />
    </div>
  )
}

export default IntegrationsImage
