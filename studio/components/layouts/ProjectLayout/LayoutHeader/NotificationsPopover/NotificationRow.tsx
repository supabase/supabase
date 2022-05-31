import dayjs from 'dayjs'
import { FC } from 'react'
import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'

import { useStore } from 'hooks'
import { Project } from 'types'
import { formatNotificationText } from './NotificationRows.utils'
import NotificationActions from './NotificationActions'

interface Props {
  notification: Notification
}

const NotificationRow: FC<Props> = ({ notification }) => {
  const { app } = useStore()
  const [project] = app.projects.list((project: Project) => project.id === notification.project_id)

  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const availableActions = notification.meta?.actions_available ?? []

  return (
    <div className="grid grid-cols-12 py-2">
      <div className="col-span-1 flex justify-center">
        {notification.notification_status !== NotificationStatus.Seen && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-green-900" />
        )}
      </div>
      <div className={availableActions.length > 0 ? 'col-span-7' : 'col-span-10'}>
        <div className="space-y-1">
          <p className="text-sm">{formatNotificationText(project, notification)}</p>
          <p className="text-scale-1000 text-sm">{insertedAt}</p>
        </div>
      </div>
      <div className="col-span-3 flex items-center justify-end">
        {availableActions.length > 0 && <NotificationActions availableActions={availableActions} />}
      </div>
      <div className="col-span-1" />
    </div>
  )
}

export default NotificationRow
