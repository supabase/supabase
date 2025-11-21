import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'

import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { Button, WarningIcon } from 'ui'

// This file, like AppBannerWrapperContext.tsx, is meant to be dynamic - update this as and when we need to use the NoticeBanner
// We can disable this banner after 16th May 2025 as the middleware outage is complete

export const NoticeBanner = () => {
  const router = useRouter()

  const appBannerContext = useAppBannerContext()
  const { middlewareOutageBannerAcknowledged, onUpdateAcknowledged } = appBannerContext

  const acknowledged = middlewareOutageBannerAcknowledged

  if (router.pathname.includes('sign-in') || acknowledged) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-x-4 bg py-0.5 border transition text-foreground border-default">
      <WarningIcon className="w-4 h-4" />
      <p className="text-sm">
        Brief Dashboard outage: May 16, 2025, 22:00–23:00 UTC (no impact to your apps)
      </p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<ExternalLink size={14} />}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://status.supabase.com/incidents/8k0ysqkhscfj"
          >
            Learn more
          </a>
        </Button>
        <Button
          type="text"
          className="opacity-75"
          onClick={() => {
            onUpdateAcknowledged('middleware-outage-banner-2025-05-16')
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
