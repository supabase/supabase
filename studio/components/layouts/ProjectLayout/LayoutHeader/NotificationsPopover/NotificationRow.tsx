import * as Tooltip from '@radix-ui/react-tooltip'
import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Button, IconArchive, IconX } from 'ui'

import { useNotificationsDismissMutation } from 'data/notifications/notifications-dismiss-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Project } from 'types'
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
  const { data: projects } = useProjectsQuery()
  const project = projects?.find((project) => project.id === notification.project_id)

  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const changelogLink = (notification.data as any).changelog_link
  const availableActions = notification.meta?.actions_available ?? []

  const { mutate: dismissNotifications, isLoading: isDismissing } = useNotificationsDismissMutation(
    {
      onError: (error) => {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to dismiss notification: ${error.message}`,
          duration: 4000,
        })
      },
    }
  )

  // [Joshen TODO] This should be removed after the env of Feb when the migration notifications
  // have been removed, double check with Qiao before removing.
  // Relevant PR: https://github.com/supabase/supabase/pull/9229
  const { data: ownerReassignStatus } = useQuery(
    ['projects', project?.ref, 'owner-reassign'],
    ({ signal }) => get(`${API_URL}/database/${project?.ref}/owner-reassign`, { signal }),
    {
      enabled:
        (notification.data as any).upgrade_type === 'schema-migration' && project !== undefined,
    }
  )

  const dismissNotification = async (notificationId: string) => {
    if (!notificationId) return
    dismissNotifications({ ids: [notificationId] })
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
            {formatNotificationText(project, notification, ownerReassignStatus)}
            {formatNotificationCTAText(availableActions, ownerReassignStatus)}
            <p className="text-scale-1100 text-sm !mt-2">{insertedAt}</p>
          </div>
          <div className="w-1/10 flex justify-end">
            <div>
              <Button
                className="!px-1 group"
                type="text"
                loading={isDismissing}
                icon={
                  <IconX
                    size={14}
                    strokeWidth={2}
                    className="text-scale-1100 group-hover:text-scale-1200 transition"
                  />
                }
                onClick={() => dismissNotification(notification.id)}
              />
            </div>
          </div>
        </div>
        {(availableActions.length > 0 || changelogLink !== undefined) && (
          <div className="flex items-center">
            <NotificationActions
              project={project}
              changelogLink={changelogLink}
              ownerReassignStatus={ownerReassignStatus}
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
