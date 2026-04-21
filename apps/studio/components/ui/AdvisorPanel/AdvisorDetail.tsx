import { noop } from 'lodash'

import type { AdvisorItem } from './AdvisorPanel.types'
import { AdvisorSignalDetail } from './AdvisorSignalDetail'
import { NotificationDetail } from './NotificationDetail'
import LintDetail from '@/components/interfaces/Linter/LintDetail'
import type { Lint } from '@/data/lint/lint-query'
import type { Notification } from '@/data/notifications/notifications-v2-query'

interface AdvisorDetailProps {
  item: AdvisorItem
  projectRef: string
  onUpdateNotificationStatus?: (id: string, status: 'archived' | 'seen') => void
}

export const AdvisorDetail = ({
  item,
  projectRef,
  onUpdateNotificationStatus = noop,
}: AdvisorDetailProps) => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      <div className="px-6 py-6">
        <LintDetail lint={lint} projectRef={projectRef} />
      </div>
    )
  }

  if (item.source === 'signal') {
    return (
      <div className="px-6 py-6">
        <AdvisorSignalDetail item={item} />
      </div>
    )
  }

  if (item.source === 'notification') {
    const notification = item.original as Notification
    return (
      <div className="px-6 py-6">
        <NotificationDetail
          notification={notification}
          onUpdateStatus={onUpdateNotificationStatus}
        />
      </div>
    )
  }

  return null
}
