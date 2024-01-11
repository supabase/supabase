import { PropsWithChildren } from 'react'

import { useIsNoticeBannerShown } from 'components/interfaces/App/AppBannerWrapperContext'
import { useFlag } from 'hooks'
import AppHeader from './AppHeader'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')

  const noticeAcknowledged = useIsNoticeBannerShown()

  const appHeaderHeight = navLayoutV2 ? 49 : 0
  const bannerHeight =
    [ongoingIncident, showNoticeBanner && !noticeAcknowledged].filter(Boolean).length * 44
  const maxHeight = `calc(100vh - ${bannerHeight}px - ${appHeaderHeight}px)`

  return (
    <div>
      {navLayoutV2 && <AppHeader />}
      <div style={{ maxHeight, height: maxHeight }}>{children}</div>
    </div>
  )
}

export default AppLayout
