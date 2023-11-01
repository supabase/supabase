import React from 'react'
import { LW7_DATE } from '~/lib/constants'

interface Props {
  size?: 'default' | 'small'
}
export default function TicketHeader({ size }: Props) {
  return (
    <div className="flex w-full justify-center pt-4 md:pt-6" id="wayfinding--ticket-header">
      <div className="flex flex-col md:flex-row gap-1 justify-center items-center md:gap-5">
        <img
          className={size === 'small' ? 'w-[165px]' : 'w-[220px] md:w-[230px]'}
          src={`/images/launchweek/ticket-header-logo.png`}
        />
        <span className="text-white text-xs md:text-sm">{LW7_DATE}</span>
      </div>
    </div>
  )
}
