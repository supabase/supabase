import { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import { useFlag, useLocalStorage } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const ongoingIncident = useFlag('ongoingIncident')

  const [navigationPreview] = useLocalStorage(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_NAVIGATION_LAYOUT,
    'false'
  )
  const useNewNavigationLayout = navLayoutV2 && navigationPreview === 'true'

  const appHeaderHeight = useNewNavigationLayout ? 49 : 0
  const incidentBannerHeight = 44

  return (
    <div>
      {useNewNavigationLayout && <AppHeader />}
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
