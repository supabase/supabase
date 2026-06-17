import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { PropsWithChildren, useEffect } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'
import { BannerTOSUpdate } from '@/components/ui/BannerStack/Banners/BannerTOSUpdate'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const TOSUpdateExpiry = new Date('2026-07-04T00:00:00Z')

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  const { addBanner, dismissBanner } = useBannerStack()

  const [TOSUpdateAcknowledged, , { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  useEffect(() => {
    if (Date.now() >= TOSUpdateExpiry.getTime()) return

    if (isSuccess && !TOSUpdateAcknowledged) {
      addBanner({
        id: 'tos-update-banner',
        isDismissed: false,
        content: <BannerTOSUpdate />,
        priority: 2,
      })
    } else {
      dismissBanner('tos-update-banner')
    }
  }, [TOSUpdateAcknowledged, isSuccess, addBanner, dismissBanner])

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <StatusPageBanner />
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
