import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

const LWHeader = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'relative w-full pt-10 sm:pt-8 overflow-hidden lg:h-[400px] lg:min-h-[400px]',
        className
      )}
    >
      <SectionContainer className="h-full flex flex-col items-start justify-end gap-3 !max-w-none lg:!container !pb-4 md:!pb-10 !pointer-events-none">
        <h1 className="text-3xl uppercase tracking-wide pointer-events-none">
          Launch Week <span className="font-mono">13</span>
        </h1>
        <p className="text-foreground-lighter max-w-xs md:max-w-sm pointer-events-none">
          A week of new features and new ways to level up your development.
        </p>
      </SectionContainer>
    </div>
  )
}

export default LWHeader
