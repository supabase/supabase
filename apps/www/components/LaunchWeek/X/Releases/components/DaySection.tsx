import React from 'react'
import { WeekDayProps } from '../data'
import { DayLink } from '.'
import Image from 'next/image'
import { useBreakpoint } from 'common'
import { IconEdit2, cn } from 'ui'
import CountdownComponent from '../../Countdown'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/outline'

const DaySection = ({ day }: { day: WeekDayProps }) => {
  const isTablet = useBreakpoint(1023)
  const cssGroup = 'group/d' + day.d

  return (
    <section
      id={day.id}
      className="lwx-nav-anchor border-b py-8 first:border-t border-[#111718] text-[#575E61] scroll-mt-16 grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {/* Day title and links */}
      <div
        id={day.isToday ? 'today' : undefined}
        className="flex h-full scroll-mt-10 flex-col gap-4 items-between"
      >
        <div
          className={cn(
            'text-sm inline uppercase font-mono text-foreground-muted tracking-[0.1rem]',
            day.shipped && 'text-foreground'
          )}
        >
          {day.dd}, {day.date}
        </div>
        {day.shipped && (
          <ul className="flex-1 h-full w-full justify-end grid grid-cols-2 md:flex flex-col gap-1">
            {day.links?.map((link) => (
              <li key={link.href}>
                <DayLink {...link} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Day Countdown */}
      {!day.shipped && day.hasCountdown && (
        <div className="flex items-center gap-2 h-5">
          <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.5">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.32656 7.58047V5.98047C4.32656 3.77133 6.11742 1.98047 8.32656 1.98047C10.5357 1.98047 12.3266 3.77133 12.3266 5.98047V7.58047C13.2102 7.58047 13.9266 8.29681 13.9266 9.18047V13.1805C13.9266 14.0641 13.2102 14.7805 12.3266 14.7805H4.32656C3.44291 14.7805 2.72656 14.0641 2.72656 13.1805V9.18047C2.72656 8.29681 3.44291 7.58047 4.32656 7.58047ZM10.7266 5.98047V7.58047H5.92656V5.98047C5.92656 4.65499 7.00108 3.58047 8.32656 3.58047C9.65205 3.58047 10.7266 4.65499 10.7266 5.98047Z"
                fill="#A0A0A0"
              />
            </g>
          </svg>
          <CountdownComponent date={day.published_at} showCard={false} />
        </div>
      )}

      {/* Day card */}
      {day.shipped && day.steps.length > 0 && (
        <div className="flex col-span-2">
          <Link
            href={day.blog!}
            className={cn(
              // bg-[#111415] hover:bg-[#121516]
              `min-h-[210px] group aspect-[3.67/1] relative overflow-hidden flex-1 flex flex-col justify-between
              hover:border-strong transition-colors border border-muted
              rounded-xl p-4 sm:p-6 md:p-8 text-2xl bg-contain shadow-lg`,
              cssGroup
            )}
          >
            <div className="relative z-10 flex-grow flex flex-col items-start justify-between gap-2 w-full lg:w-3/5 text-left">
              <div className="relative w-full flex items-center gap-2 text-sm translate-x-0 !ease-[.24,0,.22,.99] duration-200 group-hover:-translate-x-6 transition-transform">
                <IconEdit2 className="w-4 min-w-4 group-hover:opacity-0 transition-opacity" />
                <span className="">Blog post</span>
                <ArrowRightIcon className="w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg leading-7 [&_strong]:font-normal [&_strong]:text-foreground">
                {day.description}
              </h2>
            </div>
            {day.steps[0]?.bg_layers &&
              day.steps[0]?.bg_layers?.map(
                (layer, i) =>
                  !!layer.img && (
                    <div
                      key={`${day.title}-image-${i}`}
                      className="absolute opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                    >
                      <Image
                        src={!!layer.mobileImg && isTablet ? (layer.mobileImg as any) : layer.img}
                        className={`
                          absolute opacity-50 lg:opacity-100 object-cover
                          w-full h-full z-0 transition-all duration-300
                        `}
                        fill
                        objectPosition={isTablet ? '50%' : '30% 50%'}
                        alt={day.title}
                      />
                    </div>
                  )
              )}
          </Link>
        </div>
      )}
    </section>
  )
}

export default DaySection
