import * as Tooltip from '@radix-ui/react-tooltip'
import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'

import { notificationKeys } from 'data/notifications/keys'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Project } from 'types'
import { Button, IconX } from 'ui'
import NotificationActions from './NotificationActions'
import { formatNotificationCTAText, formatNotificationText } from './NotificationRows.utils'

export interface NotificationRowProps {
  notification: Notification
  onSelectRestartProject: (project: Project, notification: Notification) => void
  onSelectApplyMigration: (project: Project, notification: Notification) => void
  onSelectRollbackMigration: (project: Project, notification: Notification) => void
  onSelectFinalizeMigration: (project: Project, notification: Notification) => void
}

const NotificationRow = ({
  notification,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
  onSelectFinalizeMigration,
}: NotificationRowProps) => {
  const { ui } = useStore()
  const queryClient = useQueryClient()
  const [dismissing, setDismissing] = useState(false)
  const { data: projects } = useProjectsQuery()
  const project = projects?.find((project) => project.id === notification.project_id)

  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const changelogLink = (notification.data as any).changelog_link
  const availableActions = notification.meta?.actions_available ?? []

  const dismissNotification = async (notificationId: string) => {
    if (!notificationId) return
    setDismissing(true)
    const { error } = await delete_(`${API_URL}/notifications`, { ids: [notificationId] })
    if (error) {
      ui.setNotification({
        category: 'error',
        message: 'Failed to dismiss notification',
        error,
        duration: 4000,
      })
    } else {
      await queryClient.invalidateQueries(notificationKeys.list())
    }
    setDismissing(false)
  }

  if (!project) return null

  return (
    <div className="flex py-2">
      <div className="flex min-w-[50px] justify-center">
        {notification.notification_status !== NotificationStatus.Seen && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-green-900" />
        )}
      </div>
      <div className="flex-grow mr-8 flex flex-col gap-4">
        <div className="w-full flex justify-between">
          <div className="w-9/10 space-y-2">
            {formatNotificationText(project, notification)}
            {formatNotificationCTAText(availableActions)}
            <p className="text-scale-1100 text-sm !mt-2">{insertedAt}</p>
          </div>
          <div className="w-1/10 flex justify-end">
            <div>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    className="!px-1 group"
                    type="text"
                    loading={dismissing}
                    icon={
                      <IconX
                        size={14}
                        strokeWidth={2}
                        className="text-scale-1100 group-hover:text-scale-1200 transition"
                      />
                    }
                    onClick={() => dismissNotification(notification.id)}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">Dismiss</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>
        </div>
        {(availableActions.length > 0 || changelogLink !== undefined) && (
          <div className="flex items-center">
            <NotificationActions
              project={project}
              changelogLink={changelogLink}
              availableActions={availableActions}
              onSelectRestartProject={() => onSelectRestartProject(project, notification)}
              onSelectApplyMigration={() => onSelectApplyMigration(project, notification)}
              onSelectRollbackMigration={() => onSelectRollbackMigration(project, notification)}
              onSelectFinalizeMigration={() => onSelectFinalizeMigration(project, notification)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationRow
