import React from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/outline'
import { cn } from 'ui'
import { Edit } from 'lucide-react'
import { WeekDayProps } from './Releases/data'
import { DayLink } from './Releases/components'

const LW11Day1 = ({ day, className }: { day: WeekDayProps; className?: string }) => {
  return (
    <div
      id={day.id}
      className={cn(
        `group relative overflow-hidden flex-1 flex flex-col justify-end scroll-mt-16
        bg-[#0e1010] border border-[#14191B] text-[#8B9092]
        rounded-xl p-4 gap-4 md:gap-6 text-2xl shadow-lg`,
        className
      )}
    >
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full py-2">
        <div
          className={cn(
            'text-sm uppercase font-mono text-foreground-muted tracking-[0.1rem] flex-1',
            day.shipped && 'text-foreground'
          )}
        >
          {day.dd} {day.date}
        </div>
        <Link
          href={day.blog}
          className="relative group/link flex items-center gap-2 text-sm translate-x-0 !ease-[.24,0,.22,.99] duration-200 hover:-translate-x-6 transition-transform hover:cursor-pointer"
        >
          <Edit className="w-4 min-w-4 group-hover/link:opacity-0 transition-opacity" />
          <span>Blog post</span>
          <ArrowRightIcon className="w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </Link>
      </div>
      <div className="text-lg leading-7 [&_strong]:font-normal [&_strong]:text-foreground md:mt-2 max-w-xl">
        {day.description}
      </div>
      <div className="relative text-sm w-full gap-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {day.steps?.map((step, i) => (
          <div
            key={step.title}
            className="flex flex-col gap-2 p-4 rounded-xl bg-surface-75 transition-colors border hover:border-strong overflow-hidden"
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
  )
}

export default LW11Day1
