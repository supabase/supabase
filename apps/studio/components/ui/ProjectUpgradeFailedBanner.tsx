import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from 'ui'

import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { IS_PLATFORM } from 'lib/constants'
import { X } from 'lucide-react'
import { Admonition } from 'ui-patterns'

// [Joshen] Think twice about the category though - it doesn't correspond

const ProjectUpgradeFailedBanner = () => {
  const { ref } = useParams()
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { status, initiated_at, error } = data?.databaseUpgradeStatus ?? {}

  const key = `supabase-upgrade-${ref}-${initiated_at}`
  const isAcknowledged =
    typeof window !== 'undefined' ? localStorage?.getItem(key) === 'true' ?? false : false
  const [showMessage, setShowMessage] = useState(!isAcknowledged)

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const initiatedAtUTC = dayjs
    .utc(initiated_at ?? 0)
    .utc()
    .format('DD MMM YYYY HH:mm:ss')

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Error: ${error}`

  const acknowledgeMessage = () => {
    setShowMessage(false)
    localStorage.setItem(key, 'true')
  }

  if (!isFailed || !showMessage) return null

  return (
    <div className="max-w-7xl">
      <Admonition
        type={'warning'}
        title={`Postgres version upgrade was not successful (Initiated at ${initiatedAtUTC} UTC)`}
      >
        Your project and its data are not affected. Please reach out to us via our support form for
        assistance with the upgrade.
        <Button
          type="text"
          className="absolute top-4 right-4"
          icon={<X size={16} strokeWidth={1.5} />}
          onClick={() => acknowledgeMessage()}
        />
        <div className="mt-2">
          <Button asChild type="default">
            <Link
              href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
              target="_blank"
              rel="noreferrer"
            >
              Contact support
            </Link>
          </Button>
        </div>
      </Admonition>
    </div>
  )
}

export default ProjectUpgradeFailedBanner
