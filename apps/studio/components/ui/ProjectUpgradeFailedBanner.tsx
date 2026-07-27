import { SupportCategories } from '@supabase/shared-types/out/constants'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { ButtonTooltip } from './ButtonTooltip'
import { InlineLink } from './InlineLink'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useProjectUpgradingStatusQuery } from '@/data/config/project-upgrade-status-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useShowPostgresUpgradeLogs } from '@/hooks/misc/useShowPostgresUpgradeLogs'
import { IS_PLATFORM } from '@/lib/constants'
import { guessLocalTimezone } from '@/lib/dayjs'

// [Joshen] Think twice about the category though - it doesn't correspond

export const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { status, initiated_at, latest_status_at, error } = data?.databaseUpgradeStatus ?? {}
  const showPostgresUpgradeLogs = useShowPostgresUpgradeLogs()

  const [dismissedAt, setDismissedAt] = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.PROJECT_UPGRADE_FAILED_BANNER_DISMISSED_AT(ref ?? 'unknown'),
    null
  )

  const isFailed = status === DatabaseUpgradeStatus.Failed && initiated_at !== dismissedAt
  const initiatedAt = dayjs
    .utc(initiated_at ?? 0)
    .tz(guessLocalTimezone())
    .format('DD MMM YYYY HH:mm:ss')

  const subject = 'Upgrade failed for project'
  const message = `Upgrade information:\n• Initiated at: ${initiated_at}\n• Error: ${error}`

  const initiatedAtEncoded = encodeURIComponent(
    dayjs.utc(initiated_at ?? 0).format('YYYY-MM-DDTHH:mm:ss')
  )
  const latestStatusAtEncoded = encodeURIComponent(
    dayjs
      .utc(latest_status_at ?? 0)
      .utcOffset(0)
      .format('YYYY-MM-DDTHH:mm:ss')
  )
  const timestampFilter = `its=${initiatedAtEncoded}&ite=${latestStatusAtEncoded}`

  if (!isFailed) return null

  return (
    <div className="max-w-7xl">
      <Admonition
        type="warning"
        title={`Postgres version upgrade was not successful (Initiated at ${initiatedAt})`}
        actions={
          <>
            <Button asChild variant="default">
              <SupportLink
                queryParams={{
                  category: SupportCategories.DATABASE_UNRESPONSIVE,
                  projectRef: ref,
                  subject,
                  message,
                }}
              >
                Contact support
              </SupportLink>
            </Button>
            <ButtonTooltip
              icon={<X />}
              variant="text"
              className="w-6"
              tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
              aria-label="Dismiss upgrade failed banner"
              onClick={() => setDismissedAt(initiated_at ?? null)}
            />
          </>
        }
      >
        <div>
          Your project and its data are not affected. Please reach out to us via our support form
          for assistance with the upgrade.
        </div>
        {showPostgresUpgradeLogs && (
          <div>
            You may also view logs related to the failed upgrade in your{' '}
            <InlineLink href={`/project/${ref}/logs/pg-upgrade-logs?${timestampFilter}`}>
              project's logs
            </InlineLink>
            .
          </div>
        )}
      </Admonition>
    </div>
  )
}
