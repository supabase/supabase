import { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import { useFlag } from 'hooks'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const ongoingIncident = useFlag('ongoingIncident')
  const appHeaderHeight = navLayoutV2 ? 49 : 0

  return (
    <div>
      {navLayoutV2 && <AppHeader />}
      <div
        style={{
          height: ongoingIncident
            ? `calc(100vh - 44px - ${appHeaderHeight}px)`
            : `calc(100vh - ${appHeaderHeight}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default AppLayout
