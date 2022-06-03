import dayjs from 'dayjs'
import { FC } from 'react'
import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'

import { useStore } from 'hooks'
import { Project } from 'types'
import { formatNotificationCTAText, formatNotificationText } from './NotificationRows.utils'
import NotificationActions from './NotificationActions'

interface Props {
  notification: Notification
  onSelectRestartProject: (project: Project, notification: Notification) => void
}

const NotificationRow: FC<Props> = ({ notification, onSelectRestartProject }) => {
  const { app } = useStore()
  const [project] = app.projects.list((project: Project) => project.id === notification.project_id)

  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const availableActions = notification.meta?.actions_available ?? []

  return (
    <div className="flex py-2">
      <div className="flex w-[50px] justify-center">
        {notification.notification_status !== NotificationStatus.Seen && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-green-900" />
        )}
      </div>
      <div className="mr-8 flex items-center space-x-4">
        <div className="space-y-1">
          <p className="text-sm">{formatNotificationText(project, notification)}</p>
          <p className="text-sm">{formatNotificationCTAText(availableActions)}</p>
          <p className="text-scale-1100 text-sm">{insertedAt}</p>
        </div>
        <div className="col-span-3 flex items-center justify-end">
          {availableActions.length > 0 && (
            <NotificationActions
              project={project}
              availableActions={availableActions}
              onSelectRestartProject={() => onSelectRestartProject(project, notification)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationRow
