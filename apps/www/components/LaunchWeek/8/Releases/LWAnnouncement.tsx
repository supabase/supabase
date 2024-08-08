import React from 'react'
import { SmallCard } from './components'
import Link from 'next/link'
import Image from 'next/image'

const LWAnnouncement = () => {
  const announcement = (
    <>
      <div className="relative flex-shrink flex items-center p-2 w-2/3 md:w-auto">
        <div className="flex flex-col gap-1 sm:pl-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground">Launch Week 8</span>
          </div>
          <span className="text-foreground-light">Explore all the announcements</span>
        </div>
      </div>
      <div className="relative flex items-center justify-center !aspect-video h-[80px] md:h-[80px] gap-2 z-10 rounded overflow-hidden">
        <Image
          src="/images/launchweek/8/lw8-og.jpg"
          alt="Launch Week 8"
          layout="fill"
          objectFit="cover"
        />
      </div>
    </>
  )

  return (
    <div className="w-full max-w-xl opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]">
      <SmallCard
        className="border hover:border-stronger transition-colors"
        innerClassName="bg-opacity-70 items-stretch"
      >
        <Link
          href="/launch-week"
          className="flex flex-row justify-between items-center w-full h-full gap-2 text-left"
        >
          {announcement}
        </Link>
      </SmallCard>
    </div>
  )
}

export default LWAnnouncement
