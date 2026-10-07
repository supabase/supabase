import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import dayjs from 'dayjs'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { isLogsOrObservabilityPath, isOrganizationLandingPath } from './AppBannerWrapper.utils'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusBanner } from '@/components/layouts/AppLayout/StatusBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'
import { BannerLogsAllDeprecation } from '@/components/ui/BannerStack/Banners/BannerLogsAllDeprecation'
import { BannerTermsOfServiceUpdate } from '@/components/ui/BannerStack/Banners/BannerTermsOfServiceUpdate'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

// Update this whenever the banner content changes so old client bundles stop
// displaying the notice after the removal date passes.
const LogsAllDeprecationExpiry = dayjs('2026-09-24T00:00:00Z')

// setTimeout overflows above ~24.8 days; re-arm until the real expiry.
const MAX_TIMEOUT_MS = 2_147_483_647

export const AppBannerWrapper = ({
  children,
  signedOut = false,
}: PropsWithChildren<{ signedOut?: boolean }>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')
  const useStatusPageWidget = useFlag('incidentIoStatusPage')

  const { addBanner, dismissBanner } = useBannerStack()
  const pathname = usePathname()
  const track = useTrack()

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

  const [isLogsAllDeprecationDismissed, , { isSuccess: isLogsAllDeprecationLoaded }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.LOGS_ALL_DEPRECATION_2026_09_23, false)

  const [isLogsAllDeprecationExpired, setIsLogsAllDeprecationExpired] = useState(
    () => !dayjs().isBefore(LogsAllDeprecationExpiry)
  )

  useEffect(() => {
    if (isLogsAllDeprecationExpired) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const armExpiryTimer = () => {
      const msUntilExpiry = LogsAllDeprecationExpiry.diff(dayjs())
      if (msUntilExpiry <= 0) {
        setIsLogsAllDeprecationExpired(true)
        return
      }
      timeoutId = setTimeout(armExpiryTimer, Math.min(msUntilExpiry, MAX_TIMEOUT_MS))
    }

    armExpiryTimer()
    return () => clearTimeout(timeoutId)
  }, [isLogsAllDeprecationExpired])

  const hasTrackedLogsAllExposure = useRef(false)
  useEffect(() => {
    if (!isLogsAllDeprecationLoaded || pathname == null) return

    const shouldShow =
      IS_PLATFORM &&
      !isLogsAllDeprecationExpired &&
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
    isLogsAllDeprecationExpired,
    addBanner,
    dismissBanner,
    track,
  ])

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        {useStatusPageWidget ? <StatusBanner signedOut={signedOut} /> : <StatusPageBanner />}
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
