import { useRouter } from 'next/router'

import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'
import { TimestampInfo } from 'ui-patterns'

/**
 * Used to display urgent notices that apply for all users, such as maintenance windows.
 * This file, like AppBannerWrapperContext.tsx, is meant to be dynamic.
 * Update this as and when we need to use the NoticeBanner.
 */
export const NoticeBanner = () => {
  const router = useRouter()
  const { maintenanceWindowBannerAcknowledged, onUpdateAcknowledged } = useAppBannerContext()

  if (router.pathname.includes('sign-in') || maintenanceWindowBannerAcknowledged) {
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
      onDismiss={() => onUpdateAcknowledged('maintenance-window-banner-2026-01-16')}
    />
  )
}
