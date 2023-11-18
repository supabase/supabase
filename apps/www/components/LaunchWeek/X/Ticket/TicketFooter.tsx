import React from 'react'
import { LWX_DATE } from '~/lib/constants'
import TicketNumber from './TicketNumber'
import { UserData } from '../../hooks/use-conf-data'

interface Props {
  user: UserData
}

export default function TicketFooter({ user }: Props) {
  return (
    <div className="relative z-10 w-full flex flex-col md:flex-row justify-between gap-4 md:gap-8 text-foreground-lighter text-xs font-mono uppercase tracking-widest">
      <span>Launch Week X</span>
      <span>
        <TicketNumber number={user.ticketNumber} />
      </span>
      <span>{LWX_DATE}</span>
    </div>
  )
}
