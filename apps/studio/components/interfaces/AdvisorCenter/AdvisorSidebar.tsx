import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Gauge, Inbox, Shield, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import LintDetail from 'components/interfaces/Linter/LintDetail'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import {
  Notification,
  NotificationData,
  useNotificationsV2Query,
} from 'data/notifications/notifications-v2-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AdvisorCenterTab,
  AdvisorSeverity,
  advisorCenterState,
  useAdvisorCenterStateSnapshot,
} from 'state/advisor-center-state'
import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'
import { Badge, Button, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_, cn } from 'ui'

type AdvisorCenterItem = {
  id: string
  title: string
  severity: AdvisorSeverity
  createdAt?: number
  tab: Exclude<AdvisorCenterTab, 'all'>
  source: 'lint' | 'notification'
  original: Lint | Notification
}

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
]

const severityOrder: Record<AdvisorSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const severityLabels: Record<AdvisorSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

const severityBadgeVariants: Record<AdvisorSeverity, 'destructive' | 'warning' | 'default'> = {
  critical: 'destructive',
  warning: 'warning',
  info: 'default',
}

const severityColorClasses: Record<AdvisorSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-foreground-light',
}

const tabIconMap: Record<Exclude<AdvisorCenterTab, 'all'>, React.ElementType> = {
  security: Shield,
  performance: Gauge,
  messages: Inbox,
}

const lintLevelToSeverity = (level: Lint['level']): AdvisorSeverity => {
  switch (level) {
    case 'ERROR':
      return 'critical'
    case 'WARN':
      return 'warning'
    default:
      return 'info'
  }
}

const notificationPriorityToSeverity = (priority: Notification['priority']): AdvisorSeverity => {
  switch (priority) {
    case 'Critical':
      return 'critical'
    case 'Warning':
      return 'warning'
    default:
      return 'info'
  }
}

