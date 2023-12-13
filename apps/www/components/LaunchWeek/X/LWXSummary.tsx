import Image from 'next/image'
import React from 'react'
import { buildDays, mainDays } from './Releases/data'
import { WeekDayProps } from '../types'
import Link from 'next/link'
import { IconArrowRight } from 'ui'

const LWXSummary = () => {
  return (
    <div className="w-full border bg-alternative-200 flex flex-col rounded-lg text-foreground-lighter mt-12">
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 leading-none uppercase text-xs">
          <span className="text-foreground tracking-[1px]">Launch Week</span>{' '}
          <Image
            src="/images/launchweek/lwx/logos/lwx_logo.svg"
            alt="Supabase Launch Week X icon"
            width={16}
            height={16}
            className="w-3 h-3"
          />
        </div>
        <div className="font-mono uppercase tracking-wide text-xs">11-15 Dec</div>
      </div>
      <div className="w-[calc(100%+2px)] bg-surface-100 p-4 flex flex-col gap-2 -m-px border rounded-lg">
        <div className="pb-4 border-b">
          <div className="font-mono uppercase text-sm text-foreground tracking-wide">
            Main Stage
          </div>
          <ul className="flex flex-col gap-2 mt-4">
            {mainDays.map(
              (day, i: number) =>
                day.shipped && (
                  <ol key={day.id}>
                    <Link href={day.blog} className="block py-1 hover:text-foreground">
                      {i + 1} - {day.description}
                    </Link>
                  </ol>
                )
            )}
          </ul>
        </div>
        <div className="mt-4">
          <div className="font-mono uppercase text-sm text-foreground tracking-wide">
            Build Stage
          </div>
          <ul className="flex flex-col gap-2 mt-4">
            {buildDays.map(
              (day, i: number) =>
                day.is_shipped && (
                  <ol key={day.id}>
                    <Link
                      href={day.links[0].url}
                      className="relative flex items-center group w-full py-1 hover:text-foreground"
                    >
                      <span className="absolute block left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconArrowRight />
                      </span>{' '}
                      <span className="relative translate-x-0 transition-transform group-hover:translate-x-6">
                        {day.title}
                      </span>
                    </Link>
                  </ol>
                )
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LWXSummary
