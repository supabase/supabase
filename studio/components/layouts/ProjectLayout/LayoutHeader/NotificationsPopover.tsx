import dayjs from 'dayjs'
import { FC, Fragment } from 'react'
import { Button, IconBell, Popover } from '@supabase/ui'
import { NotificationStatus } from '@supabase/shared-types/out/notifications'

import { useNotifications } from 'hooks'

interface Props {}

const NotificationsPopover: FC<Props> = () => {
  const { notifications } = useNotifications()

  const hasNewNotifications =
    notifications !== undefined &&
    notifications.some(
      (notification) => notification.notification_status === NotificationStatus.New
    )
  console.log('Notifications', notifications)

  return (
    <Popover
      size="content"
      align="end"
      side="bottom"
      sideOffset={8}
      overlay={
        <div className="my-4 w-96 space-y-4">
          {notifications?.map((notification, i: number) => {
            const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
            return (
              <Fragment key={notification.id}>
                <div className="px-4">
                  <p className="text-scale-1000 text-sm">{insertedAt}</p>
                </div>
                {i !== notifications.length - 1 && <Popover.Seperator />}
              </Fragment>
            )
          })}
        </div>
      }
      onOpenChange={(open) => console.log('onOpenChange', open)}
    >
      <div className="relative">
        <Button
          as="span"
          type={hasNewNotifications ? 'default' : 'text'}
          icon={<IconBell size={16} strokeWidth={1.5} className="text-scale-1200" />}
        />
        <div className="absolute -top-1 -right-1 z-50 flex h-3 w-3 items-center justify-center">
          <div className="h-full w-full animate-ping rounded-full bg-green-800 opacity-60"></div>
          <div className="z-60 absolute top-0 right-0 h-full w-full rounded-full bg-green-900 opacity-80"></div>
        </div>
      </div>
    </Popover>
  )
}

export default NotificationsPopover
