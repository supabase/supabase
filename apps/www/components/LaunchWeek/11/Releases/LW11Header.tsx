import React from 'react'
import { cn } from 'ui'
import GALogo from '../GALogo'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LW11Background from '../LW11Background'

const LW11Header = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative w-full overflow-visible', className)}>
      <SectionContainer className="h-full flex flex-col gap-4 !max-w-none lg:!container">
        <GALogo className="w-20 md:w-24 aspect-[1.83/1] h-auto min-h-20 md:min-h-24" />
        <p className="text-foreground-lighter text-xl md:text-2xl">
          Join us in this major milestone and explore all the features that come with it.
        </p>
      </SectionContainer>
      <LW11Background className="absolute z-0 inset-0 w-full flex items-center justify-center opacity-100 transition-opacity aspect-video pointer-events-none" />
    </div>
  )
}

export default LW11Header
