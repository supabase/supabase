import { AlertTriangle, ChevronRight, Gauge, Inbox, Shield } from 'lucide-react'

import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { EmptyAdvisor } from './EmptyAdvisor'
import { AdvisorItem } from './AdvisorPanelHeader'
import { Notification } from 'data/notifications/notifications-v2-query'
import { AdvisorSeverity, AdvisorTab } from 'state/advisor-state'
import { cn } from 'ui'

const NoProjectNotice = () => {
  return (
    <div className="absolute top-28 px-6 flex flex-col items-center justify-center w-full gap-y-2">
      <Inbox className="text-foreground-muted" strokeWidth={1} />
      <div className="text-center">
        <p className="heading-default">Project required</p>
        <p className="text-foreground-light text-sm">
          Select a project to view security and performance advisories
        </p>
      </div>
    </div>
  )
}

const tabIconMap: Record<Exclude<AdvisorTab, 'all'>, React.ElementType> = {
  security: Shield,
  performance: Gauge,
  messages: Inbox,
}

const severityColorClasses: Record<AdvisorSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-foreground-light',
}

interface AdvisorPanelBodyProps {
  isLoading: boolean
  isError: boolean
  filteredItems: AdvisorItem[]
  activeTab: AdvisorTab
  severityFilters: AdvisorSeverity[]
  onItemClick: (item: AdvisorItem) => void
  onClearFilters: () => void
  hiddenItemsCount: number
  hasAnyFilters: boolean
  hasProjectRef?: boolean
}

export const AdvisorPanelBody = ({
  isLoading,
  isError,
  filteredItems,
  activeTab,
  severityFilters,
  onItemClick,
  onClearFilters,
  hiddenItemsCount,
  hasAnyFilters,
  hasProjectRef = true,
}: AdvisorPanelBodyProps) => {
  // Show notice if no project ref and trying to view project-specific tabs
  if (!hasProjectRef && activeTab !== 'messages') {
    return <NoProjectNotice />
  }

  if (isLoading) {
    return (
      <div>
        <GenericSkeletonLoader className="w-full p-4" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="my-8 mx-4 flex flex-col items-center gap-2">
        <AlertTriangle className="text-destructive" />
        <h2 className="text-base text-foreground-light">Error loading advisories</h2>
        <p className="text-sm text-foreground-lighter">Please try again later.</p>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <EmptyAdvisor
        activeTab={activeTab}
        hasFilters={hasAnyFilters}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <>
      <div className="flex flex-col">
        {filteredItems.map((item) => {
          const SeverityIcon = tabIconMap[item.tab]
          const severityClass = severityColorClasses[item.severity]
          const isNotification = item.source === 'notification'
          const notification = isNotification ? (item.original as Notification) : null
          const isUnread = notification?.status === 'new'

          return (
            <div key={`${item.source}-${item.id}`} className="border-b">
              <Button
                type="text"
                className={cn(
                  'justify-start w-full block rounded-none h-auto py-3 px-4 text-foreground-light hover:text-foreground',
                  isUnread && 'bg-surface-100/50'
                )}
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <SeverityIcon
                      size={16}
                      strokeWidth={1.5}
                      className={cn('flex-shrink-0', severityClass)}
                    />
                    <span className="truncate">{item.title.replace(/[`\\]/g, '')}</span>
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
      {severityFilters.length > 0 && hiddenItemsCount > 0 && (
        <div className="px-4 py-3">
          <Button type="text" className="w-full" onClick={onClearFilters}>
            Show {hiddenItemsCount} more issue{hiddenItemsCount !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </>
  )
}
