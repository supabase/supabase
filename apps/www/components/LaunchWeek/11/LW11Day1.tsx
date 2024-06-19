import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns'
import { WeekDayProps } from './Releases/data'
import { DayLink } from './Releases/components'
import Link from 'next/link'

const LW11Day1 = ({
  day,
  className,
  cardClassName,
}: {
  day: WeekDayProps
  className?: string
  cardClassName?: string
}) => (
  <section
    id={day.id}
    className={cn(
      'lwx-nav-anchor border-b py-8 first:border-t dark:border-[#111718] scroll-mt-16 grid grid-cols-1 gap-4 md:grid-cols-3',
      className
    )}
  >
    {/* Day title and links */}
    <div
      id={day.isToday ? 'today' : undefined}
      className="flex h-full scroll-mt-10 flex-col gap-4 items-between"
    >
      <div className="md:max-w-xs flex flex-col gap-4">
        <ExpandableVideo
          videoId={day.videoId ?? ''}
          imgUrl={day.videoThumbnail}
          imgOverlayText="Watch announcement"
          priority
        />
      </div>
      {!!day.links && (
        <ul className="flex-1 h-full w-full justify-end xs:grid grid-cols-2 lg:grid-cols-3 flex flex-col gap-1">
          {day.links?.map((link) => (
            <li key={link.href}>
              <DayLink {...link} />
            </li>
          ))}
        </ul>
      )}
    </div>
    {/* Card */}
    <div
      className={cn(
        `group relative overflow-hidden flex-1 flex col-span-2 
          md:px-4 text-2xl`,
        cardClassName
      )}
    >
      <div className="relative text-sm w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 rounded-xl border gap-px bg-border overflow-hidden">
        {day.steps?.map((step) => (
          <Link
            href={step.url!}
            key={step.title}
            target="_blank"
            className="flex group/step flex-col gap-2 p-4 transition-colors bg-surface-75 hover:bg-surface-100 overflow-hidden border-0"
          >
            <div className="flex-1 flex justify-between items-start">
              <div className="flex items-center gap-1 mb-4 transition-colors text-foreground-light group-hover/step:text-foreground group-focus-visible/step:text-foreground">
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d={step.icon}
                    stroke="currentColor"
                  />
                </svg>
                <span>{step.title}</span>
              </div>
              <ArrowRight className="w-4 ml-2 -mt-px opacity-0 -rotate-45 translate-y-1 -translate-x-1 text-foreground-light transition-all will-change-transform group-hover/step:opacity-100 group-hover/step:translate-y-0 group-hover/step:translate-x-0" />
            </div>
            <p className="text-foreground">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

export default LW11Day1
