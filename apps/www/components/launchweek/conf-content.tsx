import { useState } from 'react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { PageState, ConfDataContext, UserData } from '~/lib/launchweek/hooks/use-conf-data'
import Hero from '~/components/launchweek/hero'
import Form from '~/components/launchweek/form'
import Ticket from './ticket/ticket'

type Props = {
  defaultUserData: UserData
  sharePage?: boolean
  defaultPageState?: PageState
}

export default function ConfContent({
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
      <DefaultLayout>
        <SectionContainer className="space-y-12">
          <div>
            {pageState === 'registration' && !sharePage ? (
              <>
                <Hero />
                <Form />
              </>
            ) : (
              <Ticket
                username={userData.username}
                name={userData.name}
                ticketNumber={userData.ticketNumber}
                sharePage={sharePage}
              />
            )}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </ConfDataContext.Provider>
  )
}
