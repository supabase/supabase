import React from 'react'
import Link from 'next/link'
import { buildDays, mainDays } from './data'
import { Lock } from 'lucide-react'

const LW14Summary = () => {
  const days = mainDays()

  return (
    <div
      style={{
        fontFamily:
          "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      }}
      className="w-full border bg-alternative flex flex-col rounded text-foreground-lighter mt-12 overflow-hidden"
    >
      <div className="w-full uppercase p-4 flex justify-between items-center">
        <Link
          href="/launch-week"
          className="flex items-center text-foreground font-medium gap-2.5 leading-none  text-xs opacity-80 transition-opacity hover:opacity-100"
        >
          Launch Week 15
        </Link>
        <div className=" tracking-wide text-xs">July 14 — 18</div>
      </div>
      <div className="pb-4 border-t p-4 font-mono">
        <ul className="flex flex-col gap-2">
          {days.map((day, i: number) =>
            day.shipped ? (
              <ol key={`main-shipped-${day.id}`}>
                <Link
                  href={day.blog}
                  className="group flex items-center py-1 gap-2 hover:text-foreground"
                >
                  <span className="shrink-0 text-sm  leading-6">Day {i + 1}</span>
                  <span>-</span>
                  <span className="leading-6">{day.title}</span>
                </Link>
              </ol>
            ) : (
              <ol key={`main-not-shipped-${day.id}`}>
                <Link
                  href={day.blog}
                  className="group flex items-center gap-2 py-1 text-foreground-muted pointer-events-none"
                >
                  <span className="shrink-0 text-sm leading-6">Day {i + 1}</span>
                  <span>-</span>
                  <Lock className="w-3 h-3" />
                </Link>
              </ol>
            )
          )}
        </ul>
      </div>
      <div className="w-[calc(100%+2px)] bg-alternative-200/20 flex flex-col gap-2 -m-px border font-mono">
        <div className="p-4">
          <div className="text-xs text-foreground tracking-wide">Build Stage</div>
          <ul className="flex flex-col gap-2 mt-4">
            {buildDays.map((day, i: number) =>
              day.is_shipped ? (
                <ol key={`build-shipped-${day.id}`}>
                  <Link
                    href={day.links[0].url}
                    className="relative flex items-center justify-between group w-full py-1 hover:text-foreground"
                  >
                    <span className="relative flex items-center gap-2">
                      <span className="">
                        {i + 1 < 10 ? '0' : ''}
                        {i + 1}
                      </span>
                      <span>-</span>
                      {day.title}
                    </span>
                  </Link>
                </ol>
              ) : (
                <ol key={`build-not-shipped-${day.id}`}>
                  <Link
                    href={day.links[0].url}
                    className="relative flex items-center justify-between group w-full py-1 text-foreground-muted pointer-events-none"
                  >
                    <span className="relative flex items-center gap-2">
                      <span className="">
                        {i + 1 < 10 ? '0' : ''}
                        {i + 1}
                      </span>
                      <span>-</span>
                      <Lock className="w-3 h-3" />
                    </span>
                  </Link>
                </ol>
              )
            )}
            <ol className="border-t pt-4 mt-2">
              <Link
                href="/events?category=meetup"
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

export default LW14Summary
