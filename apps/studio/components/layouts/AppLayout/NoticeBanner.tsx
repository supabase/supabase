import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useAppBannerContext } from 'components/interfaces/App/AppBannerWrapperContext'
import { useProfile } from 'lib/profile'
import { Button, IconExternalLink } from 'ui'

// [Joshen] For this notice specifically, just FYI
// 1 month after 26th Jan we'll need to add some contextual information about this deprecation
// in the database settings pooling config section, for projects created before September 27th 2023

export const NoticeBanner = () => {
  const router = useRouter()
  const { isLoading: isLoadingProfile } = useProfile()

  const appBannerContext = useAppBannerContext()
  const { acknowledged, onUpdateAcknowledged } = appBannerContext

  const supabase = useSupabaseClient()
  const { ref: projectRef } = useParams()

  // [Alaister]: using inline queries here since this is temporary
  const { data: pgbouncerEnabled, isLoading: isLoadingPgbouncerEnabled } = useQuery(
    ['projects', projectRef, 'pgbouncer-enabled'],
    async ({ signal }) => {
      let query = supabase
        .from('active_pgbouncer_projects')
        .select('*')
        .eq('project_ref', projectRef)
        .limit(1)

      if (signal) {
        query = query.abortSignal(signal)
      }

      const result = await query.maybeSingle()

      return Boolean(result.data)
    },
    { enabled: Boolean(projectRef) }
  )

  const { data: vercelWithoutSupavisorEnabled, isLoading: isLoadingVercelWithoutSupavisorEnabled } =
    useQuery(
      ['projects', projectRef, 'vercel-without-supavisor-enabled'],
      async ({ signal }) => {
        let query = supabase
          .from('vercel_project_connections_without_supavisor')
          .select('*')
          .eq('project_ref', projectRef)
          .limit(1)

        if (signal) {
          query = query.abortSignal(signal)
        }

        const result = await query.maybeSingle()

        return Boolean(result.data)
      },
      { enabled: Boolean(projectRef) }
    )

  if (
    isLoadingProfile ||
    isLoadingPgbouncerEnabled ||
    isLoadingVercelWithoutSupavisorEnabled ||
    router.pathname.includes('sign-in') ||
    acknowledged
  ) {
    return null
  }

  return (
    <div
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
      style={{ height: '44px' }}
    >
      <p className="text-sm">
        {pgbouncerEnabled
          ? 'Our logs on 26th Jan show that you have accessed PgBouncer. Please migrate now. You can ignore this warning if you have already migrated.'
          : vercelWithoutSupavisorEnabled
          ? "To prepare for the IPv4 migration, please redeploy your Vercel application to detect the updated environment variables if it hasn't been deployed since 27th January."
          : 'We are migrating our infrastructure from IPv4 to IPv6. Please migrate now. You can ignore this warning if you have already migrated.'}
      </p>
      <div className="flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<IconExternalLink />}>
          <a
            href={
              vercelWithoutSupavisorEnabled
                ? 'https://supabase.com/partners/integrations/vercel'
                : 'https://github.com/orgs/supabase/discussions/17817'
            }
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
        <Button type="text" className="opacity-75" onClick={() => onUpdateAcknowledged(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
