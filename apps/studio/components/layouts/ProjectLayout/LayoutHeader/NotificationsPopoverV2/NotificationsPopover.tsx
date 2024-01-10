import clsx from 'clsx'
import { SlidersHorizontal } from 'lucide-react'
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
import { NOTIFICATION_FILTERS, NOTIFICATION_FILTER_TYPE } from './NotificationsPopover.constants'
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 22 20"
                className="w-4 h-4 p-0.5 text-destructive-200 bg-destructive-600 rounded transition-all -mr-3.5 group-hover:-mr-1 z-10"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M8.15137 1.95117C9.30615 -0.0488281 12.1943 -0.0488281 13.3481 1.95117L20.7031 14.6992C21.8574 16.6992 20.4131 19.1992 18.104 19.1992H3.39502C1.08594 19.1992 -0.356933 16.6992 0.797364 14.6992L8.15137 1.95117ZM11.7666 16.0083C11.4971 16.2778 11.1313 16.4292 10.75 16.4292C10.3687 16.4292 10.0029 16.2778 9.7334 16.0083C9.46387 15.7388 9.3125 15.373 9.3125 14.9917C9.3125 14.9307 9.31641 14.8706 9.32373 14.811C9.33545 14.7197 9.35547 14.6304 9.38379 14.5439L9.41406 14.4609C9.48584 14.2803 9.59375 14.1147 9.7334 13.9751C10.0029 13.7056 10.3687 13.5542 10.75 13.5542C11.1313 13.5542 11.4971 13.7056 11.7666 13.9751C12.0361 14.2446 12.1875 14.6104 12.1875 14.9917C12.1875 15.373 12.0361 15.7388 11.7666 16.0083ZM10.75 4.69971C11.0317 4.69971 11.3022 4.81152 11.5015 5.01074C11.7007 5.20996 11.8125 5.48047 11.8125 5.76221V11.0747C11.8125 11.3564 11.7007 11.627 11.5015 11.8262C11.3022 12.0254 11.0317 12.1372 10.75 12.1372C10.4683 12.1372 10.1978 12.0254 9.99854 11.8262C9.79932 11.627 9.6875 11.3564 9.6875 11.0747V5.76221C9.6875 5.48047 9.79932 5.20996 9.99854 5.01074C10.1978 4.81152 10.4683 4.69971 10.75 4.69971Z"
                />
              </svg>
            ) : hasWarning ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 21 20"
                className="w-4 h-4 p-0.5 text-warning-200 bg-warning-600 rounded transition-all -mr-3.5 group-hover:-mr-1 z-10"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M0.625 9.8252C0.625 4.44043 4.99023 0.0751953 10.375 0.0751953C15.7598 0.0751953 20.125 4.44043 20.125 9.8252C20.125 15.21 15.7598 19.5752 10.375 19.5752C4.99023 19.5752 0.625 15.21 0.625 9.8252ZM9.3584 4.38135C9.45117 4.28857 9.55518 4.20996 9.66699 4.14648C9.88086 4.02539 10.1245 3.96045 10.375 3.96045C10.5845 3.96045 10.7896 4.00586 10.9766 4.09229C11.1294 4.1626 11.2705 4.26025 11.3916 4.38135C11.6611 4.65088 11.8125 5.0166 11.8125 5.39795C11.8125 5.5249 11.7959 5.6499 11.7637 5.77002C11.6987 6.01172 11.5718 6.23438 11.3916 6.41455C11.1221 6.68408 10.7563 6.83545 10.375 6.83545C9.99365 6.83545 9.62793 6.68408 9.3584 6.41455C9.08887 6.14502 8.9375 5.7793 8.9375 5.39795C8.9375 5.29492 8.94873 5.19287 8.97021 5.09375C9.02783 4.82568 9.16162 4.57812 9.3584 4.38135ZM10.375 15.6899C10.0933 15.6899 9.82275 15.5781 9.62354 15.3789C9.42432 15.1797 9.3125 14.9092 9.3125 14.6274V9.31494C9.3125 9.0332 9.42432 8.7627 9.62354 8.56348C9.82275 8.36426 10.0933 8.25244 10.375 8.25244C10.6567 8.25244 10.9272 8.36426 11.1265 8.56348C11.3257 8.7627 11.4375 9.0332 11.4375 9.31494V14.6274C11.4375 14.7944 11.3979 14.9575 11.3242 15.104C11.2739 15.2046 11.2075 15.2979 11.1265 15.3789C10.9272 15.5781 10.6567 15.6899 10.375 15.6899Z"
                />
              </svg>
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
                <Button type="text" icon={<SlidersHorizontal size={14} />}>
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
