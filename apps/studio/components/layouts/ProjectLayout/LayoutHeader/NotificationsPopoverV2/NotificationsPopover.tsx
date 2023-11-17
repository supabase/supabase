import clsx from 'clsx'
import { useState } from 'react'
import {
  Button,
  IconAlertCircle,
  IconInbox,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Tabs,
} from 'ui'

import {
  NotificationData,
  useNotificationsV2Query,
} from 'data/notifications/notifications-v2-query'
import { SlidersHorizontal } from 'lucide-react'
import NotificationRow from './NotificationRow'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

const NotificationsPopverV2 = () => {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'archived' | 'new'>()
  const [activeTab, setActiveTab] = useState<'inbox' | 'archive'>('inbox')

  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data, error, isLoading, isError, isSuccess } = useNotificationsV2Query({
    archived: false,
    offset: 0,
    limit: 10,
  })
  const notifications = data ?? []

  // This probably needs to be fixed cause we won't be able to check the number if its paginated
  const newNotifications = notifications.filter((notification) => notification.status === 'new')
  const hasNewNotifications = newNotifications.length > 0
  const hasWarning = true // newNotifications.some((notification) => notification.priority === 'Warning')
  const hasCritical = false // newNotifications.some((notification) => notification.priority === 'Critical')

  console.log({ projects, notifications })

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={hasNewNotifications ? 'outline' : 'text'}
          className={clsx(
            'group',
            hasNewNotifications ? 'rounded-full px-1.5' : 'px-1',
            hasCritical
              ? 'border-destructive-500 hover:border-destructive-600 hover:bg-destructive-300'
              : hasWarning
              ? 'border-warning-500 hover:border-warning-600 hover:bg-warning-300'
              : ''
          )}
          icon={
            hasCritical ? (
              <IconAlertCircle
                size={16}
                strokeWidth={3}
                className={clsx(
                  'transition-all -mr-3 group-hover:-mr-1',
                  'z-10 rounded p-0.5 text-destructive-400 bg-destructive-600'
                )}
              />
            ) : hasWarning ? (
              <IconAlertCircle
                size={16}
                strokeWidth={3}
                className={clsx(
                  'transition-all -mr-3 group-hover:-mr-1',
                  'z-10 rounded p-0.5 text-warning-400 bg-warning-600'
                )}
              />
            ) : hasNewNotifications ? (
              <div
                className={clsx(
                  'transition-all -mr-3 group-hover:-mr-1',
                  'z-10 h-4 w-4 flex items-center justify-center rounded-full bg-black dark:bg-white'
                )}
              >
                <p className="text-xs text-background-alternative">{newNotifications.length}</p>
              </div>
            ) : null
          }
          iconRight={
            <IconInbox
              size={18}
              strokeWidth={1.5}
              className="transition group-hover:text-foreground text-foreground-light"
            />
          }
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-[400px]" side="bottom" align="end">
        <div className="px-4">
          <p className="pt-4 pb-1 text-sm">Notifications</p>
          <div className="flex items-center">
            <Tabs
              size="medium"
              type="underlined"
              baseClassNames="!space-y-0"
              listClassNames="[&>button>span]:text-xs"
              activeId={activeTab}
              onChange={setActiveTab}
            >
              <Tabs.Panel
                id="inbox"
                label="Inbox"
                iconRight={
                  <div className="flex items-center justify-center text-xs rounded-full bg-surface-300 w-4 h-4">
                    {newNotifications.length}
                  </div>
                }
              />
              <Tabs.Panel id="archive" label="Archive" />
            </Tabs>
            <Button type="text" icon={<SlidersHorizontal size={14} />} className="px-1" />
          </div>
        </div>
        <div className="border-t divide-y">
          {activeTab === 'inbox' &&
            notifications.map((notification) => {
              const { data } = notification
              const project =
                data.project_id !== undefined
                  ? projects?.find((project) => project.id === data.project_id)
                  : undefined
              const organization =
                organizations?.find(
                  (organization) => organization.id === project?.organization_id
                ) ?? undefined

              return (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  project={project}
                  organization={organization}
                />
              )
            })}
          {activeTab === 'archive' &&
            notifications.map((notification) => {
              return <NotificationRow key={notification.id} notification={notification} />
            })}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default NotificationsPopverV2
