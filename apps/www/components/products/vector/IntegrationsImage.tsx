import React, { useRef } from 'react'
import Image from 'next/image'
import { useTheme } from 'common/Providers'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'

const IntegrationsImage = () => {
  const { isDarkMode } = useTheme()
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const initial = INITIAL_BOTTOM
  const animate = getAnimation({})

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={ref}
        initial={initial}
        animate={isInView ? animate : initial}
        className="relative w-full h-full"
      >
        <Image
          src={
            isDarkMode
              ? '/images/product/vector/vector-tools-dark.svg'
              : '/images/product/vector/vector-tools-light.svg'
          }
          alt="Diagram of Machine Learning tools that integrate with Supabase Vector"
          layout="fill"
          objectFit="contain"
        />
      </m.div>
    </LazyMotion>
  )
}

export default IntegrationsImage
