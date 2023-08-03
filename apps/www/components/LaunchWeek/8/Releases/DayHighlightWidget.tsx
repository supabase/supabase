import React from 'react'
import { SmallCard } from './components'
import Link from 'next/link'
import Image from 'next/image'

const DayHighlightWidget = () => {
  return (
    <div className="w-full max-w-xl">
      <SmallCard
        className="hover:from-scale-900 hover:to-scale-900 border border-surface-200"
        innerClassName="bg-opacity-20 group-hover:bg-opacity-100"
      >
        <Link href="#currentDay">
          <a className="flex flex-row justify-between items-center w-full h-full gap-2">
            <div className="relative flex-shrink flex items-center p-2 w-2/3 lg:w-1/2 md:w-auto">
              <div className="flex flex-col gap-1 sm:pl-4">
                <span className="text-white">Join us daily at Twitter Spaces </span>
                <span className="">Next up: Monday – Opening Day</span>
              </div>
            </div>
            <div className="relative flex !aspect-video h-[80px] md:h-[100px] gap-2 z-10 rounded overflow-hidden">
              <Image
                src="/images/launchweek/8/twitter-spaces-thumb.svg"
                alt="twitter spaces thumbnail"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </a>
        </Link>
      </SmallCard>
    </div>
  )
}

export default DayHighlightWidget
