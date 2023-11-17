import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import { TicketBrickWallSlider } from './TicketBrickWallSlider'

type user = UserData

interface Props {
  users: user[]
}

export default function TicketBrickWall({ users }: Props) {
  const isMobile = useBreakpoint(768)

  return (
    <div className="relative pb-16 pt-16 md:pt-28">
      <div className="mx-auto">
        <div className="max-w-[38rem] mb-8 mx-auto">
          <h2 className="text-center radial-gradient-text-500">Tickets from the community</h2>
        </div>
        <div
          className="grid py-4 relative
            before:content-[' '] before:absolute before:inset-0 before:right-auto before:w-1/4 before:bg-gradient-to-r before:from-[#020405] before:to-[#02040500] before:z-10 before:pointer-events-none
            after:content-[' '] after:absolute after:inset-0 after:left-auto after:w-1/4 after:bg-gradient-to-l after:from-[#020405] after:to-[#02040500] after:z-10 after:pointer-events-none
          "
        >
          <TicketBrickWallSlider users={users.slice(0, isMobile ? 5 : 7)} />
          <TicketBrickWallSlider
            users={users.slice(isMobile ? 5 : 7, isMobile ? 11 : 14)}
            reverse
          />
          {isMobile && <TicketBrickWallSlider users={users.slice(11, 17)} speed={6000} />}
        </div>
        <div className="flex justify-center w-full mx-auto mt-2 lg:mt-4">
          <Button
            asChild
            type="outline"
            size="medium"
            onClick={() => window.scrollTo(0, 0)}
            className="text-white"
          >
            <Link href="/launch-week/8/tickets">View all tickets</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
