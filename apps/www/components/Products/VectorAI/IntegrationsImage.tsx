import React, { useRef } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { useBreakpoint } from 'common'

const IntegrationsImage = () => {
  const ref = useRef(null)
  const { resolvedTheme } = useTheme()
  const isMobile = useBreakpoint(767)
  const isInView = useInView(ref, { margin: '-15%', once: true })

  const initial = INITIAL_BOTTOM
  const animate = getAnimation({})

  const image = resolvedTheme?.includes('dark')
    ? `/images/product/vector/vector-tools-dark${isMobile ? '-mobile' : ''}.png`
    : `/images/product/vector/vector-tools-light${isMobile ? '-mobile' : ''}.png`

  const ResolvedImage = () => (
    <Image
      src={image}
      alt="Diagram of Machine Learning tools that integrate with Supabase Vector"
      layout="fill"
      objectFit="contain"
      quality={100}
    />
  )

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        initial={initial}
        animate={isInView ? animate : initial}
        className="relative w-full h-full"
      >
        <ResolvedImage />
      </m.div>
    </LazyMotion>
  )
}

export default IntegrationsImage
