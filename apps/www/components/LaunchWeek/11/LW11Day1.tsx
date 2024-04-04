import React from 'react'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns'
import { WeekDayProps } from './Releases/data'
import { DayLink } from './Releases/components'

const LW11Day1 = ({ day, className }: { day: WeekDayProps; className?: string }) => {
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
        <div className="md:max-w-sm flex flex-col gap-4">
          <ExpandableVideo
            videoId=""
            imgUrl={day.videoThumbnail}
            imgOverlayText="Watch announcement"
          />
          <p className="text-sm text-foreground">Supabase is ready for production use.</p>
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
          md:px-4 text-[#8B9092] text-2xl`,
          // cssGroup,
          className
        )}
      >
        <div className="relative text-sm w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 rounded-xl border gap-px bg-border overflow-hidden">
          {day.steps?.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col gap-2 p-4 transition-colors bg-surface-75 hover:bg-surface-100 overflow-hidden border-0"
            >
              <div className="flex items-center gap-1 mb-4 text-foreground-light">
                <svg
                  className="h-4 w-4 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
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
              <p className="text-foreground">{step.description}</p>
              <ul>
                {step.links?.map((link) => (
                  <li key={`${step.title}-${link.href}`}>
                    <DayLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LW11Day1
