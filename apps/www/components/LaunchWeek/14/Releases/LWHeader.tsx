import Image from 'next/image'
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
      <div className="absolute z-0 inset-0 w-full h-full">
        <div className="absolute z-0 inset-0 w-full !pointer-events-none"></div>
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-background to-transparent !pointer-events-none" />
      </div>
      <SectionContainer className="h-full flex flex-col items-start justify-end gap-3 !max-w-none lg:!container !pb-4 md:!pb-10 !pointer-events-none">
        <h1 className="text-4xl uppercase tracking-wide pointer-events-none">
          <span className="flex gap-1 items-center">
            <Image
              src="/images/launchweek/14/logo-pixel-small-dark.png"
              width="18"
              height="20"
              className="w-auto h-5 invert dark:invert-0"
              alt=""
            />
            Supabase
          </span>
          LaunchWeek 14
          <span className="block">MAR 31-APR 04</span>
        </h1>
        <p className="text-foreground-lighter max-w-xs md:max-w-sm pointer-events-none uppercase">
          A week of new features and new ways to level up your development.
        </p>
      </SectionContainer>
    </div>
  )
}

export default LWHeader
