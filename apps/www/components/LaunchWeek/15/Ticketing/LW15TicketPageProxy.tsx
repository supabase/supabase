import { useEffect } from 'react'
import { useRouter } from 'next/compat/router'

import useLw15ConfData from 'components/LaunchWeek/15/hooks/use-conf-data'
import { useRegistration } from 'components/LaunchWeek/15/hooks/use-registration'
import LW15TicketPage from './LW15TicketPage'

const LW15TicketRedirect = () => {
  useRegistration()
  const [confState] = useLw15ConfData()
  const user = confState.userTicketData
  const router = useRouter()

  useEffect(() => {
    if (confState.sessionLoaded && confState.session === null) {
      router?.replace('/launch-week')
    }
  }, [confState.sessionLoaded, confState.session, router, user.username])

  if (!confState.sessionLoaded)
    return (
      <div className="h-full min-h-[calc(100dvh-66px)] w-full flex items-center justify-center opacity-0 animate-fade-in">
        Loading...
      </div>
    )

  if (!user.id)
    return (
      <div className="h-full min-h-[calc(100dvh-66px)] w-full flex items-center justify-center opacity-0 animate-fade-in">
        Loading...
      </div>
    )

  return <LW15TicketPage />
}

export default LW15TicketRedirect
