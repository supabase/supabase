import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { useProfile } from 'lib/profile'
import { Button } from 'ui'

// [Joshen] For this notice specifically, just FYI
// 1 month after 26th Jan we'll need to add some contextual information about this deprecation
// in the database settings pooling config section, for projects created before September 27th 2023

export const NoticeBanner = () => {
  const router = useRouter()
  const { isLoading: isLoadingProfile } = useProfile()

  const appBannerContext = useAppBannerContext()
  const {
    ipv6BannerAcknowledged,
    pgbouncerBannerAcknowledged,
    vercelBannerAcknowledged,
    onUpdateAcknowledged,
  } = appBannerContext

  const supabase = useSupabaseClient()
  const { ref: projectRef } = useParams()

  // [Alaister]: using inline queries here since this is temporary
  const { data, isLoading: isLoadingIpv6Enabled } = useQuery(
    ['projects', projectRef, 'pgbouncer-enabled'],
    async ({ signal }) => {
      let query = supabase.rpc('ipv6_active_status', { project_ref: projectRef }).returns<
        {
          pgbouncer_active: boolean
          vercel_active: boolean
        }[]
      >()

      if (signal) {
        query = query.abortSignal(signal)
      }

      const result = await query

      if (result.data === null) {
        return {
          pgbouncer_active: false,
          vercel_active: false,
        }
      }

      return result.data[0]
    },
    { enabled: Boolean(projectRef) }
  )

  const pgbouncerEnabled = data?.pgbouncer_active ?? false
  const vercelWithoutSupavisorEnabled = data?.vercel_active ?? false

  // [Joshen] Pgbouncer list and vercel list are mutually exclusive
  const pgbouncerProjectAcknowledged = pgbouncerBannerAcknowledged.includes(projectRef ?? '')
  const vercelProjectAcknowledged = vercelBannerAcknowledged.includes(projectRef ?? '')
  const allAcknowledged =
    (!pgbouncerEnabled && !vercelWithoutSupavisorEnabled && ipv6BannerAcknowledged) ||
    (ipv6BannerAcknowledged && pgbouncerEnabled && pgbouncerProjectAcknowledged) ||
    (ipv6BannerAcknowledged && vercelWithoutSupavisorEnabled && vercelProjectAcknowledged)

  if (
    isLoadingProfile ||
    isLoadingIpv6Enabled ||
    router.pathname.includes('sign-in') ||
    allAcknowledged
  ) {
    return null
  }

  const currentlyViewing =
    pgbouncerEnabled && !pgbouncerProjectAcknowledged
      ? ('pgbouncer' as const)
      : vercelWithoutSupavisorEnabled && !vercelProjectAcknowledged
        ? ('vercel' as const)
        : ('ipv6' as const)

  return (
    <div
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
      style={{ height: '44px' }}
    >
      <p className="text-sm">
        {currentlyViewing === 'pgbouncer' &&
          'Our logs on 26th Jan show that you have accessed PgBouncer. Please migrate now. You can ignore this warning if you have already migrated.'}
        {currentlyViewing === 'vercel' &&
          "To prepare for the IPv4 migration, please redeploy your Vercel application to detect the updated environment variables if it hasn't been deployed since 27th January."}
        {currentlyViewing === 'ipv6' &&
          'We are migrating our infrastructure from IPv4 to IPv6. Please migrate now. You can ignore this warning if you have already migrated.'}
      </p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<ExternalLink size={14} />}>
          <a
            href={
              currentlyViewing === 'vercel'
                ? 'https://supabase.com/partners/integrations/vercel'
                : 'https://github.com/orgs/supabase/discussions/17817'
            }
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
        <Button
          type="text"
          className="opacity-75"
          onClick={() =>
            onUpdateAcknowledged(
              currentlyViewing,
              currentlyViewing === 'ipv6' ? true : projectRef ?? ''
            )
          }
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
