import { useState } from 'react'
import {
  PageState,
  ConfDataContext,
  UserData,
} from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import Ticket from './ticket'
import ConfContainer from './conf-container'
import Form from './form'

type Props = {
  defaultUserData: UserData
  sharePage?: boolean
  defaultPageState?: PageState
}

export default function Conf({
  defaultUserData,
  sharePage,
  defaultPageState = 'registration',
}: Props) {
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [pageState, setPageState] = useState<PageState>(defaultPageState)

  return (
    <ConfDataContext.Provider
      value={{
        userData,
        setUserData,
        setPageState,
      }}
    >
      <ConfContainer>
        {pageState === 'registration' && !sharePage ? (
          <>
            {/* <Hero /> */}
            <Form />
            {/* <LearnMore /> */}
          </>
        ) : (
          <Ticket
            username={userData.username}
            name={userData.name}
            ticketNumber={userData.ticketNumber}
            sharePage={sharePage}
            golden={userData.golden}
          />
        )}
      </ConfContainer>
    </ConfDataContext.Provider>
  )
}
