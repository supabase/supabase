import { Link } from '@tanstack/react-router'
import { noop } from 'lodash'
import { Button } from 'ui'

import type { AdvisorItem } from './AdvisorPanel.types'
import { AdvisorSignalDetail } from './AdvisorSignalDetail'
import { NotificationDetail } from './NotificationDetail'
import { LintDetail } from '@/components/interfaces/Linter/LintDetail'
import type { Lint } from '@/data/lint/lint-query'
import type { Notification } from '@/data/notifications/notifications-v2-query'

interface AdvisorDetailProps {
  item: AdvisorItem
  projectRef: string
  onUpdateNotificationStatus?: (id: string, status: 'archived' | 'seen') => void
  onAfterLintAction?: () => void
}

export const AdvisorDetail = ({
  item,
  projectRef,
  onUpdateNotificationStatus = noop,
  onAfterLintAction,
}: AdvisorDetailProps) => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      <div className="px-6 py-6">
        <LintDetail lint={lint} projectRef={projectRef} onAfterAction={onAfterLintAction} />
      </div>
    )
  }

  if (item.source === 'signal') {
    if (item.type === 'account-recovery') {
      return (
        <div className="px-6 py-6 space-y-6">
          <p className="text-sm text-foreground-light">{item.summary}</p>
          <Button variant="primary" asChild>
            <Link to={item.action.href}>{item.action.label}</Link>
          </Button>
        </div>
      )
    }
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
