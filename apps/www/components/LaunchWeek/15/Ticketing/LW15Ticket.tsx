import React, { useEffect, useRef } from 'react'
import { cn } from 'ui'
import useLw15ConfData, { UserTicketData } from '../hooks/use-conf-data'
import { FifteenSVG, LWSVG } from '../lw15.components'
import Image from 'next/image'
import { TYPO_COLORS, BG_COLORS } from './colors'
import useTicketBg from '../hooks/use-ticket-bg'
import VanillaTilt from 'vanilla-tilt'
import useUserPresence from '../hooks/useUserPresence'

const LW15Ticket = ({
  user: userFromProps,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { user?: UserTicketData }) => {
  useUserPresence()
  const [state] = useLw15ConfData()

  const user = userFromProps || state.userTicketData
  const fg = user?.metadata?.colors?.foreground || TYPO_COLORS[0]
  const bg = user?.metadata?.colors?.background || BG_COLORS[0]

  const ticketBg = useTicketBg(user?.ticket_number!)

  const tilt = useRef(null)

  const options = {
    scale: 1,
    speed: 1000,
    max: 10,
    glare: true,
    'max-glare': 0.2,
    'glare-prerender': false,
  }

  useEffect(() => {
    if (!tilt.current) return
    VanillaTilt.init(tilt.current, options)
  }, [options])

  return (
    <div
      ref={tilt}
      className={cn(
        'min-h-[400px] transition-colors border duration-300 [&_*]:transition-colors [&_*]:duration-300 max-h-[500px] h-[70%] w-auto aspect-[278/443] flex flex-col shadow-2xl rounded-md overflow-hidden',
        className
      )}
      style={{ background: bg, color: fg }}
      {...props}
    >
      <div className="relative w-full h-1/2">
        <div className="absolute w-full h-full inset-0 bg-cover">
          <Image
            alt=""
            src={ticketBg}
            blurDataURL="/images/launchweek/15/lw15-galaxy.png"
            placeholder="blur"
            quality={100}
            width={600}
            height={600}
            className="absolute w-full h-full inset-0 bg-cover mix-blend-screen"
          />
          <div
            className="absolute w-full h-full inset-0 mix-blend-color"
            style={{ background: bg }}
          />
        </div>
        <div
          className="relative z-10 flex flex-col p-4 gap-4 w-full h-full"
          style={{ backgroundColor: `${bg}30` }}
        >
          <div className="absolute top-5 border bg-background dark:bg-black mx-auto inset-x-0 h-[15px] w-[50px] rounded-lg z-30 overflow-hidden">
            <span className="absolute inset-0 w-full h-full" style={{ background: `${fg}07` }} />
          </div>
          <div className="w-full h-[50px] flex items-center justify-between">
            <LWSVG className="h-full w-auto" />
            <FifteenSVG className="h-full w-auto" />
          </div>
        </div>
      </div>
      <div className="relative flex flex-col p-4 w-full flex-1 justify-between">
        <div className="flex flex-col gap-4 w-full">
          <div className="text-2xl lg:text-3xl">@{user?.username}</div>
          <div className="w-full grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <p>Company</p>
              {/* <p>Location</p> */}
            </div>
            <div className="col-span-2 flex flex-col">
              <p>{user?.metadata?.company || '—'}</p>
              {/* <p>{user?.metadata?.location || '—'}</p> */}
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
                US West Coast. 8AM
              </p>
            </div>
          </div>
          <div className="w-full grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <p>Meetups</p>
            </div>
            <div className="col-span-2 flex flex-col">
              <p>Supabase Meetups happening in +80 cities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LW15Ticket
