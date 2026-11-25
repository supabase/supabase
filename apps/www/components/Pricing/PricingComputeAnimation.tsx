'use client'

import { useBreakpoint } from 'common'
import Image from 'next/image'
import React, { useState } from 'react'
import { cn } from 'ui'

const THEMES = ['light', 'dark'] as const

const PricingComputeAnimation = () => {
  const [triggerAnimation, setTriggerAnimation] = useState(false)
  const isTablet = useBreakpoint(1023)

  return (
    <figure
      className="h-full relative lg:absolute lg:-right-24 xl:-right-10 aspect-541/285"
      onMouseEnter={() => setTriggerAnimation(true)}
    >
      {THEMES.map((theme) => (
        <div
          key={theme}
          className={theme === 'dark' ? 'hidden dark:contents' : 'contents dark:hidden'}
        >
          <Image
            fill
            src={`/images/pricing/compute/compute-cube-${theme}-active.svg`}
            alt="Compute addon grid"
            className={cn(
              'absolute inset-0 z-20 transition-opacity opacity-0 ease-[cubic-bezier(.76,0,.23,1)]! duration-300',
              triggerAnimation && 'opacity-100'
            )}
          />
          <Image
            fill
            src={`/images/pricing/compute/compute-cube-${theme}-active.svg`}
            alt="Compute addon grid"
            className={cn(
              'absolute inset-0 z-20 transition-all opacity-0 ease-[cubic-bezier(.76,0,.23,1)]! duration-500 delay-500 translate-y-[-18%] blur-md',
              triggerAnimation && 'opacity-100 translate-y-[-8%] blur-none'
            )}
          />
          <Image
            fill
            src={`/images/pricing/compute/compute-cube-${theme}-active.svg`}
            alt="Compute addon grid"
            className={cn(
              'absolute inset-0 z-20 transition-all opacity-0 ease-[cubic-bezier(.76,0,.23,1)]! duration-500 delay-1000 translate-y-[-24%] blur-md',
              triggerAnimation && 'opacity-100 translate-y-[-16%] blur-none'
            )}
          />
          <Image
            fill
            src={`/images/pricing/compute/compute-cube-${theme}.svg`}
            alt="Compute addon grid"
            className="absolute inset-0 z-10"
          />
          <Image
            fill
            src={`/images/pricing/compute/compute-grid${isTablet ? '-mobile' : ''}-${theme}.svg`}
            alt="Compute addon grid"
            className="absolute inset-0 z-0 object-contain object-center"
          />
        </div>
      ))}
    </figure>
  )
}

export default PricingComputeAnimation
