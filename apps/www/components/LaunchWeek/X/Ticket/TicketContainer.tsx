import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import cn from 'classnames'
import { Button, Loading } from 'ui'

import styles from './ticket.module.css'
import styleUtils from '../../utils.module.css'
import Ticket from './Ticket'
import TicketActions from '~/components/LaunchWeek/8/Ticket/TicketActions'
import TicketCopy from '~/components/LaunchWeek/8/Ticket/ticket-copy'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import useWinningChances from '~/components/LaunchWeek/hooks/useWinningChances'
import { SITE_URL } from '~/lib/constants'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketDisclaimer from './TicketDisclaimer'

type TicketGenerationState = 'default' | 'loading'

type Props = {
  user: UserData
  supabase: SupabaseClient | null
  sharePage?: boolean
}

export default function TicketContainer({ user, sharePage, supabase }: Props) {
  const { username, name, golden } = user
  const isMobile = useBreakpoint(1023)
  const [ticketGenerationState, setTicketGenerationState] =
    useState<TicketGenerationState>('default')
  const winningChances = useWinningChances()

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
