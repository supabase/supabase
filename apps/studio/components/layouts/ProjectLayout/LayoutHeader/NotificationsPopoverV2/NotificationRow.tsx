import clsx from 'clsx'
import { NotificationData } from 'data/notifications/notifications-v2-query'
import { AlertCircleIcon } from 'lucide-react'
import { Project } from 'types'
import { Button, IconAlertCircle, IconArchive } from 'ui'

interface NotificationRowProps {
  data: NotificationData
  priority: 'Info' | 'Warning' | 'Critical'
  project?: Project
}

const NotificationRow = ({ data, priority, project }: NotificationRowProps) => {
  return (
    <div className="p-4 flex justify-between">
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          <p className="text-sm">{data.title}</p>
          <p className="text-xs text-foreground-light">5 mins ago</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-y-3">
        {priority === 'Warning' && (
          <IconAlertCircle
            size={22}
            strokeWidth={3}
            className="rounded p-0.5 text-warning-400 bg-warning-600"
          />
        )}
        {priority === 'Critical' && (
          <IconAlertCircle
            size={22}
            strokeWidth={3}
            className="rounded p-0.5 text-destructive-400 bg-destructive-600"
          />
        )}
        <Button type="outline" icon={<IconArchive />} className="px-1" />
      </div>
    </div>
  )
}

export default NotificationRow
