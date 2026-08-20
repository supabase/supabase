import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { isLogsOrObservabilityPath } from './AppBannerWrapper.utils'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'
import { BannerLogsAllDeprecation } from '@/components/ui/BannerStack/Banners/BannerLogsAllDeprecation'
import { BannerTOSUpdate } from '@/components/ui/BannerStack/Banners/BannerTOSUpdate'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

const TOSUpdateExpiry = new Date('2026-08-29T00:00:00Z')

// Update this whenever the banner content changes so old client bundles stop
// displaying the notice after the removal date passes.
const LogsAllDeprecationExpiry = new Date('2026-09-24T00:00:00Z')

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  const { addBanner, dismissBanner } = useBannerStack()
  const pathname = usePathname()
  const track = useTrack()

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
        priority: 0,
      })
    } else {
      dismissBanner('tos-update-banner')
    }
  }, [TOSUpdateAcknowledged, isSuccess, addBanner, dismissBanner])

  const [isLogsAllDeprecationDismissed, , { isSuccess: isLogsAllDeprecationLoaded }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.LOGS_ALL_DEPRECATION_2026_09_23, false)

  const hasTrackedLogsAllExposure = useRef(false)
  useEffect(() => {
    if (!isLogsAllDeprecationLoaded || pathname == null) return

    const shouldShow =
      IS_PLATFORM &&
      Date.now() < LogsAllDeprecationExpiry.getTime() &&
      isLogsOrObservabilityPath(pathname) &&
      !isLogsAllDeprecationDismissed

    if (!shouldShow) {
      dismissBanner(BANNER_ID.LOGS_ALL_DEPRECATION)
      return
    }

    addBanner({
      id: BANNER_ID.LOGS_ALL_DEPRECATION,
      isDismissed: false,
      content: <BannerLogsAllDeprecation />,
      priority: 4,
    })

    if (!hasTrackedLogsAllExposure.current) {
      hasTrackedLogsAllExposure.current = true
      track('logs_all_deprecation_banner_exposed')
    }
  }, [
    pathname,
    isLogsAllDeprecationLoaded,
    isLogsAllDeprecationDismissed,
    addBanner,
    dismissBanner,
    track,
  ])

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
