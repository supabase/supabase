import { LOCAL_STORAGE_KEYS } from 'common'
import { Badge, Button } from 'ui'

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
        track('logs_all_deprecation_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-2">
        <Badge variant="default" className="w-min -ml-0.5 uppercase inline-flex items-center mb-2">
          Notice
        </Badge>

        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Logs endpoint retires September 23</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Scripts that call the <code className="text-code-inline break-keep!">logs.all</code>{' '}
            Management API endpoint need to migrate. Dashboard logs are unchanged.
          </p>
        </div>
        <Button variant="default" size="tiny" className="w-min" asChild>
          <a href={MIGRATION_GUIDE_URL} target="_blank" rel="noreferrer noopener">
            Learn more
          </a>
        </Button>
      </div>
    </BannerCard>
  )
}
