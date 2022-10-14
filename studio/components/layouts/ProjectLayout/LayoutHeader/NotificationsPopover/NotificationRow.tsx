import dayjs from 'dayjs'
import useSWR from 'swr'
import { FC } from 'react'
import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'

import { useStore } from 'hooks'
import { Project } from 'types'
import { formatNotificationCTAText, formatNotificationText } from './NotificationRows.utils'
import NotificationActions from './NotificationActions'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

interface Props {
  notification: Notification
  onSelectRestartProject: (project: Project, notification: Notification) => void
  onSelectApplyMigration: (project: Project, notification: Notification) => void
  onSelectRollbackMigration: (project: Project, notification: Notification) => void
  onSelectFinalizeMigration: (project: Project, notification: Notification) => void
}

const NotificationRow: FC<Props> = ({
  notification,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
  onSelectFinalizeMigration,
}) => {
  const { app } = useStore()
  const [project] = app.projects.list((project: Project) => project.id === notification.project_id)

  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const changelogLink = (notification.data as any).changelog_link
  const availableActions = notification.meta?.actions_available ?? []

  // [Joshen TODO] This should be removed after 5th November when the migration notifications
  // have been removed, double check with Qiao before removing.
  // Relevant PR: https://github.com/supabase/supabase/pull/9229
  const { data: ownerReassignStatus } = useSWR(
    (notification.data as any).upgrade_type === 'schema-migration'
      ? `${API_URL}/database/${project.ref}/owner-reassign`
      : null,
    get
  )

  return (
    <div className="flex py-2">
      <div className="flex min-w-[50px] justify-center">
        {notification.notification_status !== NotificationStatus.Seen && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-green-900" />
        )}
      </div>
      <div className="flex-grow mr-8 flex items-center space-x-4">
        <div className="w-[70%] space-y-2">
          {formatNotificationText(project, notification, ownerReassignStatus)}
          {formatNotificationCTAText(availableActions, ownerReassignStatus)}
          <p className="text-scale-1100 text-sm !mt-2">{insertedAt}</p>
        </div>
        <div className="w-[30%] col-span-3 flex items-center justify-end">
          {availableActions.length > 0 && (
            <NotificationActions
              project={project}
              changelogLink={changelogLink}
              ownerReassignStatus={ownerReassignStatus}
              availableActions={availableActions}
              onSelectRestartProject={() => onSelectRestartProject(project, notification)}
              onSelectApplyMigration={() => onSelectApplyMigration(project, notification)}
              onSelectRollbackMigration={() => onSelectRollbackMigration(project, notification)}
              onSelectFinalizeMigration={() => onSelectFinalizeMigration(project, notification)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationRow
