import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { isOrganizationLandingPath } from './AppBannerWrapper.utils'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusBanner } from '@/components/layouts/AppLayout/StatusBanner'
import { BannerTermsOfServiceUpdate } from '@/components/ui/BannerStack/Banners/BannerTermsOfServiceUpdate'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const AppBannerWrapper = ({
  children,
  signedOut = false,
}: PropsWithChildren<{ signedOut?: boolean }>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  const { addBanner, dismissBanner } = useBannerStack()
  const pathname = usePathname()

  const [isTermsUpdateAcknowledged, , { isSuccess: isTermsDismissalLoaded }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  useEffect(() => {
    if (!isTermsDismissalLoaded || pathname == null) return

    if (IS_PLATFORM && isOrganizationLandingPath(pathname) && !isTermsUpdateAcknowledged) {
      addBanner({
        id: BANNER_ID.TERMS_OF_SERVICE_UPDATE,
        isDismissed: false,
        content: <BannerTermsOfServiceUpdate />,
        priority: 3,
      })
    } else {
      dismissBanner(BANNER_ID.TERMS_OF_SERVICE_UPDATE)
    }
  }, [pathname, isTermsDismissalLoaded, isTermsUpdateAcknowledged, addBanner, dismissBanner])

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <StatusBanner signedOut={signedOut} />
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
