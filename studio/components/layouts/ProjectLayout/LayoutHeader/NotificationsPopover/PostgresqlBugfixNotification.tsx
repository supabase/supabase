import dayjs from 'dayjs'
import { FC } from 'react'
import {
  Button,
  Dropdown,
  IconCheck,
  IconXSquare,
  IconRefreshCw,
  IconMoreVertical,
} from '@supabase/ui'
import { Notification } from '@supabase/shared-types/out/notifications'

interface Props {
  notification: Notification
}

const PostgresqlBugfixNotification: FC<Props> = ({ notification }) => {
  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="space-y-1">
        <p className="text-sm">
          A fix for {'{extension}'} is now available! Restart your project for changes to take
          place.
        </p>
        <p className="text-scale-1000 text-sm">{insertedAt}</p>
      </div>
    </div>
  )
}

export default PostgresqlBugfixNotification
