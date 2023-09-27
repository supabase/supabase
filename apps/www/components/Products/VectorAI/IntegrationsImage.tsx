import React, { useRef } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import { useBreakpoint } from 'common'

const IntegrationsImage = () => {
  const { resolvedTheme } = useTheme()
  const isMobile = useBreakpoint(767)
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const initial = INITIAL_BOTTOM
  const animate = getAnimation({})

  console.log('ismobile', isMobile)

  const image =
    resolvedTheme === 'dark'
      ? `/images/product/vector/vector-tools-dark${isMobile ? '-mobile' : ''}.svg`
      : `/images/product/vector/vector-tools-light${isMobile ? '-mobile' : ''}.svg`

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        initial={initial}
        animate={isInView ? animate : initial}
        className="relative w-full h-full"
      >
        <Image
          src={image}
          alt="Diagram of Machine Learning tools that integrate with Supabase Vector"
          layout="fill"
          objectFit="contain"
        />
      </m.div>
    </LazyMotion>
  )
}

export default IntegrationsImage
