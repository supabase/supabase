import { PropsWithChildren } from 'react'

import { useFlag } from 'hooks'
import AppHeader from './AppHeader'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const appHeaderHeight = 49
  const incidentBannerHeight = 44

  return (
    <div>
      <AppHeader />
      <div
        style={{
          height: ongoingIncident
            ? `calc(100vh - ${incidentBannerHeight}px - ${appHeaderHeight}px)`
            : `calc(100vh - ${appHeaderHeight}px)`,
          maxHeight: ongoingIncident
            ? `calc(100vh - ${incidentBannerHeight}px - ${appHeaderHeight}px)`
            : `calc(100vh - ${appHeaderHeight}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default AppLayout
