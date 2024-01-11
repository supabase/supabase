import clsx from 'clsx'
import { Settings2Icon, SlidersHorizontal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
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
import { useNotificationsV2UpdateMutation } from 'data/notifications/notifications-v2-update-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import NotificationRow from './NotificationRow'
import {
  CriticalIcon,
  NOTIFICATION_FILTERS,
  NOTIFICATION_FILTER_TYPE,
  WarningIcon,
} from './NotificationsPopover.constants'
import { useNotificationsSummaryQuery } from 'data/notifications/notifications-v2-summary-query'

const NotificationsPopverV2 = () => {
  const [open, setOpen] = useState(false)
  const [openFilters, setOpenFilters] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<NOTIFICATION_FILTER_TYPE>('all')
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox')

  // Storing in ref as no re-rendering required
  const markedRead = useRef<string[]>([])

  // [Joshen] Just FYI this variable row heights logic should ideally live in InfiniteList
  // but I ran into some infinite loops issues when I was trying to implement it there
  // so opting to simplify and implement it here for now
  const rowHeights = useRef<{ [key: number]: number }>({})

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
    status: activeTab === 'archived' ? 'archived' : selectedFilter === 'unread' ? 'new' : undefined,
    priority:
      selectedFilter === 'critical'
        ? 'Critical'
        : selectedFilter === 'warning'
        ? 'Warning'
        : undefined,
  })
  const { data: summary } = useNotificationsSummaryQuery()
  const { mutate: updateNotifications } = useNotificationsV2UpdateMutation()

  const notifications = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data?.pages])
  const hasNewNotifications = summary?.unread_count ?? 0 > 0
  const hasWarning = summary?.has_warning
  const hasCritical = summary?.has_critical

  const onSelectFilter = (value: 'all' | 'unread' | 'warning' | 'critical') => {
    setSelectedFilter(value)
    setOpenFilters(false)
  }

  const markNotificationsRead = () => {
    if (markedRead.current.length > 0) {
      updateNotifications({ ids: markedRead.current, status: 'seen' })
    }
  }

  return (
    <Popover_Shadcn_
      modal={false}
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) markNotificationsRead()
      }}
    >
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
              <CriticalIcon className="transition-all -mr-3.5 group-hover:-mr-1 z-10" />
            ) : hasWarning ? (
              <WarningIcon className="transition-all -mr-3.5 group-hover:-mr-1 z-10" />
            ) : hasNewNotifications ? (
              <div
                className={clsx(
                  'transition-all -mr-3 group-hover:-mr-1',
                  'z-10 h-4 flex items-center justify-center rounded-full bg-black dark:bg-white',
                  (summary?.unread_count ?? 0) > 9 ? 'px-0.5 w-auto' : 'w-4'
                )}
              >
                <p className="text-xs text-background-alternative">{summary?.unread_count}</p>
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
      <PopoverContent_Shadcn_ className="p-0 w-[450px] overflow-hidden" side="bottom" align="end">
        <div className="px-4">
          <p className="pt-4 pb-1 text-sm">Notifications</p>
          <div className="flex items-center">
            <Tabs
              size="medium"
              type="underlined"
              baseClassNames="!space-y-0"
              listClassNames="[&>button>span]:text-xs"
              activeId={activeTab}
              onChange={(tab: 'inbox' | 'archived') => {
                setActiveTab(tab)
              }}
            >
              <Tabs.Panel
                id="inbox"
                label="Inbox"
                iconRight={
                  <div
                    className={clsx([
                      'flex items-center justify-center text-xs rounded-full bg-surface-300 h-4',
                      (summary?.unread_count ?? 0) > 9 ? 'px-0.5 w-auto' : 'w-4',
                    ])}
                  >
                    {summary?.unread_count}
                  </div>
                }
              />
              <Tabs.Panel id="archived" label="Archived" />
            </Tabs>
            <Popover_Shadcn_ modal={false} open={openFilters} onOpenChange={setOpenFilters}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="text" icon={<Settings2Icon size={14} />}>
                  View {selectedFilter}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="p-0 w-52" side="bottom" align="end">
                <Command_Shadcn_>
                  <CommandList_Shadcn_>
                    <CommandGroup_Shadcn_>
                      {NOTIFICATION_FILTERS.map((filter) => (
                        <CommandItem_Shadcn_
                          key={filter.id}
                          className="cursor-pointer flex items-center justify-between"
                          onSelect={() => onSelectFilter(filter.id)}
                          onClick={() => onSelectFilter(filter.id)}
                        >
                          <p>{filter.label}</p>
                          {selectedFilter === filter.id && <IconCheck />}
                        </CommandItem_Shadcn_>
                      ))}
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
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
              {notifications.length > 0 &&
              !(activeTab === 'archived' && selectedFilter === 'unread') ? (
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
                    getProject: (ref: string) => projects?.find((project) => project.ref === ref),
                    getOrganization: (id: number) => organizations?.find((org) => org.id === id),
                    onArchiveNotification: (id: string) =>
                      updateNotifications({ ids: [id], status: 'archived' }),
                    queueMarkRead: (id: string) => {
                      if (markedRead.current && !markedRead.current.includes(id)) {
                        markedRead.current.push(id)
                      }
                    },
                  }}
                  getItemSize={(idx: number) => rowHeights?.current?.[idx] ?? 56}
                  hasNextPage={hasNextPage}
                  isLoadingNextPage={isFetchingNextPage}
                  onLoadNextPage={() => fetchNextPage()}
                />
              ) : (
                <div className="flex flex-col gap-y-4 items-center flex-grow justify-center">
                  <IconInbox size={32} className="text-foreground-light" />
                  <div className="flex flex-col gap-y-1">
                    <p className="text-foreground-light text-sm w-64 text-center">
                      {activeTab === 'archived'
                        ? `No archived ${
                            ['warning', 'critical'].includes(selectedFilter)
                              ? `${selectedFilter} `
                              : ''
                          }notifications`
                        : 'All caught up'}
                    </p>
                    <p className="text-foreground-lighter text-xs w-64 text-center">
                      {activeTab === 'archived'
                        ? 'Notifications that you have previously archived will be shown here'
                        : 'You will be notified here for any notices on your organizations and projects'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default NotificationsPopverV2
