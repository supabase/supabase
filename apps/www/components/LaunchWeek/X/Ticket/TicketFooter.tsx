import React from 'react'
import { LWX_DATE } from '~/lib/constants'
import TicketNumber from './TicketNumber'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

export default function TicketFooter() {
  const { userData: user } = useConfData()

  return (
    <div className="relative z-10 w-full flex flex-col gap-3 font-mono text-foreground leading-none uppercase tracking-[3px]">
      <TicketNumber number={user.ticketNumber} />
      <span className="text-foreground">Launch Week X</span>
      <span>{LWX_DATE}</span>
    </div>
  )
}
