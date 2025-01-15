import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from '@heroicons/react/outline'
import { cn, Skeleton } from 'ui'
import { Edit } from 'lucide-react'
import { useBreakpoint } from 'common'

import { WeekDayProps } from '../data'
import CountdownComponent from '../../Countdown'
import { DayLink } from '.'

const DaySection = ({ day, className }: { day: WeekDayProps; className?: string }) => {
  const isMobile = useBreakpoint('sm')
  const cssGroup = 'group/d' + day.d

  return (
    <section
      id={day.id}
      className={cn(
        'lw-nav-anchor border-b py-8 first:border-t border-muted dark:border-muted/50 text-foreground scroll-mt-16 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-3',
        className
      )}
    >
      {/* Day title and links */}
      <div
        id={day.isToday ? 'today' : undefined}
        className="flex h-full scroll-mt-10 flex-col gap-4 items-between"
      >
        <div
          className={cn(
            'text-sm inline uppercase font-mono dark:text-foreground-muted tracking-[0.1rem]',
            day.shipped && '!text-foreground'
          )}
        >
          {day.dd}, {day.date}
        </div>
        {!!day.links && (
          <ul className="flex-1 h-full w-full justify-end grid grid-cols-2 md:flex flex-col gap-1">
            {day.links?.map((link) => (
              <li key={link.href}>
                <DayLink {...link} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Day card */}
      <div className="flex md:col-span-3 xl:col-span-2">
        {day.shipped && day.steps.length > 0 ? (
          <Link
            href={day.blog!}
            className={cn(
              `
              bg-surface-75
              min-h-[210px] group sm:aspect-[3.67/1] relative overflow-hidden flex-1 flex flex-col justify-between
              hover:border-strong transition-colors border border-muted
              rounded-xl text-2xl bg-contain shadow-sm`,
              cssGroup
            )}
          >
            <div className="relative text-foreground-light p-4 sm:px-6 md:py-6 md:px-8 z-20 flex-grow flex flex-col items-start justify-between gap-2 w-full lg:w-1/2 text-left">
              <div className="relative w-full flex items-center gap-2 text-sm translate-x-0 !ease-[.24,0,.22,.99] duration-200 group-hover:-translate-x-6 transition-transform">
                <Edit className="w-4 min-w-4 group-hover:opacity-0 transition-opacity" />
                <span>Blog post</span>
                <ArrowRightIcon className="w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg leading-7 [&_strong]:font-normal [&_strong]:text-foreground">
                {day.description}
              </h2>
            </div>
            <div className="relative z-10 border-b border-muted/40 sm:border-none w-full order-first aspect-[2/1] sm:aspect-auto sm:absolute sm:inset-0">
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-background-surface-75 from-0% via-background-surface-75 via-20% to-transparent to-75% w-full h-full z-0" />
              {day.steps[0]?.bg_layers &&
                day.steps[0]?.bg_layers?.map((layer, i) => (
                  <>
                    {!!layer.img && (
                      <div
                        key={`${day.title}-image-${i}?v=3`}
                        className="absolute transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                      >
                        <Image
                          src={!!layer.mobileImg && isMobile ? layer.mobileImg : layer.img}
                          className={`
                            hidden dark:block absolute object-cover
                            w-full h-full z-0 transition-all duration-300
                            object-center sm:object-right
                          `}
                          fill
                          sizes="100%"
                          quality={100}
                          alt={day.title}
                        />
                      </div>
                    )}
                    {!!layer.imgLight && (
                      <div
                        key={`${day.title}-image-${i}-light`}
                        className="absolute sm:opacity-90 transition-opacity inset-0 w-full h-full -z-10 group-hover/d1:opacity-100"
                      >
                        <Image
                          src={
                            !!layer.mobileImgLight && isMobile
                              ? layer.mobileImgLight
                              : layer.imgLight
                          }
                          className={`
                            dark:hidden absolute md:opacity-50 lg:opacity-100 object-cover
                            w-full h-full z-0 transition-all duration-300
                            object-center sm:object-right
                          `}
                          fill
                          sizes="100%"
                          quality={100}
                          alt={day.title}
                        />
                      </div>
                    )}
                  </>
                ))}
            </div>
          </Link>
        ) : (
          <div
            className={cn(
              `min-h-[210px] group aspect-[3.67/1] relative overflow-hidden flex-1 flex flex-col justify-between
              bg-default border border-dashed border-strong dark:border-background-surface-300
              rounded-xl p-4 sm:p-6 md:p-8 text-2xl bg-contain`,
              cssGroup
            )}
          >
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
                    fill="currentColor"
                  />
                </g>
              </svg>
              {day.hasCountdown && <CountdownComponent date={day.published_at} showCard={false} />}
            </div>
            <div>
              <Skeleton className="w-full h-3 max-w-xs rounded-full will-change-contents" />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default DaySection
