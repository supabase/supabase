import { useState } from 'react'
import { PageState, ConfDataContext, UserData } from './hooks/use-conf-data'
import Ticket from './ticket'
import ConfContainer from './conf-container'
import Form from './form'
import { SupabaseClient, Session } from '@supabase/supabase-js'

type Props = {
  supabase: SupabaseClient
  session: Session | null
  defaultUserData: UserData
  sharePage?: boolean
  defaultPageState?: PageState
}

export default function Conf({
  supabase,
  session,
  defaultUserData,
  sharePage,
  defaultPageState = 'registration',
}: Props) {
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [pageState, setPageState] = useState<PageState>(defaultPageState)

  return (
    <ConfDataContext.Provider
      value={{
        supabase,
        session,
        userData,
        setUserData,
        setPageState,
      }}
    >
      {pageState === 'registration' && !sharePage ? (
        <Form align={defaultPageState === 'registration' ? 'Center' : 'Left'} />
      ) : (
        <Ticket
          username={userData.username}
          name={userData.name}
          ticketNumber={userData.ticketNumber}
          sharePage={sharePage}
          golden={userData.golden}
        />
      )}
    </ConfDataContext.Provider>
  )
}
