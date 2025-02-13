import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'

import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { useProfile } from 'lib/profile'
import { Button } from 'ui'

// This file, like AppBannerWrapperContext.tsx, is meant to be dynamic - update this as and when we need to use the NoticeBanner

// [Alaister] As of 11th February 2025, this notice is around Fly's Postgres offering
// https://github.com/orgs/supabase/discussions/33413
// Timelines TLDR:
// - Before March 14 2025: Users will still be able to access your existing Fly Postgres projects.
// - On March 14 2025: Your Fly Postgres projects are removed from our platform
// We can disable this banner after 14th March 2025 as the Fly Postgres offering is no longer available

export const NoticeBanner = () => {
  const router = useRouter()
  const { isLoading: isLoadingProfile, profile } = useProfile()

  const appBannerContext = useAppBannerContext()
  const { flyPostgresBannerAcknowledged, onUpdateAcknowledged } = appBannerContext

  const isFlyUser = Boolean(profile?.primary_email?.endsWith('customer.fly.io'))
  const acknowledged = flyPostgresBannerAcknowledged

  if (isLoadingProfile || !isFlyUser || router.pathname.includes('sign-in') || acknowledged) {
    return null
  }

  return (
    <div
      style={{ height: '44px' }}
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
    >
      <p className="text-sm">
        Supabase is deprecating Fly's Postgres offering managed by Supabase on March 14, 2025
      </p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<ExternalLink size={14} />}>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/orgs/supabase/discussions/33413"
          >
            Learn more
          </a>
        </Button>
        <Button
          type="text"
          className="opacity-75"
          onClick={() => {
            onUpdateAcknowledged('fly-postgres')
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
