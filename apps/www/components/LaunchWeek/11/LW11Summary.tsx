import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { buildDays, mainDays } from './Releases/data'

const LW11Summary = () => {
  const days = mainDays()

  return (
    <div className="w-full border bg-alternative-200 flex flex-col rounded-lg text-foreground-lighter mt-12">
      <div className="w-full p-4 flex justify-between items-center">
        <Link
          href="/ga-week"
          className="flex items-center gap-1.5 leading-none uppercase text-xs opacity-80 transition-opacity hover:opacity-100"
        >
          <Image
            src="/images/launchweek/ga/ga-black.svg"
            alt="GA logo"
            className="dark:hidden w-5 aspect-[104/57] h-auto"
            priority
            width={30}
            height={30}
          />
          <Image
            src="/images/launchweek/ga/ga-white.svg"
            alt="GA logo"
            className="hidden dark:block w-5 aspect-[104/57] h-auto"
            priority
            width={30}
            height={30}
          />
          <span className="text-foreground tracking-[1px] font-mono">Week</span>
        </Link>
        <div className="font-mono uppercase tracking-wide text-xs">15-19 April</div>
      </div>
      <div className="pb-4 border-t p-4">
        <ul className="flex flex-col gap-2">
          {days.map(
            (day, i: number) =>
              day.shipped && (
                <ol key={day.id}>
                  <Link href={day.blog} className="group flex py-1 gap-2 hover:text-foreground">
                    <span className="shrink-0 text-sm font-mono uppercase leading-6">
                      Day {i + 1} -
                    </span>
                    <span className="leading-6">{day.title}</span>
                  </Link>
                </ol>
              )
          )}
        </ul>
      </div>
      <div className="w-[calc(100%+2px)] bg-surface-100 flex flex-col gap-2 -m-px border rounded-lg">
        <div className="p-4">
          <div className="font-mono uppercase text-xs text-foreground tracking-wide">
            Build Stage
          </div>
          <ul className="flex flex-col gap-2 mt-4">
            {buildDays.map(
              (day, i: number) =>
                day.is_shipped && (
                  <ol key={day.id}>
                    <Link
                      href={day.links[0].url}
                      className="relative flex items-center justify-between group w-full py-1 hover:text-foreground"
                    >
                      <span className="relative">
                        <span className="font-mono uppercase mr-2">
                          {i + 1 < 10 ? '0' : ''}
                          {i + 1} -
                        </span>
                        {day.title}
                      </span>
                    </Link>
                  </ol>
                )
            )}
            <ol className="border-t pt-4 mt-2">
              <Link
                href="/blog/supabase-oss-hackathon"
                className="relative flex items-center justify-between group w-full py-1 hover:text-foreground"
              >
                Open Source Hackathon 2024
              </Link>
            </ol>
            <ol>
              <Link
                href="/ga-week#meetups"
                className="relative flex items-center justify-between group w-full py-1 hover:text-foreground"
              >
                Community Meetups
              </Link>
            </ol>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LW11Summary
