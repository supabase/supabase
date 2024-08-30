import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LW12Background from '../LW12Background'

const LWHeader = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative w-full overflow-hidden pt-10 sm:pt-8', className)}>
      <div className="absolute z-0 inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute z-0 inset-0 w-full">
          <LW12Background className="absolute z-0 inset-0 w-full flex items-center justify-center opacity-100 transition-opacity h-full" />
        </div>
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_top,#060809)_0%,transparent_100%)]" />
      </div>
      <SectionContainer className="h-full flex flex-col items-start gap-3 !max-w-none lg:!container !pb-4 md:!pb-10">
        <h1 className="text-3xl font-medium uppercase">
          Launch Week <span className="font-mono">12</span>
        </h1>
        <p className="text-foreground-lighter md:text-xl max-w-xs md:max-w-md">
          Join us for a week of new features and find new ways to level up your development
        </p>
      </SectionContainer>
    </div>
  )
}

export default LWHeader
