import LintDetail from 'components/interfaces/Linter/LintDetail'
import { Lint } from 'data/lint/lint-query'
import { Notification } from 'data/notifications/notifications-v2-query'
import { noop } from 'lodash'
import { AdvisorItem } from './AdvisorPanelHeader'
import { NotificationDetail } from './NotificationDetail'

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
