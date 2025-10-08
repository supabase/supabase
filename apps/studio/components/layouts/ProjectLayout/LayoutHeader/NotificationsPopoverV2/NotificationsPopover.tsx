import { ArchiveIcon, InboxIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import InfiniteList from 'components/ui/InfiniteList'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useNotificationsArchiveAllMutation } from 'data/notifications/notifications-v2-archive-all-mutation'
import { useNotificationsV2Query } from 'data/notifications/notifications-v2-query'
import { useNotificationsSummaryQuery } from 'data/notifications/notifications-v2-summary-query'
import { useNotificationsV2UpdateMutation } from 'data/notifications/notifications-v2-update-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useNotificationsStateSnapshot } from 'state/notifications'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import NotificationRow from './NotificationRow'
import { NotificationsFilter } from './NotificationsFilter'

export const NotificationsPopoverV2 = () => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox')

  const snap = useNotificationsStateSnapshot()

  // Storing in ref as no re-rendering required
  const markedRead = useRef<string[]>([])

  // [Joshen] Just FYI this variable row heights logic should ideally live in InfiniteList
  // but I ran into some infinite loops issues when I was trying to implement it there
  // so opting to simplify and implement it here for now
  const rowHeights = useRef<{ [key: number]: number }>({})

  const { data: organizations } = useOrganizationsQuery({ enabled: open })
  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsV2Query(
    {
      status:
        activeTab === 'archived'
          ? 'archived'
          : snap.filterStatuses.includes('unread')
            ? 'new'
            : undefined,
      filters: {
        priority: snap.filterPriorities,
        organizations: snap.filterOrganizations,
        projects: snap.filterProjects,
      },
    },
    { enabled: open }
  )
  const { data: summary } = useNotificationsSummaryQuery()
  const { mutate: updateNotifications } = useNotificationsV2UpdateMutation()
  const { mutate: archiveAllNotifications, isLoading: isArchiving } =
    useNotificationsArchiveAllMutation({
      onSuccess: () => toast.success('Successfully archived all notifications'),
    })

  const notifications = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data?.pages])
  const hasNewNotifications = summary?.unread_count ?? 0 > 0
  const hasWarning = summary?.has_warning
  const hasCritical = summary?.has_critical

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
        <ButtonTooltip
          tooltip={{
            content: {
              text: 'Notifications',
            },
          }}
          type="text"
          className={cn('rounded-none h-[30px] w-[32px] group relative')}
          icon={
            <div className="relative">
              <InboxIcon
                size={18}
                strokeWidth={1.5}
                className={cn(
                  '!h-[18px] !w-[18px] text-foreground-light group-hover:text-foreground'
                )}
              />
              {hasCritical && (
                <div className="absolute -top-1 -right-2 w-3.5 h-3.5 z-10 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-destructive" />
                </div>
              )}
              {hasWarning && !hasCritical && (
                <div className="absolute -top-1 -right-2 w-3.5 h-3.5 z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                </div>
              )}
              {!!hasNewNotifications && !hasCritical && !hasWarning && (
                <div className="absolute -top-1 -right-2 w-3.5 h-3.5 z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-brand" />
                </div>
              )}
            </div>
          }
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="p-0 w-screen md:w-[450px] overflow-hidden"
        side="bottom"
        align="end"
      >
        <div className="px-4">
          <p className="pt-4 pb-1 text-sm">Notifications</p>
          <div className="flex items-center">
            <Tabs_Shadcn_
              className="w-full"
              onValueChange={(tab: string) => {
                setActiveTab(tab as 'inbox' | 'archived')
                if (tab === 'archived' && snap.filterStatuses.includes('unread')) {
                  snap.setFilters('unread', 'status')
                }
              }}
              value={activeTab}
            >
              <div className="flex items-center">
                <TabsList_Shadcn_ className="flex gap-5 grow border-none">
                  <TabsTrigger_Shadcn_
                    id="inbox"
                    value="inbox"
                    className="px-0 data-[state=active]:bg-transparent flex gap-2"
                  >
                    Inbox
                    <div
                      className={cn(
                        'flex items-center justify-center text-xs rounded-full bg-surface-300 h-4',
                        (summary?.unread_count ?? 0) > 9 ? 'px-0.5 w-auto' : 'w-4'
                      )}
                    >
                      {summary?.unread_count}
                    </div>
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_
                    id="archived"
                    value="archived"
                    className="px-0 data-[state=active]:bg-transparent"
                  >
                    Archived
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <NotificationsFilter activeTab={activeTab} />
              </div>
            </Tabs_Shadcn_>
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
            <div className="flex flex-1 h-[400px] bg-background">
              {notifications.length > 0 &&
              !(activeTab === 'archived' && snap.filterStatuses.includes('unread')) ? (
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
                    getOrganizationById: (id: number) =>
                      organizations?.find((org) => org.id === id)!,
                    getOrganizationBySlug: (slug: string) =>
                      organizations?.find((org) => org.slug === slug)!,
                    onUpdateNotificationStatus: (id: string, status: 'archived' | 'seen') => {
                      updateNotifications({ ids: [id], status })
                    },
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
                  <InboxIcon size={32} className="text-foreground-light" />
                  <div className="flex flex-col gap-y-1">
                    <p className="text-foreground-light text-sm mx-auto text-center">
                      {activeTab === 'archived'
                        ? `No archived notifications${
                            snap.numFiltersApplied > 0
                              ? ` based on the ${snap.numFiltersApplied} filter${
                                  snap.numFiltersApplied > 1 ? 's' : ''
                                } applied`
                              : ''
                          }`
                        : snap.numFiltersApplied > 0
                          ? `No notifications based on the ${snap.numFiltersApplied} filter${
                              snap.numFiltersApplied > 1 ? 's' : ''
                            } applied`
                          : 'All caught up'}
                    </p>
                    <p className="text-foreground-lighter text-xs w-60 mx-auto text-center">
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
        {notifications.length > 0 && activeTab === 'inbox' && (
          <div className="flex items-center justify-center p-1.5 border-t">
            <Button
              disabled={isArchiving}
              loading={isArchiving}
              type="text"
              icon={<ArchiveIcon />}
              onClick={() => archiveAllNotifications()}
            >
              Archive all
            </Button>
          </div>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
