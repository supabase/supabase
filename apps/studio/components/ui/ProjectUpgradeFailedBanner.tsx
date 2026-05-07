import { SupportCategories } from '@supabase/shared-types/out/constants'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { InlineLink } from './InlineLink'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useProjectUpgradingStatusQuery } from '@/data/config/project-upgrade-status-query'
import { IS_PLATFORM } from '@/lib/constants'
import { guessLocalTimezone } from '@/lib/dayjs'

// [Joshen] Think twice about the category though - it doesn't correspond

export const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { status, initiated_at, latest_status_at, error } = data?.databaseUpgradeStatus ?? {}

  const isFailed = status === DatabaseUpgradeStatus.Failed
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
          <Button asChild type="default">
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
        }
      >
        <div>
          Your project and its data are not affected. Please reach out to us via our support form
          for assistance with the upgrade.
        </div>
        <div>
          You may also view logs related to the failed upgrade in your{' '}
          <InlineLink href={`/project/${ref}/logs/pg-upgrade-logs?${timestampFilter}`}>
            project's logs
          </InlineLink>
          .
        </div>
      </Admonition>
    </div>
  )
}