export const AdvisorSidebar = () => {
  const advisorSnap = useAdvisorCenterStateSnapshot()
  const { data: project } = useSelectedProjectQuery()

  const isSidebarOpen = Boolean(advisorSnap.open)

  const {
    data: lintData,
    isLoading: isLintsLoading,
    isRefetching: isLintsRefetching,
  } = useProjectLintsQuery(
    { projectRef: project?.ref },
    { enabled: isSidebarOpen && !!project?.ref }
  )

  const notificationsQuery = useNotificationsV2Query(
    {
      status: undefined,
      filters: { priority: [], organizations: [], projects: [] },
    },
    { enabled: isSidebarOpen }
  )

  const notifications = useMemo(() => {
    const queryNotifications = notificationsQuery.data?.pages.flatMap((page) => page) ?? []

    // Mock changelog notification for testing
    const mockChangelogNotification: Notification = {
      id: 'mock-changelog-001',
      name: 'changelog',
      priority: 'Info',
      status: 'new',
      inserted_at: new Date().toISOString(),
      data: {
        title: 'New Feature: Enhanced Database Monitoring',
        message:
          "We've added new database monitoring capabilities to help you track performance metrics and identify potential issues early. The new monitoring dashboard provides real-time insights into query performance, connection pools, and resource utilization.\n\n**Key improvements:**\n- Real-time query performance tracking\n- Enhanced connection pool monitoring\n- Resource utilization alerts\n- Improved dashboard visualizations\n\n[Learn more about the new monitoring features](https://supabase.com/docs/guides/platform/monitoring)",
        actions: [
          {
            label: 'View Documentation',
            url: 'https://supabase.com/docs/guides/platform/monitoring',
            action_type: 'external_link',
          },
          {
            label: 'Open Monitoring Dashboard',
            action_type: 'navigate_to_monitoring',
          },
        ],
      } as NotificationData,
      meta: {},
    }

    return [mockChangelogNotification, ...queryNotifications]
  }, [notificationsQuery.data])

  const lintItems = useMemo<AdvisorCenterItem[]>(() => {
    if (!lintData) return []

    return lintData
      .map((lint): AdvisorCenterItem | null => {
        const categories = lint.categories || []
        const tab =
          categories.includes('SECURITY') && !categories.includes('PERFORMANCE')
            ? ('security' as const)
            : categories.includes('PERFORMANCE') && !categories.includes('SECURITY')
              ? ('performance' as const)
              : categories.includes('SECURITY')
                ? ('security' as const)
                : categories.includes('PERFORMANCE')
                  ? ('performance' as const)
                  : undefined

        if (!tab) return null

        return {
          id: lint.cache_key,
          title: lint.detail,
          severity: lintLevelToSeverity(lint.level),
          createdAt: undefined,
          tab,
          source: 'lint' as const,
          original: lint,
        }
      })
      .filter((item): item is AdvisorCenterItem => item !== null)
  }, [lintData])

  const notificationItems = useMemo<AdvisorCenterItem[]>(() => {
    return notifications.map((notification) => ({
      id: notification.id,
      title: (notification.data as NotificationData)?.title ?? 'Notification',
      severity: notificationPriorityToSeverity(notification.priority),
      createdAt: notification.inserted_at ? dayjs(notification.inserted_at).valueOf() : undefined,
      tab: 'messages',
      source: 'notification' as const,
      original: notification,
    }))
  }, [notifications])

  const combinedItems = useMemo<AdvisorCenterItem[]>(() => {
    const all = [...lintItems, ...notificationItems]

    return all.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      const createdDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
      if (createdDiff !== 0) return createdDiff

      return a.title.localeCompare(b.title)
    })
  }, [lintItems, notificationItems])

  const filteredItems = useMemo<AdvisorCenterItem[]>(() => {
    return combinedItems.filter((item) => {
      if (
        advisorSnap.severityFilters.length > 0 &&
        !advisorSnap.severityFilters.includes(item.severity)
      ) {
        return false
      }

      if (advisorSnap.activeTab === 'all') return true

      return item.tab === advisorSnap.activeTab
    })
  }, [combinedItems, advisorSnap.severityFilters, advisorSnap.activeTab])

  const itemsFilteredByTabOnly = useMemo<AdvisorCenterItem[]>(() => {
    return combinedItems.filter((item) => {
      if (advisorSnap.activeTab === 'all') return true
      return item.tab === advisorSnap.activeTab
    })
  }, [combinedItems, advisorSnap.activeTab])

  const hiddenItemsCount = itemsFilteredByTabOnly.length - filteredItems.length

  useEffect(() => {
    if (!advisorSnap.open) return

    if (advisorSnap.selectedItemId) {
      const selectedExists = filteredItems.some((item) => item.id === advisorSnap.selectedItemId)
      if (!selectedExists) {
        advisorCenterState.selectItem(undefined)
      }
    } else if (filteredItems.length === 0) {
      advisorCenterState.selectItem(undefined)
    }
  }, [advisorSnap.open, filteredItems, advisorSnap.selectedItemId])

  const selectedItem = filteredItems.find((item) => item.id === advisorSnap.selectedItemId)
  const isDetailView = !!selectedItem

  const isLoading = isLintsLoading || notificationsQuery.isLoading
  const isNotificationsFetching = notificationsQuery.isFetching && !notificationsQuery.isLoading

  const handleTabChange = (tab: string) => {
    advisorCenterState.setActiveTab(tab as AdvisorCenterTab)
  }

  const handleBackToList = () => {
    advisorCenterState.selectItem(undefined)
  }

  const handleClose = () => {
    sidebarManagerState.closeSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {isDetailView ? (
        <>
          <div className="border-b px-4 py-3 flex items-center gap-3">
            <Button
              type="text"
              className="px-2"
              icon={<ChevronLeft size={16} strokeWidth={1.5} />}
              onClick={handleBackToList}
            />
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="flex-1">
                <span className="heading-default">{selectedItem?.title}</span>
                {selectedItem?.source === 'notification' &&
                  selectedItem.original &&
                  'inserted_at' in selectedItem.original && (
                    <p className="text-xs text-foreground-light">
                      {dayjs((selectedItem.original as Notification).inserted_at).format(
                        'MMM D, YYYY HH:mm'
                      )}
                    </p>
                  )}
              </div>
              {selectedItem && (
                <Badge variant={severityBadgeVariants[selectedItem.severity]}>
                  {severityLabels[selectedItem.severity]}
                </Badge>
              )}
            </div>
            <ButtonTooltip
              type="text"
              className="w-7 h-7 p-0"
              icon={<X strokeWidth={1.5} />}
              onClick={handleClose}
              tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedItem ? (
              <AdvisorDetail item={selectedItem} projectRef={project?.ref ?? ''} />
            ) : (
              <div className="px-6 py-8">
                <p className="text-sm text-foreground-light">
                  Select an advisor item to view more details.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="border-b">
            <div className="flex items-center justify-between gap-3 px-4 h-[46px]">
              <Tabs_Shadcn_
                value={advisorSnap.activeTab}
                onValueChange={handleTabChange}
                className="h-full"
              >
                <TabsList_Shadcn_ className="border-b-0 gap-4 h-full">
                  <TabsTrigger_Shadcn_ value="all" className="h-full text-xs">
                    All
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="security" className="h-full text-xs">
                    Security
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="performance" className="h-full text-xs">
                    Performance
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="messages" className="h-full text-xs">
                    Messages
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
              </Tabs_Shadcn_>
              <div className="flex items-center gap-2">
                <FilterPopover
                  name="Severity"
                  options={severityOptions}
                  activeOptions={[...advisorSnap.severityFilters]}
                  valueKey="value"
                  labelKey="label"
                  onSaveFilters={(values) =>
                    advisorCenterState.setSeverityFilters(values as AdvisorSeverity[])
                  }
                />
                <ButtonTooltip
                  type="text"
                  className="w-7 h-7 p-0"
                  icon={<X strokeWidth={1.5} />}
                  onClick={handleClose}
                  tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-4 text-sm text-foreground-light">Loading advisor items…</p>
            ) : filteredItems.length === 0 ? (
              <p className="px-4 py-4 text-sm text-foreground-light">
                No advisor items match your selection.
              </p>
            ) : (
              <>
                <div className="flex flex-col">
                  {filteredItems.map((item) => {
                    const SeverityIcon = tabIconMap[item.tab]
                    const severityClass = severityColorClasses[item.severity]
                    return (
                      <div className="border-b">
                        <Button
                          key={item.id}
                          type="text"
                          className="justify-start w-full block rounded-none h-auto py-3 px-4 text-foreground-light hover:text-foreground"
                          onClick={() => advisorCenterState.selectItem(item.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <SeverityIcon
                                size={16}
                                strokeWidth={1.5}
                                className={cn('flex-shrink-0', severityClass)}
                              />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ChevronRight
                              size={16}
                              strokeWidth={1.5}
                              className="flex-shrink-0 text-foreground-lighter"
                            />
                          </div>
                        </Button>
                      </div>
                    )
                  })}
                </div>
                {advisorSnap.severityFilters.length > 0 && hiddenItemsCount > 0 && (
                  <div className="px-4 py-3">
                    <Button
                      type="text"
                      className="w-full"
                      onClick={() => advisorCenterState.clearSeverityFilters()}
                    >
                      Show {hiddenItemsCount} more issue{hiddenItemsCount !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface AdvisorDetailProps {
  item: AdvisorCenterItem
  projectRef: string
}

const AdvisorDetail = ({ item, projectRef }: AdvisorDetailProps) => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      <div className="px-6 py-6">
        <LintDetail lint={lint} projectRef={projectRef} />
      </div>
    )
  }

  const notification = item.original as Notification
  const data = notification.data as NotificationData

  return (
    <div className="flex h-full flex-col gap-4 px-6 py-6">
      {data?.message && (
        <div>
          <Markdown content={data.message} className="text-sm text-foreground" />
        </div>
      )}
    </div>
  )
}
