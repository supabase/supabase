import { LOCAL_STORAGE_KEYS } from 'common'
import { Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

const MIGRATION_GUIDE_URL =
  'https://supabase.com/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint'

export const BannerLogsAllDeprecation = () => {
  const track = useTrack()
  const { dismissBanner } = useBannerStack()

  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LOGS_ALL_DEPRECATION_2026_09_23,
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner(BANNER_ID.LOGS_ALL_DEPRECATION)
        track('logs_all_deprecation_banner_dismissed')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">logs.all endpoint is removed on September 23</p>
          <p className="text-xs text-foreground-lighter text-balance">
            If you query project logs through the <code>analytics/endpoints/logs.all</code>{' '}
            Management API endpoint, migrate to <code>analytics/endpoints/logs</code> before then.
            The new endpoint uses ClickHouse SQL, so queries need rewriting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="tiny" asChild>
            <a href={MIGRATION_GUIDE_URL} target="_blank" rel="noreferrer noopener">
              View migration guide
            </a>
          </Button>
        </div>
      </div>
    </BannerCard>
  )
}
