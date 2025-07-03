import React from 'react'
import { cn } from 'ui'
import useLw15ConfData from '../hooks/use-conf-data'
import { FifteenSVG, LWSVG } from '../lw15.components'
import Image from 'next/image'
import { TYPO_COLORS, BG_COLORS } from './colors'

const LW15Ticket = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const [state] = useLw15ConfData()
  const user = state.userTicketData
  const fg = user?.metadata?.colors?.foreground || TYPO_COLORS[0]
  const bg = user?.metadata?.colors?.background || BG_COLORS[0]

  return (
    <div
      className={cn(
        'min-h-[443px] transition-colors duration-300 max-h-[550px] h-full w-auto aspect-[278/443] flex flex-col shadow-xl rounded-md overflow-hidden',
        className
      )}
      style={{ background: bg, color: fg }}
      {...props}
    >
      <div className="relative w-full h-1/2">
        <div className="absolute w-full h-full inset-0 bg-cover">
          <Image
            alt=""
            src="/images/launchweek/15/ticket-bg.png"
            width={600}
            height={600}
            className="absolute w-full h-full inset-0 bg-cover mix-blend-screen"
          />
          <div
            className="absolute w-full h-full inset-0 mix-blend-color"
            style={{ background: bg }}
          />
        </div>
        <div className="relative z-10 flex flex-col p-4 gap-4 w-full h-full bg-background/30">
          <div>Launch Week</div>
          <div className="w-full h-[50px] flex items-center justify-between">
            <LWSVG className="h-full w-auto" />
            <FifteenSVG className="h-full w-auto" />
          </div>
        </div>
      </div>
      <div className="relative flex flex-col p-4 w-full flex-1 justify-between">
        <div className="flex flex-col gap-4 w-full">
          <div className="text-2xl lg:text-3xl">@{user.username}</div>
          <div className="w-full grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <p>Occupation</p>
              <p>Location</p>
            </div>
            <div className="col-span-2 flex flex-col">
              <p>Engineer</p>
              <p>Singapore</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full grid grid-cols-3 gap-4 text-sm mt-8">
            <div className="flex flex-col">
              <p>Date</p>
            </div>
            <div className="col-span-2 flex flex-col">
              <p>
                Monday / 14th July <br />
                Time begins. US West Coast. 8AM{' '}
              </p>
            </div>
          </div>
          <div className="w-full grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <p>Meetups</p>
            </div>
            <div className="col-span-2 flex flex-col">
              <p>Supabase Meetups happening in +60 countries.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LW15Ticket
