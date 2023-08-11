import React from 'react'
import { SmallCard } from './components'
import Link from 'next/link'
import Image from 'next/image'
// import days from './lw8_data'
// import { ExpandableVideo } from 'ui'

const LWAnnouncement = ({
  title,
  isLaunchWeekPage,
}: {
  title?: string
  isLaunchWeekPage?: boolean
}) => {
  // const [_pre, _d1, _d2, _d3, _d4, currentDay] = days

  const announcement = (
    <>
      <div className="relative flex-shrink flex items-center p-2 w-2/3 md:w-auto">
        <div className="flex flex-col gap-1 sm:pl-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground">Launch Week 8: August 7th–11th</span>
          </div>
          <span className="text-foreground-light">Check out all the announcements</span>
        </div>
      </div>
      <div className="relative flex items-center justify-center !aspect-video h-[80px] md:h-[80px] gap-2 z-10 rounded overflow-hidden">
        {/* <div className="absolute z-10 w-4 h-4 text-white opacity-70">
          <svg viewBox="0 0 81 91" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M76.5621 37.998C82.3369 41.3321 82.3369 49.6673 76.5621 53.0014L13.2198 89.5721C7.44504 92.9062 0.226562 88.7386 0.226562 82.0704L0.226566 8.92901C0.226566 2.26085 7.44506 -1.90673 13.2199 1.42735L76.5621 37.998Z"
              fill="currentColor"
            />
          </svg>
        </div> */}
        <Image
          src="/images/launchweek/8/lw8-og.jpg"
          alt="Launch Week 8"
          layout="fill"
          objectFit="cover"
        />
      </div>
    </>
  )

  // const handleClick = () => {
  //   if (typeof document === 'undefined') return null
  //   const today = document.getElementById('today')
  //   if (!today) return
  //   window.scrollTo({ top: today?.offsetTop + today?.offsetHeight, left: 0, behavior: 'smooth' })
  // }

  return (
    <div className="w-full max-w-xl opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both]">
      <SmallCard
        className="border hover:border-scale-800 transition-colors"
        innerClassName="bg-opacity-70 items-stretch"
      >
        {/* {isLaunchWeekPage ? (
          <ExpandableVideo
            videoId="qzxzLSAJDfE"
            onOpenCallback={handleClick}
            triggerContainerClassName="w-full"
            trigger={
              <div className="flex flex-row justify-between items-stretch w-full h-full gap-2 text-left">
                {announcement}
              </div>
            }
          />
        ) : ( */}
        <Link href="/launch-week">
          <a className="flex flex-row justify-between items-center w-full h-full gap-2 text-left">
            {announcement}
          </a>
        </Link>
        {/* )} */}
      </SmallCard>
    </div>
  )
}

export default LWAnnouncement
