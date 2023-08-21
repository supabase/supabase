import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { useFlag } from 'hooks'
import { PropsWithChildren } from 'react'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const ongoingIncident = useFlag('ongoingIncident')
  return (
    <div className="min-h-full flex flex-col">
      {ongoingIncident && <IncidentBanner />}

      {children}
    </div>
  )
}

export default AppBannerWrapper
