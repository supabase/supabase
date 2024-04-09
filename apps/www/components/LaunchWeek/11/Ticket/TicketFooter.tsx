import React from 'react'
import TicketNumber from './TicketNumber'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { cn } from 'ui'

export default function TicketFooter() {
  const { userData: user } = useConfData()
  const { ticketNumber, golden, metadata } = user
  const hasLightTicket = golden || metadata?.hasSecretTicket

  const SupabaseLogo = hasLightTicket
    ? '/images/launchweek/lwx/logos/supabase_lwx_logo_light.png'
    : '/images/launchweek/lwx/logos/supabase_lwx_logo_dark.png'

  return (
    <div
      className={cn(
        'relative z-10 w-full flex flex-col gap-2 font-mono text-foreground leading-none uppercase tracking-[3px]',
        hasLightTicket ? 'text-[#11181C]' : 'text-white'
      )}
    >
      {/* <Image
        src={SupabaseLogo}
        alt="Supabase Logo for Launch Week X"
        width="30"
        height="30"
        className="mb-1 hidden md:block"
        priority
        quality={100}
      /> */}
      <TicketNumber number={ticketNumber} />
      {/* <span>Launch Week X</span>
      <span>{LWX_DATE}</span> */}
    </div>
  )
}
