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

const NotificationsPopverV2 = () => {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'archived' | 'new'>()
  const [activeTab, setActiveTab] = useState<'inbox' | 'archive'>('inbox')

  const { data: projects } = useProjectsQuery()
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

  const MOCK_NOTIFICATIONS = [
    {
      id: 'f87746f9-4ccf-4a7b-9242-93f70b9aa373',
      inserted_at: '2023-11-16T08:23:39.688501+00:00',
      type: 'project.informational',
      status: 'new',
      priority: 'Warning',
      name: 'deprecation.pgbouncer.20231016',
      data: {
        project_id: 1,
        title: 'Database size limit approaching',
        message:
          'Using beyond 500MB in Database Size requires you to upgrade your subscription plan to at least Pro, otherwise your projects may experience downtime.',
        actions: [
          {
            url: 'https://github.com/orgs/supabase/discussions/17817',
            label: 'Learn More',
          },
        ],
      },
      meta: null,
    },
    {
      id: 'f87746f9-4ccf-4a7b-9242-93f70b9aa374',
      inserted_at: '2023-11-16T08:23:39.688501+00:00',
      type: 'project.informational',
      status: 'new',
      priority: 'Info',
      name: 'deprecation.pgbouncer.20231016',
      data: {
        title: 'Supavisor is now enabled',
        message:
          'Supavisor, our new connection pooler, is now enabled for your projects (Postgres 13 and above). PgBouncer and direct access via IPv4 addresses are deprecated and will be disabled on January 15th, 2024.',
        linked_buttons: [
          {
            url: 'https://github.com/orgs/supabase/discussions/17817',
            text: 'Learn More',
          },
        ],
      },
      meta: null,
    },
  ]

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
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="end">
        <div className="px-4">
          <p className="pt-4 pb-2 text-sm">Notifications</p>
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
            MOCK_NOTIFICATIONS.map((notification) => {
              const { data } = notification
              const project =
                data.project_id !== undefined
                  ? projects?.find((project) => project.id === data.project_id)
                  : undefined

              return (
                <NotificationRow
                  key={notification.id}
                  data={data as NotificationData}
                  priority={notification.priority as any}
                  project={project}
                />
              )
            })}
          {activeTab === 'archive' &&
            MOCK_NOTIFICATIONS.map((notification) => {
              return (
                <NotificationRow
                  key={notification.id}
                  priority={notification.priority as any}
                  data={notification.data as NotificationData}
                />
              )
            })}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default NotificationsPopverV2
