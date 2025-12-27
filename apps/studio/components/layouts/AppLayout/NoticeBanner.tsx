import Link from 'next/link'
import { useRouter } from 'next/router'

import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'

// Used to display urgent maintenance windows
// This file, like AppBannerWrapperContext.tsx, is meant to be dynamic - update this as and when we need to use the NoticeBanner

export const NoticeBanner = () => {
  const router = useRouter()
  const { maintenanceWindowBannerAcknowledged, onUpdateAcknowledged } = useAppBannerContext()

  if (router.pathname.includes('sign-in') || maintenanceWindowBannerAcknowledged) {
    return null
  }

  return (
    <HeaderBanner
      variant="warning"
      title="Urgent dashboard and management API maintenance"
      description={
        <>
          23:00 UTC Nov 21–23, 2025.{' '}
          <Link
            href="https://status.supabase.com/incidents/z0l2157y33xk"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </Link>
        </>
      }
      onDismiss={() => onUpdateAcknowledged('maintenance-window-banner-2025-11-21')}
    />
  )
}
