import React from 'react'
import { LW8_DATE } from '~/lib/constants'

interface Props {}

export default function TicketFooter({}: Props) {
  return (
    <div className="relative z-10 w-full flex flex-col md:flex-row gap-4 md:gap-8 mb-4 md:mb-6 text-foreground-light text-xs font-mono uppercase tracking-widest">
      <span>{LW8_DATE}</span>
      <span>supabase.com/launch-week</span>
    </div>
  )
}
