import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import dayjs from 'dayjs'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import {
  SELECT_26_STUDIO_DISMISSAL_KEY,
  useSelect26PromotionActive,
} from 'ui-patterns/Banners/Select26Promotion'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { isLogsOrObservabilityPath } from './AppBannerWrapper.utils'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'
import { BannerLogsAllDeprecation } from '@/components/ui/BannerStack/Banners/BannerLogsAllDeprecation'
import { BannerSelect2026 } from '@/components/ui/BannerStack/Banners/BannerSelect2026'
import {
  SELECT_26_BANNER_PRIORITY,
  shouldShowSelect26Banner,
} from '@/components/ui/BannerStack/Banners/BannerSelect2026.utils'
import { BannerTOSUpdate } from '@/components/ui/BannerStack/Banners/BannerTOSUpdate'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

const TOSUpdateExpiry = new Date('2026-08-29T00:00:00Z')

// Update this whenever the banner content changes so old client bundles stop
// displaying the notice after the removal date passes.
const LogsAllDeprecationExpiry = dayjs('2026-09-24T00:00:00Z')

// setTimeout overflows above ~24.8 days; re-arm until the real expiry.
const MAX_TIMEOUT_MS = 2_147_483_647

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

  const [isSelect26BannerDismissed, , { isSuccess: isSelect26DismissalLoaded }] =
    useLocalStorageQuery(SELECT_26_STUDIO_DISMISSAL_KEY, false)
  const isSelect26PromotionActive = useSelect26PromotionActive()

  useEffect(() => {
    if (!isSelect26DismissalLoaded) return

    const shouldShow = shouldShowSelect26Banner({
      isPlatform: IS_PLATFORM,
      dismissalLoaded: isSelect26DismissalLoaded,
      isActive: isSelect26PromotionActive,
      isDismissed: isSelect26BannerDismissed,
    })

    if (shouldShow) {
      addBanner({
        id: BANNER_ID.SELECT_26,
        isDismissed: false,
        content: <BannerSelect2026 />,
        priority: SELECT_26_BANNER_PRIORITY,
      })
    } else {
      dismissBanner(BANNER_ID.SELECT_26)
    }
  }, [
    isSelect26DismissalLoaded,
    isSelect26PromotionActive,
    isSelect26BannerDismissed,
    addBanner,
    dismissBanner,
  ])

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
        <StatusPageBanner />
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
