import React from 'react'
import { DATE } from '~/lib/constants'

interface Props {
  size?: 'default' | 'small'
}
export default function TicketHeader({ size }: Props) {
  return (
    <div className="flex w-full justify-center pt-4" id="wayfinding--ticket-header">
      <div className="flex items-center gap-6">
        <img
          className={size === 'small' ? 'w-[165px]' : 'w-[224px]'}
          src={`/images/launchweek/ticket-header-logo.png`}
        />
        <span className="text-white text-[10px]">{DATE}</span>
        {/*<div id="wayfinding--TicketInfo-container">
               <TicketInfoFooter
                golden={golden}
                logoTextSecondaryColor={
                  ticketNumber ? (golden ? '#F2C94C' : 'var(--brand)') : undefined
                }
              />
            </div>*/}
      </div>
    </div>
  )
}
