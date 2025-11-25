import Link from 'next/link'
import { useRouter } from 'next/router'

import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { Button, WarningIcon, cn } from 'ui'

// This file, like AppBannerWrapperContext.tsx, is meant to be dynamic - update this as and when we need to use the NoticeBanner
// We can disable this banner after 23rd November 2025 as the maintenance window is complete

export const NoticeBanner = () => {
  const router = useRouter()

  const appBannerContext = useAppBannerContext()
  const { maintenanceWindowBannerAcknowledged, onUpdateAcknowledged } = appBannerContext

  const acknowledged = maintenanceWindowBannerAcknowledged

  if (router.pathname.includes('sign-in') || acknowledged) {
    return null
  }

  return (
    <div
      className={cn(
        'relative bg-warning-300 dark:bg-warning-200 border-b border-muted py-1 flex items-center justify-center flex-shrink-0 px-0'
      )}
    >
      <div className="absolute inset-y-0 left-0 right-0 overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-[0.8%]"
          style={{
            background: `repeating-linear-gradient(
                  45deg,
                  currentColor,
                  currentColor 10px,
                  transparent 10px,
                  transparent 20px
                )`,
            maskImage: 'linear-gradient(to top, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          }}
        />
      </div>
      <div className="items-center flex flex-row gap-3 z-[1]">
        <WarningIcon className="z-[1] flex-shrink-0" />
        <div className="flex-1 text-xs sm:text-sm z-[1] text-warning">
          Urgent Dashboard and Management API maintenance between 23:00 UTC on Nov 21, 2025 and
          23:00 UTC on Nov 23, 2025. For full details,{' '}
          <Link
            href="https://status.supabase.com/incidents/z0l2157y33xk"
            target="_blank"
            rel="noreferrer"
            className="opacity-75 hover:opacity-100 underline"
          >
            check here
          </Link>
          .
        </div>
        <Button
          type="text"
          className="opacity-75 z-[1] flex-shrink-0"
          onClick={() => {
            onUpdateAcknowledged('maintenance-window-banner-2025-11-21')
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
