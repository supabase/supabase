import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'
import { TimestampInfo } from 'ui-patterns'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

/**
 * Used to display urgent notices that apply for all users, such as maintenance windows.
 */
export const NoticeBanner = () => {
  const router = useRouter()

  const [bannerAcknowledged, setBannerAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.MAINTENANCE_WINDOW_BANNER,
    false
  )

  if (router.pathname.includes('sign-in') || !isSuccess || bannerAcknowledged) {
    return null
  }

  return (
    <HeaderBanner
      variant="warning"
      title="Upcoming Dashboard and Management API maintenance"
      description={
        <>
          <TimestampInfo
            className="text-sm"
            utcTimestamp={1768530600000}
            label="02:30 UTC on Jan 16, 2026"
          />
          .{' '}
          <InlineLink href="https://status.supabase.com/incidents/lg4j8mcn50zb">
            Learn more
          </InlineLink>
        </>
      }
      onDismiss={() => setBannerAcknowledged(true)}
    />
  )
}
