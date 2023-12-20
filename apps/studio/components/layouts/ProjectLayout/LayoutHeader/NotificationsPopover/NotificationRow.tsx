import { Notification, NotificationStatus } from '@supabase/shared-types/out/notifications'
import dayjs from 'dayjs'
import { Button, IconX } from 'ui'

import { useNotificationsDismissMutation } from 'data/notifications/notifications-dismiss-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { Project } from 'types'
import NotificationActions from './NotificationActions'
import { formatNotificationCTAText, formatNotificationText } from './NotificationRows.utils'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

export interface NotificationRowProps {
  notification: Notification
  onSelectRestartProject: (project: Project, notification: Notification) => void
  onSelectApplyMigration: (project: Project, notification: Notification) => void
  onSelectRollbackMigration: (project: Project, notification: Notification) => void
}

const NotificationRow = ({
  notification,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
}: NotificationRowProps) => {
  const { ui } = useStore()
  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const project = projects?.find((project) => project.id === notification.project_id)
  const organization = organizations?.find((org) => org.id === project?.organization_id)

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

  const dismissNotification = async (notificationId: string) => {
    if (!notificationId) return
    dismissNotifications({ ids: [notificationId] })
  }

  if (!project || !organization) return null

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
            <p className="text-foreground-light text-sm !mt-2">{insertedAt}</p>
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
                    className="text-foreground-light group-hover:text-foreground transition"
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
              organization={organization}
              changelogLink={changelogLink}
              availableActions={availableActions}
              onSelectRestartProject={() => onSelectRestartProject(project, notification)}
              onSelectApplyMigration={() => onSelectApplyMigration(project, notification)}
              onSelectRollbackMigration={() => onSelectRollbackMigration(project, notification)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationRow
