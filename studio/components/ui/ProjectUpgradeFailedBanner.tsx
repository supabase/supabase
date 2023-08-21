import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, IconX } from 'ui'
import { useParams } from 'common/hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'

// [Joshen] Think twice about the category though - it doesn't correspond

const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { target_version, status, initiated_at, error } = data?.databaseUpgradeStatus ?? {}

  const key = `supabase-upgrade-${ref}-${initiated_at}`
  const isAcknowledged =
    typeof window !== 'undefined' ? localStorage?.getItem(key) === 'true' ?? false : false
  const [showMessage, setShowMessage] = useState(!isAcknowledged)

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const initiatedAtUTC = dayjs(initiated_at ?? 0)
    .utc()
    .format('DD MMM YYYY HH:mm:ss')

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Target Version: ${target_version}%0A• Error: ${error}`

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
        title={`Postgres version upgrade to ${target_version} was not successful (Initiated at ${initiatedAtUTC} UTC)`}
        actions={
          <div className="flex items-center h-full space-x-4">
            <Link
              href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
            >
              <a target="_blank" rel="noreferrer">
                <Button type="default">Contact support</Button>
              </a>
            </Link>
            <Button
              type="text"
              className="px-1"
              icon={<IconX size={16} strokeWidth={1.5} />}
              onClick={() => acknowledgeMessage()}
            />
          </div>
        }
      >
        Your project and its data are not affected. Please reach out to us via our support form for
        assistance with the upgrade.
      </Alert>
    </div>
  )
}

export default ProjectUpgradeFailedBanner
