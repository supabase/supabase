import { FC, Fragment } from 'react'
import { Button, IconBell, Popover } from '@supabase/ui'
import { NotificationStatus } from '@supabase/shared-types/out/notifications'

import { useNotifications } from 'hooks'
import NotificationRow from './NotificationRow'

interface Props {}

const MAX_NOTIFICATIONS_TO_SHOW = 4

const NotificationsPopover: FC<Props> = () => {
  const { notifications } = useNotifications()

  const hasNewNotifications =
    notifications !== undefined &&
    notifications.some(
      (notification) => notification.notification_status === NotificationStatus.New
    )

  const onOpenChange = (open: boolean) => {
    if (!open) {
      // Mark notifications as seen
    }
  }

  if (!notifications) return <div />

  return (
    <Popover
      size="content"
      align="end"
      side="bottom"
      sideOffset={8}
      onOpenChange={onOpenChange}
      overlay={
        <div className="mb-2 w-[550px]">
          <div className="mb-2 flex items-center justify-between border-b border-gray-500 bg-gray-400 px-4 py-2">
            <p className="text-sm">Notifications</p>
            <p className="text-scale-1000 hover:text-scale-1200 cursor-pointer text-sm transition">
              See all{' '}
              {notifications.length > MAX_NOTIFICATIONS_TO_SHOW && `(${notifications.length})`}
            </p>
          </div>
          {notifications?.map((notification, i: number) => (
            <Fragment key={notification.id}>
              <NotificationRow notification={notification} />
              {i !== notifications.length - 1 && <Popover.Seperator />}
            </Fragment>
          ))}
        </div>
      }
    >
      <div className="relative">
        <Button
          as="span"
          type="default"
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
