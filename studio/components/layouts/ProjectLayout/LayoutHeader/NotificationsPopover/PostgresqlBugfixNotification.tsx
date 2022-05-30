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
      <Dropdown
        side="bottom"
        align="end"
        size="small"
        overlay={[
          <Dropdown.Item icon={<IconCheck size={14} />}>Mark as read</Dropdown.Item>,
          <Dropdown.Item icon={<IconXSquare size={14} />}>Dismiss notification</Dropdown.Item>,
          <Dropdown.Item icon={<IconRefreshCw size={14} />}>Restart project now</Dropdown.Item>,
        ]}
      >
        <Button size="tiny" type="text" icon={<IconMoreVertical />} />
      </Dropdown>
    </div>
  )
}

export default PostgresqlBugfixNotification
