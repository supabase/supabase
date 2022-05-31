import { FC, Fragment } from 'react'
import {
  Button,
  IconBell,
  Popover,
  Dropdown,
  IconCheck,
  IconMoreVertical,
  IconXSquare,
} from '@supabase/ui'
import {
  Notification,
  NotificationName,
  NotificationStatus,
} from '@supabase/shared-types/out/notifications'

import { useNotifications } from 'hooks'
import TierLimitExceededNotification from './TierLimitExceededNotification'
import PostgresqlInfoNotification from './PostgresqlInfoNotification'
import PostgresqlBugfixNotification from './PostgresqlBugfixNotification'

interface Props {}

const NotificationsPopover: FC<Props> = () => {
  const { notifications } = useNotifications()

  const hasNewNotifications =
    notifications !== undefined &&
    notifications.some(
      (notification) => notification.notification_status === NotificationStatus.New
    )

  const renderNotification = (notification: Notification) => {
    switch (notification.notification_name) {
      case NotificationName.ProjectExceedingTierLimit:
        return <TierLimitExceededNotification key={notification.id} notification={notification} />
      case NotificationName.PostgresqlInformational:
        return <PostgresqlInfoNotification key={notification.id} notification={notification} />
      case NotificationName.PostgresqlBugfix:
        return <PostgresqlBugfixNotification key={notification.id} notification={notification} />
      default:
        return <div key={notification.id}>Unknown</div>
    }
  }

  return (
    <Popover
      size="content"
      align="end"
      side="bottom"
      sideOffset={8}
      overlay={
        <div className="my-2 w-[500px]">
          {notifications?.map((notification, i: number) => (
            <Fragment key={notification.id}>
              <div className="grid grid-cols-12 py-2">
                <div className="col-span-1 flex items-center justify-center">
                  {notification.notification_status !== NotificationStatus.Seen && (
                    <div className="h-2 w-2 rounded-full bg-green-900" />
                  )}
                </div>
                <div className="col-span-9">{renderNotification(notification)}</div>
                <div className="col-span-2 flex items-center justify-center">
                  <Dropdown
                    side="bottom"
                    align="end"
                    size="small"
                    overlay={[
                      <Dropdown.Item key="mark-read" icon={<IconCheck size={14} />}>
                        Mark as read
                      </Dropdown.Item>,
                      <Dropdown.Item key="dismiss" icon={<IconXSquare size={14} />}>
                        Dismiss notification
                      </Dropdown.Item>,
                    ]}
                  >
                    <IconMoreVertical size={16} />
                  </Dropdown>
                </div>
              </div>
              {i !== notifications.length - 1 && <Popover.Seperator />}
            </Fragment>
          ))}
        </div>
      }
    >
      <div className="relative">
        <Button
          as="span"
          type={hasNewNotifications ? 'default' : 'text'}
          icon={<IconBell size={16} strokeWidth={1.5} className="text-scale-1200" />}
        />
        {hasNewNotifications && (
          <div className="absolute -top-1 -right-1 z-50 flex h-3 w-3 items-center justify-center">
            <div className="h-full w-full animate-ping rounded-full bg-green-800 opacity-60"></div>
            <div className="z-60 absolute top-0 right-0 h-full w-full rounded-full bg-green-900 opacity-80"></div>
          </div>
        )}
      </div>
    </Popover>
  )
}

export default NotificationsPopover
