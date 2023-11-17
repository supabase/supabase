import clsx from 'clsx'
import { useMemo, useRef, useState } from 'react'
import {
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconInbox,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Tabs,
} from 'ui'

import AlertError from 'components/ui/AlertError'
import InfiniteList from 'components/ui/InfiniteList'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useNotificationsV2Query } from 'data/notifications/notifications-v2-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { SlidersHorizontal } from 'lucide-react'
import NotificationRow from './NotificationRow'

const NotificationsPopverV2 = () => {
  const rowHeights = useRef<{ [key: number]: number }>({})
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'inbox' | 'archive'>('inbox')

  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsV2Query({
    archived: activeTab === 'archive',
  })
  // const notifications = data ?? []
  const notifications = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data?.pages])

  // This probably needs to be fixed cause we won't be able to check the number if its paginated
  const newNotifications = notifications.filter((notification) => notification.status === 'new')
  const hasNewNotifications = newNotifications.length > 0
  const hasWarning = true // newNotifications.some((notification) => notification.priority === 'Warning')
  const hasCritical = false // newNotifications.some((notification) => notification.priority === 'Critical')

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
              <IconAlertTriangle
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
      <PopoverContent_Shadcn_ className="p-0 w-[400px] overflow-hidden" side="bottom" align="end">
        <div className="px-4">
          <p className="pt-4 pb-1 text-sm">Notifications</p>
          <div className="flex items-center">
            <Tabs
              size="medium"
              type="underlined"
              baseClassNames="!space-y-0"
              listClassNames="[&>button>span]:text-xs"
              activeId={activeTab}
              onChange={(tab: any) => {
                setActiveTab(tab)
              }}
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
              <Tabs.Panel id="archive" label="Archived" />
            </Tabs>
            <Button type="text" icon={<SlidersHorizontal size={14} />} className="px-1" />
          </div>
        </div>
        <div className="border-t">
          {isLoading && (
            <div className="p-4">
              <GenericSkeletonLoader />
            </div>
          )}
          {isError && (
            <div className="p-4">
              <AlertError subject="Failed to retrieve notifications" error={error} />
            </div>
          )}
          {isSuccess && (
            <div className="flex flex-1 h-[400px]">
              <InfiniteList
                items={notifications}
                ItemComponent={NotificationRow}
                LoaderComponent={
                  <div className="p-4">
                    <ShimmeringLoader />
                  </div>
                }
                itemProps={{
                  setRowHeight: (idx: number, height: number) => {
                    if (rowHeights.current) {
                      rowHeights.current = { ...rowHeights.current, [idx]: height }
                    }
                  },
                  getProject: (id: number) => projects?.find((project) => project.id === id),
                  getOrganization: (id: number) => organizations?.find((org) => org.id === id),
                }}
                getItemSize={(idx: number) => rowHeights?.current?.[idx] ?? 56}
                hasNextPage={hasNextPage}
                isLoadingNextPage={isFetchingNextPage}
                onLoadNextPage={() => fetchNextPage()}
              />
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default NotificationsPopverV2
