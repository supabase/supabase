import { useMemo, useRef } from 'react'

import { AdvisorDetail } from './AdvisorDetail'
import { AdvisorFilters } from './AdvisorFilters'
import type { AdvisorItem } from './AdvisorPanel.types'
import {
  createAdvisorLintItems,
  createAdvisorNotificationItems,
  sortAdvisorItems,
} from './AdvisorPanel.utils'
import { AdvisorPanelBody } from './AdvisorPanelBody'
import { AdvisorPanelHeader } from './AdvisorPanelHeader'
import { useAdvisorSignals } from './useAdvisorSignals'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { Notification, useNotificationsV2Query } from '@/data/notifications/notifications-v2-query'
import { useNotificationsV2UpdateMutation } from '@/data/notifications/notifications-v2-update-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { AdvisorTab, useAdvisorStateSnapshot } from '@/state/advisor-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const AdvisorPanel = () => {
  const track = useTrack()
  const {
    activeTab,
    severityFilters,
    selectedItemId,
    selectedItemSource,
    setActiveTab,
    setSeverityFilters,
    clearSeverityFilters,
    setSelectedItem,
    notificationFilterStatuses,
    notificationFilterPriorities,
    setNotificationFilters,
    resetNotificationFilters,
  } = useAdvisorStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { activeSidebar, closeSidebar } = useSidebarManagerSnapshot()

  const isSidebarOpen = activeSidebar?.id === SIDEBAR_KEYS.ADVISOR_PANEL
  const markedRead = useRef<string[]>([])
  const hasProjectRef = !!project?.ref
  const shouldLoadProjectAdvisorData = isSidebarOpen && hasProjectRef && activeTab !== 'messages'

  const {
    data: lintData,
    isPending: isLintsLoading,
    isError: isLintsError,
  } = useProjectLintsQuery({ projectRef: project?.ref }, { enabled: shouldLoadProjectAdvisorData })

  const { data: signalItems } = useAdvisorSignals({
    projectRef: project?.ref,
    enabled: shouldLoadProjectAdvisorData,
  })

  // Notifications should always load when sidebar is open (shown in both 'all' and 'messages' tabs)
  const shouldLoadNotifications = isSidebarOpen && IS_PLATFORM

  const notificationStatus = useMemo(() => {
    if (notificationFilterStatuses.includes('archived')) {
      return 'archived'
    }
    if (notificationFilterStatuses.includes('unread')) {
      return 'new'
    }
    return undefined
  }, [notificationFilterStatuses])

  // Memoize filters to prevent query key changes on every render
  // Use selected organization and project if they exist
  const notificationFilters = useMemo(
    () => ({ priority: notificationFilterPriorities }),
    [notificationFilterPriorities]
  )

  const {
    data: notificationsData,
    isPending: isNotificationsLoading,
    isError: isNotificationsError,
  } = useNotificationsV2Query(
    {
      status: notificationStatus,
      filters: notificationFilters,
      limit: 20,
    },
    { enabled: shouldLoadNotifications }
  )

  const { mutate: updateNotifications } = useNotificationsV2UpdateMutation()

  const notifications = useMemo(() => {
    return notificationsData?.pages.flatMap((page) => page) ?? []
  }, [notificationsData?.pages])

  const markNotificationsRead = () => {
    if (markedRead.current.length > 0) {
      updateNotifications({ ids: markedRead.current, status: 'seen' })
    }
  }

  const lintItems = useMemo<AdvisorItem[]>(() => {
    return createAdvisorLintItems(lintData ?? [])
  }, [lintData])

  const notificationItems = useMemo<AdvisorItem[]>(() => {
    if (!IS_PLATFORM) return []
    return createAdvisorNotificationItems(notifications)
  }, [notifications])

  const combinedItems = useMemo<AdvisorItem[]>(() => {
    return sortAdvisorItems([...lintItems, ...signalItems, ...notificationItems])
  }, [lintItems, signalItems, notificationItems])

  const filteredItems = useMemo<AdvisorItem[]>(() => {
    return combinedItems.filter((item) => {
      // Filter by severity
      if (severityFilters.length > 0 && !severityFilters.includes(item.severity)) {
        return false
      }

      // Filter by tab
      if (activeTab === 'all') {
        // When no projectRef, only show notifications in 'all' tab
        if (!hasProjectRef && item.source !== 'notification') {
          return false
        }
        return true
      }

      return item.tab === activeTab
    })
  }, [combinedItems, severityFilters, activeTab, hasProjectRef])

  const itemsFilteredByTabOnly = useMemo<AdvisorItem[]>(() => {
    return combinedItems.filter((item) => {
      if (activeTab === 'all') {
        // When no projectRef, only show notifications in 'all' tab
        if (!hasProjectRef && item.source !== 'notification') {
          return false
        }
        return true
      }
      return item.tab === activeTab
    })
  }, [combinedItems, activeTab, hasProjectRef])

  const hiddenItemsCount = itemsFilteredByTabOnly.length - filteredItems.length

  const selectedItem = combinedItems.find(
    (item) => item.id === selectedItemId && item.source === selectedItemSource
  )
  const isDetailView = !!selectedItem

  // Only show loading state if the query is actually enabled
  const isLintsActuallyLoading = shouldLoadProjectAdvisorData && isLintsLoading
  const isNotificationsActuallyLoading = shouldLoadNotifications && isNotificationsLoading

  // [Joshen] Opting to ignore loading and error state of advisor signals - render lints irregardless of banned ips
  const isLoading = isLintsActuallyLoading || isNotificationsActuallyLoading
  const isError = isLintsError || isNotificationsError

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AdvisorTab)
    setSelectedItem(undefined)
  }

  const handleBackToList = () => {
    setSelectedItem(undefined)
    markNotificationsRead()
  }

  const handleClose = () => {
    markNotificationsRead()
    closeSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
  }

  const handleItemClick = (item: AdvisorItem) => {
    setSelectedItem(item.id, item.source)

    if (item.source === 'notification') {
      const notification = item.original as Notification
      if (notification.status === 'new' && !markedRead.current.includes(notification.id)) {
        markedRead.current.push(notification.id)
      }
    }

    const advisorCategory =
      item.source === 'lint'
        ? item.original.categories.includes('SECURITY')
          ? 'SECURITY'
          : item.original.categories.includes('PERFORMANCE')
            ? 'PERFORMANCE'
            : undefined
        : item.source === 'signal'
          ? 'SECURITY'
          : undefined
    const advisorType =
      item.source === 'signal'
        ? item.type
        : item.source === 'lint'
          ? item.original.name
          : item.title
    const advisorLevel = item.source === 'lint' ? item.original.level : undefined

    track('advisor_detail_opened', {
      origin: 'advisor_panel',
      advisorCategory,
      advisorSource: item.source,
      advisorType,
      advisorLevel,
    })
  }

  const handleUpdateNotificationStatus = (id: string, status: 'archived' | 'seen') => {
    updateNotifications({ ids: [id], status })
  }

  const handleClearAllFilters = () => {
    clearSeverityFilters()
    resetNotificationFilters()
  }

  const hasAnyFilters = severityFilters.length > 0 || notificationFilterStatuses.length > 0

  return (
    <div className="flex h-full flex-col bg-background">
      {isDetailView ? (
        <>
          <AdvisorPanelHeader
            selectedItem={selectedItem}
            onBack={handleBackToList}
            onClose={handleClose}
          />
          <div className="flex-1 overflow-y-auto">
            {selectedItem ? (
              <AdvisorDetail
                item={selectedItem}
                projectRef={project?.ref ?? ''}
                onUpdateNotificationStatus={handleUpdateNotificationStatus}
                onAfterLintAction={handleBackToList}
              />
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
          <AdvisorFilters
            activeTab={activeTab}
            onTabChange={handleTabChange}
            severityFilters={[...severityFilters]}
            onSeverityFiltersChange={setSeverityFilters}
            statusFilters={[...notificationFilterStatuses]}
            onStatusFiltersChange={(values) => {
              notificationFilterStatuses
                .filter((status) => !values.includes(status))
                .forEach((status) => setNotificationFilters(status, 'status'))
              values
                .filter((status) => !notificationFilterStatuses.includes(status))
                .forEach((status) => setNotificationFilters(status, 'status'))
            }}
            onClose={handleClose}
            isPlatform={IS_PLATFORM}
          />
          <div className="flex-1 overflow-y-auto">
            <AdvisorPanelBody
              isLoading={isLoading}
              isError={isError}
              filteredItems={filteredItems}
              activeTab={activeTab}
              severityFilters={[...severityFilters]}
              onItemClick={handleItemClick}
              onClearFilters={handleClearAllFilters}
              hiddenItemsCount={hiddenItemsCount}
              hasAnyFilters={hasAnyFilters}
              hasProjectRef={hasProjectRef}
            />
          </div>
        </>
      )}
    </div>
  )
}
