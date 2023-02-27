import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, IconX } from 'ui'
import { useParams } from 'hooks'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'

const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref })
  const { target_version, status, progress, initiated_at, error } =
    data?.databaseUpgradeStatus ?? {}

  const key = `supabase-upgrade-${ref}-${initiated_at}`
  const isAcknowledged = localStorage.getItem(key) === 'true'
  const [showMessage, setShowMessage] = useState(!isAcknowledged)

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const initiatedAtUTC = dayjs(initiated_at ?? 0)
    .utc()
    .format('DD MMM YYYY HH:mm:ss')

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Progress state: ${progress}%0A• Error: ${error}`

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
        title={`Postgres version upgrade to ${target_version} was not successful`}
        actions={
          <div className="flex h-full items-center space-x-4">
            <Link
              href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
            >
              <a>
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
        Your request to upgrade your project's Postgres on {initiatedAtUTC} was not successful.
        Please reach out to us via our support form.
      </Alert>
    </div>
  )
}

export default ProjectUpgradeFailedBanner
