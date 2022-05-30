import dayjs from 'dayjs'
import { FC } from 'react'
import {
  Button,
  Dropdown,
  IconCheck,
  IconMoreVertical,
  IconRefreshCw,
  IconXSquare,
} from '@supabase/ui'
import { Notification } from '@supabase/shared-types/out/notifications'
import { PostgreslInformationalNotification } from './Notifications.types'

interface Props {
  notification: Notification
}

const PostgresqlInfoNotification: FC<Props> = ({ notification }) => {
  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const { new_version, extension_name } = notification.data as PostgreslInformationalNotification

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="space-y-1">
        <p className="text-sm">
          A new version ({new_version}) for {extension_name} is now available!{' '}
          <span className="text-brand-900 cursor-pointer">Restart</span> your project for changes to
          take place.
        </p>
        <p className="text-scale-1000 text-sm">{insertedAt}</p>
      </div>
    </div>
  )
}

export default PostgresqlInfoNotification
