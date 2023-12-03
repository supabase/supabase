import { useState } from 'react'
import { TicketState, ConfDataContext, UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import Ticket from './ActualTicket'
import Form from './form'
import { SupabaseClient, Session } from '@supabase/supabase-js'

type Props = {
  supabase: SupabaseClient
  session: Session | null
  defaultUserData: UserData
  sharePage?: boolean
  defaultTicketState?: TicketState
}

export default function Conf({
  supabase,
  session,
  defaultUserData,
  sharePage,
  defaultTicketState = 'registration',
}: Props) {
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [ticketState, setTicketState] = useState<TicketState>(defaultTicketState)

  return (
    <ConfDataContext.Provider
      value={{
        supabase,
        session,
        userData,
        setUserData,
        ticketState,
        setTicketState,
      }}
    >
      {ticketState === 'registration' && !sharePage ? (
        <Form align={defaultTicketState === 'registration' ? 'Center' : 'Left'} />
      ) : (
        <Ticket
          username={userData.username}
          name={userData.name}
          ticketNumber={userData.ticketNumber}
          sharePage={sharePage}
          golden={userData.golden}
          bgImageId={userData.bg_image_id}
          referrals={userData.referrals ?? 0}
        />
      )}
    </ConfDataContext.Provider>
  )
}
