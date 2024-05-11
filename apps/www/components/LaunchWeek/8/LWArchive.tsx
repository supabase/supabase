import React from 'react'
import { StyledArticleBadge } from './Releases/components'
import Image from 'next/image'

const LWArchive = () => {
  return (
    <div className="w-full text-white flex flex-col lg:flex-row gap-8 lg:gap-16">
      <div className="lg:basis-1/3 flex flex-col items-start gap-4">
        <StyledArticleBadge>Throwback</StyledArticleBadge>
        <h2 className="text-4xl">Previous Launch Weeks</h2>
        <p className="text-[#9296AA]">
          Explore our past Launch Weeks, and check the progress we've made on our journey.
        </p>
      </div>
      <div className="lg:basis-2/3 relative grid grid-cols-1 xl:grid-cols-2 gap-4">
        <a
          href="/launch-week/6"
          className="relative h-[160px] group w-full rounded-md md:rounded-lg transition-transform bg-[#030A0C] flex items-center justify-center border border-[#111618] hover:border-brand-800 overflow-hidden"
        >
          <span className="relative z-10 stroke-text inline-block text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground-lighter text-7xl drop-shadow-lg">
            6
          </span>
          <div className="absolute inset-0 grayscale group-hover:grayscale-0">
            <Image
              src="/images/launchweek/archive/lw6.jpg"
              alt="Launch Week 6"
              fill
              sizes="100%"
              className="object-cover"
            />
          </div>
        </a>
        <a
          href="/launch-week/7"
          className="relative h-[160px] group w-full rounded-md md:rounded-lg transition-transform bg-[#030A0C] flex items-center justify-center border border-[#111718] hover:border-brand-1200 overflow-hidden"
        >
          <span className="relative z-10 stroke-text inline-block text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground-lighter text-7xl drop-shadow-lg">
            7
          </span>
          <div className="absolute inset-0 grayscale group-hover:grayscale-0">
            <Image
              src="/images/launchweek/archive/lw7.jpg"
              alt="Launch Week 7"
              fill
              sizes="100%"
              className="object-cover"
            />
          </div>
        </a>
      </div>
    </div>
  )
}

export default LWArchive
