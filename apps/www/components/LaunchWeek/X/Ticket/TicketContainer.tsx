import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import Ticket from './Ticket'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'

type TicketGenerationState = 'default' | 'loading'

type Props = {
  user: UserData
  supabase: SupabaseClient | null
}

export default function TicketContainer({ user, supabase }: Props) {
  const [ticketGenerationState, setTicketGenerationState] =
    useState<TicketGenerationState>('default')

  console.log('TicketContainer user', user)

  if (!supabase)
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4">
        loading
      </div>
    )

  return (
    <div className="flex w-full justify-center mx-auto max-w-2xl">
      <Ticket
        user={user}
        ticketGenerationState={ticketGenerationState}
        setTicketGenerationState={setTicketGenerationState}
      />
    </div>
  )
}
