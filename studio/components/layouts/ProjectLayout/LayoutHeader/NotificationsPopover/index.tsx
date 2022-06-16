import { FC, Fragment, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, IconBell, Popover } from '@supabase/ui'
import { Notification, NotificationStatus, ActionType } from '@supabase/shared-types/out/notifications'

import { Project } from 'types'
import { useNotifications, useStore } from 'hooks'
import { patch, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import NotificationRow from './NotificationRow'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {}

const NotificationsPopover: FC<Props> = () => {
  const router = useRouter()
  const { app, ui } = useStore()
  const { notifications, refresh } = useNotifications()

  const [projectToRestart, setProjectToRestart] = useState<Project>()
  const [targetNotification, setTargetNotification] = useState<Notification>()

  if (!notifications) return <></>

  const hasNewNotifications = notifications?.some(
    (notification) => notification.notification_status === NotificationStatus.New
  )

  const onOpenChange = async (open: boolean) => {
    if (!open) {
      // Mark notifications as seen
      const notificationIds = notifications
        .filter((notification) => notification.notification_status === NotificationStatus.New)
        .map((notification) => notification.id)
      if (notificationIds.length > 0) {
        const { error } = await patch(`${API_URL}/notifications`, { ids: notificationIds })
        if (error) console.error('Failed to update notifications', error)
        refresh()
      }
    }
  }

  const onConfirmProjectRestart = async () => {
    if (!projectToRestart || !targetNotification) return

    const { id } = targetNotification

    const { id: projectId, ref, region } = projectToRestart
    const serviceNamesByActionName: Record<string, string> = {
      [ActionType.PgBouncerRestart]: 'pgbouncer',
      [ActionType.SchedulePostgresRestart]: 'postgresql'
    }
    const services: string[] = targetNotification.meta.actions_available
      .map((action) => action.action_type)
      .filter((actionName) => Object.keys(serviceNamesByActionName).indexOf(actionName) !== -1)
      .map((actionName) => serviceNamesByActionName[actionName])
    const { error } = await post(`${API_URL}/projects/${ref}/restart-services`, {
      restartRequest: {
        region,
        source_notification_id: id,
        services: services,
      },
    })

    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to restart project: ${error.message}`,
        error,
      })
    } else {
      app.onProjectPostgrestStatusUpdated(projectId, 'OFFLINE')
      ui.setNotification({ category: 'success', message: `Restarting services` })
      router.push(`/project/${ref}`)
    }

    setProjectToRestart(undefined)
    setTargetNotification(undefined)
  }

  return (
    <>
      <Popover
        size="content"
        align="end"
        side="bottom"
        sideOffset={8}
        onOpenChange={onOpenChange}
        overlay={
          <div className="w-[540px]">
            <div className="flex items-center justify-between border-b border-gray-500 bg-gray-400 px-4 py-2">
              <p className="text-sm">Notifications</p>
              {/* Area for improvement: Paginate notifications and show in a side panel */}
              {/* <p className="text-scale-1000 hover:text-scale-1200 cursor-pointer text-sm transition">
              See all{' '}
              {notifications.length > MAX_NOTIFICATIONS_TO_SHOW && `(${notifications.length})`}
            </p> */}
            </div>
            <div className="max-h-[380px] overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="py-2 px-4">
                  <p className="text-scale-1000 text-sm">No notifications available</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification, i: number) => (
                    <Fragment key={notification.id}>
                      <NotificationRow
                        notification={notification}
                        onSelectRestartProject={(project, notification) => {
                          setProjectToRestart(project)
                          setTargetNotification(notification)
                        }}
                      />
                      {i !== notifications.length - 1 && <Popover.Seperator />}
                    </Fragment>
                  ))}
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="relative flex">
          <Button
            as="span"
            id="notification-button"
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

      <ConfirmModal
        danger
        visible={projectToRestart !== undefined}
        title={`Restart project "${projectToRestart?.name}"`}
        description={`Are you sure you want to restart the project? There will be a few minutes of downtime.`}
        buttonLabel="Restart"
        buttonLoadingLabel="Restarting"
        onSelectCancel={() => setProjectToRestart(undefined)}
        onSelectConfirm={onConfirmProjectRestart}
      />
    </>
  )
}

export default NotificationsPopover
