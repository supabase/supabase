import * as Tooltip from '@radix-ui/react-tooltip'
import {
  ActionType,
  Notification,
  NotificationStatus,
  PostgresqlUpgradeData,
} from '@supabase/shared-types/out/notifications'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { Button, IconArrowRight, IconBell, IconInbox, Popover } from 'ui'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useNotificationsQuery } from 'data/notifications/notifications-query'
import { useNotificationsUpdateMutation } from 'data/notifications/notifications-update-mutation'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { useProjectRestartServicesMutation } from 'data/projects/project-restart-services-mutation'
import { setProjectPostgrestStatus } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Project } from 'types'
import NotificationRow from './NotificationRow'

interface NotificationsPopoverProps {
  alt?: boolean
}

const NotificationsPopover = ({ alt = false }: NotificationsPopoverProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { meta, ui } = useStore()
  const { data: notifications } = useNotificationsQuery()
  const { mutate: updateNotifications } = useNotificationsUpdateMutation({
    onError: () => console.error('Failed to update notifications'),
  })

  const [projectToRestart, setProjectToRestart] = useState<Project>()
  const [projectToApplyMigration, setProjectToApplyMigration] = useState<Project>()
  const [projectToRollbackMigration, setProjectToRollbackMigration] = useState<Project>()
  const [targetNotification, setTargetNotification] = useState<Notification>()

  const { mutate: restartProjectServices } = useProjectRestartServicesMutation({
    onSuccess: (res, variables) => {
      setProjectToRestart(undefined)
      setTargetNotification(undefined)

      setProjectPostgrestStatus(queryClient, variables.ref, 'OFFLINE')
      ui.setNotification({ category: 'success', message: `Restarting services` })
      router.push(`/project/${variables.ref}`)
    },
  })

  const newNotifications =
    notifications?.filter(
      (notification) => notification.notification_status === NotificationStatus.New
    ) ?? []
  const hasNewNotifications = newNotifications.length > 0

  const onOpenChange = async (open: boolean) => {
    // Mark notifications as seen
    if (!open) {
      const notificationIds =
        notifications
          ?.filter((notification) => notification.notification_status === NotificationStatus.New)
          .map((notification) => notification.id) ?? []
      if (notificationIds.length > 0) updateNotifications({ ids: notificationIds })
    }
  }

  const onConfirmProjectRestart = async () => {
    if (!projectToRestart || !targetNotification) return

    const { id } = targetNotification

    const { ref, region } = projectToRestart
    const serviceNamesByActionName: Record<string, string> = {
      [ActionType.PgBouncerRestart]: 'pgbouncer',
      [ActionType.SchedulePostgresRestart]: 'postgresql',
      [ActionType.MigratePostgresSchema]: 'postgresql',
    }
    const services: string[] = targetNotification.meta.actions_available
      .map((action) => action.action_type)
      .filter((actionName) => Object.keys(serviceNamesByActionName).indexOf(actionName) !== -1)
      .map((actionName) => serviceNamesByActionName[actionName])

    restartProjectServices({ ref, region, services: services as any, source_notification_id: id })
  }

  const onConfirmProjectApplyMigration = async () => {
    if (!projectToApplyMigration) return

    const data = targetNotification?.data as PostgresqlUpgradeData
    const { resource } = data.additional as any
    if (!resource) return

    // [Joshen] Leaving this as an exception for RQ due to dynamic URL
    const res = await post(`${API_URL}/database/${projectToApplyMigration.ref}/${resource}`, {})
    if (!res.error) {
      const project = await getProjectDetail({ ref: projectToApplyMigration.ref })
      if (project) meta.setProjectDetails(project)

      ui.setNotification({
        category: 'success',
        message: `Successfully applied migration for project "${projectToApplyMigration.name}"`,
      })
    } else {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to apply migration: ${res.error.message}`,
      })
    }
    setProjectToApplyMigration(undefined)
  }

  const onConfirmProjectRollbackMigration = async () => {
    if (!projectToRollbackMigration) return

    const data = targetNotification?.data as PostgresqlUpgradeData
    const { resource } = data.additional as any
    if (!resource) return

    // [Joshen] Leaving this as an exception for RQ due to dynamic URL
    const res = await delete_(
      `${API_URL}/database/${projectToRollbackMigration.ref}/${resource}`,
      {}
    )
    if (!res.error) {
      const project = await getProjectDetail({ ref: projectToRollbackMigration.ref })
      if (project) meta.setProjectDetails(project)

      ui.setNotification({
        category: 'success',
        message: `Successfully rolled back migration for project "${projectToRollbackMigration.name}"`,
      })
    } else {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to roll back migration: ${res.error.message}`,
      })
    }
    setProjectToRollbackMigration(undefined)
  }

  if (!notifications || !Array.isArray(notifications)) return null

  return (
    <>
      <Popover
        size="content"
        align="end"
        side="bottom"
        sideOffset={8}
        onOpenChange={onOpenChange}
        overlay={
          <div className="w-[400px] lg:w-[700px]">
            <div className="flex items-center justify-between border-b border-default bg-surface-200 px-4 py-2">
              <p className="text-sm">Notifications</p>
              {/* Area for improvement: Paginate notifications and show in a side panel */}
              {/* <p className="text-foreground-light hover:text-foreground cursor-pointer text-sm transition">
              See all{' '}
              {notifications.length > MAX_NOTIFICATIONS_TO_SHOW && `(${notifications.length})`}
            </p> */}
            </div>
            <div className="max-h-[380px] overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="py-2 px-4">
                  <p className="text-sm text-foreground-light">No notifications available</p>
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
                        onSelectApplyMigration={(project, notification) => {
                          setProjectToApplyMigration(project)
                          setTargetNotification(notification)
                        }}
                        onSelectRollbackMigration={(project, notification) => {
                          setProjectToRollbackMigration(project)
                          setTargetNotification(notification)
                        }}
                      />
                      {i !== notifications.length - 1 && <Popover.Separator />}
                    </Fragment>
                  ))}
                </>
              )}
            </div>
          </div>
        }
      >
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <div className="relative flex items-center">
              {hasNewNotifications && (
                <>
                  {alt ? null : (
                    <div className="absolute -top-1 -right-1 z-50 flex h-3 w-3 items-center justify-center">
                      <div className="h-full w-full animate-ping rounded-full bg-green-800 opacity-60"></div>
                      <div className="z-60 absolute top-0 right-0 h-full w-full rounded-full bg-green-900 opacity-80"></div>
                    </div>
                  )}
                </>
              )}
              <Button
                asChild
                id="notification-button"
                type={alt ? 'text' : 'default'}
                className={alt ? 'px-1' : ''}
                icon={
                  hasNewNotifications ? (
                    <div className="-mr-3.5 z-10 h-4 w-4 flex items-center justify-center rounded-full bg-black dark:bg-white">
                      <p className="text-xs text-background-alternative">
                        {newNotifications.length}
                      </p>
                    </div>
                  ) : alt ? (
                    <IconInbox size={18} strokeWidth={1.5} className="text-foreground-light" />
                  ) : (
                    <IconBell size={16} strokeWidth={1.5} className="text-foreground" />
                  )
                }
                iconRight={
                  hasNewNotifications ? (
                    <>
                      {alt ? (
                        <IconInbox size={18} strokeWidth={1.5} className="text-foreground-light" />
                      ) : (
                        <IconBell size={16} strokeWidth={1.5} className="text-foreground" />
                      )}
                    </>
                  ) : null
                }
              >
                <span></span>
              </Button>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background flex items-center space-x-1',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">Notifications</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
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
      <ConfirmModal
        size="large"
        visible={projectToApplyMigration !== undefined}
        title={`Apply schema migration for "${projectToApplyMigration?.name}"`}
        // @ts-ignore
        description={
          <div className="text-foreground space-y-2">
            <div className="space-y-1">
              <p>The following schema migration will be applied to the project</p>
              <ol className="list-disc pl-6">
                <li>
                  <div className="flex items-center space-x-1">
                    <p>{(targetNotification?.data as any)?.additional?.name}</p>
                    <IconArrowRight size={12} strokeWidth={2} />
                    <p>{(targetNotification?.data as any)?.additional?.version_to}</p>
                  </div>
                </li>
              </ol>
            </div>
            <p>
              This change can be rolled back anytime up till{' '}
              {dayjs(
                new Date(targetNotification?.meta.actions_available?.[0]?.deadline ?? 0)
              ).format('DD MMM YYYY, HH:mma ZZ')}
              , after which the changes will be finalized and can no longer be undone.
            </p>
          </div>
        }
        buttonLabel="Confirm"
        buttonLoadingLabel="Confirm"
        onSelectCancel={() => setProjectToApplyMigration(undefined)}
        onSelectConfirm={onConfirmProjectApplyMigration}
      />
      <ConfirmModal
        size="medium"
        visible={projectToRollbackMigration !== undefined}
        title={`Rollback schema migration for "${projectToRollbackMigration?.name}"`}
        // @ts-ignore
        description={
          <div className="text-foreground space-y-2">
            <div className="space-y-1">
              <p>The following schema migration will be rolled back for the project</p>
              <ol className="list-disc pl-6">
                <li>
                  <div className="flex items-center space-x-1">
                    <p>{(targetNotification?.data as any)?.additional?.name}</p>
                    <IconArrowRight size={12} strokeWidth={2} />
                    <p>{(targetNotification?.data as any)?.additional?.version_to}</p>
                  </div>
                </li>
              </ol>
            </div>
            <p>
              This migration however will still be applied and finalized after{' '}
              {dayjs(
                new Date(targetNotification?.meta.actions_available?.[0]?.deadline ?? 0)
              ).format('DD MMM YYYY, HH:mma ZZ')}
              , after which the changes can no longer be undone.
            </p>
          </div>
        }
        buttonLabel="Confirm"
        buttonLoadingLabel="Confirm"
        onSelectCancel={() => setProjectToRollbackMigration(undefined)}
        onSelectConfirm={onConfirmProjectRollbackMigration}
      />
    </>
  )
}

export default NotificationsPopover
