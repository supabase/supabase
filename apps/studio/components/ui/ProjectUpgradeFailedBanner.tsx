import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { IS_PLATFORM } from 'lib/constants'
import { Alert, Button } from 'ui'
import { InlineLink } from './InlineLink'

// [Joshen] Think twice about the category though - it doesn't correspond

export const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { status, initiated_at, latest_status_at, error } = data?.databaseUpgradeStatus ?? {}

  const key = `supabase-upgrade-${ref}-${initiated_at}`
  const isAcknowledged =
    typeof window !== 'undefined' ? localStorage?.getItem(key) === 'true' : false
  const [showMessage, setShowMessage] = useState(!isAcknowledged)

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const initiatedAt = dayjs
    .utc(initiated_at ?? 0)
    .tz(dayjs.tz.guess())
    .format('DD MMM YYYY HH:mm:ss')

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Error: ${error}`

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

  const acknowledgeMessage = () => {
    setShowMessage(false)
    localStorage.setItem(key, 'true')
  }

  if (!isFailed || !showMessage) return null

  return (
    <div className="max-w-7xl">
      <Alert
        withIcon
        variant={'warning'}
        title={`Postgres version upgrade was not successful (Initiated at ${initiatedAt})`}
        actions={
          <div className="flex items-center h-full space-x-4">
            <Button asChild type="default">
              <Link
                href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
                target="_blank"
                rel="noreferrer"
              >
                Contact support
              </Link>
            </Button>
            <Button
              type="text"
              className="px-1"
              icon={<X size={16} strokeWidth={1.5} />}
              onClick={() => acknowledgeMessage()}
            />
          </div>
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
      </Alert>
    </div>
  )
}
