import React from 'react'
import { LWX_DATE } from '~/lib/constants'

interface Props {}

export default function TicketFooter({}: Props) {
  return (
    <div className="relative z-10 w-full flex flex-col md:flex-row justify-between gap-4 md:gap-8 text-foreground-lighter text-xs font-mono uppercase tracking-widest">
      <span>Launch Week X</span>
      <span>{LWX_DATE}</span>
    </div>
  )
}
