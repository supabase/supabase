import { useBreakpoint } from 'common'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import React, { useState } from 'react'
import { cn } from 'ui'

const PricingComputeAnimation = () => {
  const { resolvedTheme } = useTheme()
  const [triggerAnimation, setTriggerAnimation] = useState(false)
  const isTablet = useBreakpoint(1023)

  return (
    <figure
      className="h-full relative lg:absolute lg:-right-24 xl:-right-10 aspect-[541/285]"
      onMouseEnter={() => setTriggerAnimation(true)}
    >
      <Image
        fill
        src={`/images/pricing/compute/compute-cube-${
          resolvedTheme?.includes('dark') ? 'dark' : 'light'
        }-active.svg`}
        alt="Compute addon grid"
        className={cn(
          'absolute inset-0 z-20 transition-opacity opacity-0 !ease-[.76,0,.23,1] duration-300',
          triggerAnimation && 'opacity-100'
        )}
      />
      <Image
        fill
        src={`/images/pricing/compute/compute-cube-${
          resolvedTheme?.includes('dark') ? 'dark' : 'light'
        }-active.svg`}
        alt="Compute addon grid"
        className={cn(
          'absolute inset-0 z-20 transition-all opacity-0 !ease-[.76,0,.23,1] duration-500 delay-500 -translate-y-[18%] blur-md',
          triggerAnimation && 'opacity-100 -translate-y-[8%] blur-none'
        )}
      />
      <Image
        fill
        src={`/images/pricing/compute/compute-cube-${
          resolvedTheme?.includes('dark') ? 'dark' : 'light'
        }-active.svg`}
        alt="Compute addon grid"
        className={cn(
          'absolute inset-0 z-20 transition-all opacity-0 !ease-[.76,0,.23,1] duration-500 delay-1000 -translate-y-[24%] blur-md',
          triggerAnimation && 'opacity-100 -translate-y-[16%] blur-none'
        )}
      />
      <Image
        fill
        src={`/images/pricing/compute/compute-cube-${
          resolvedTheme?.includes('dark') ? 'dark' : 'light'
        }.svg`}
        alt="Compute addon grid"
        className="absolute inset-0 z-10"
      />
      <Image
        fill
        src={`/images/pricing/compute/compute-grid${isTablet ? '-mobile' : ''}-${
          resolvedTheme?.includes('dark') ? 'dark' : 'light'
        }.svg`}
        alt="Compute addon grid"
        className="absolute inset-0 z-0 object-contain object-center"
      />
    </figure>
  )
}

export default PricingComputeAnimation
