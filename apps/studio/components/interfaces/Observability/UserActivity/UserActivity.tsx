import { useParams } from 'common'
import { UserSearch } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Badge, Button, cn } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildUserActivitySearch,
  isErrorLevel,
  mapLogRowToActivityEvent,
  type UserActivityEvent,
} from './UserActivity.constants'
import { UserActivityEventDetailSheet } from './UserActivityEventDetailSheet'
import { UserActivitySelector } from './UserActivitySelector'
import { UserActivityTimeline } from './UserActivityTimeline'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { AlertError } from '@/components/ui/AlertError'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

type UserActivityFilter = 'all' | 'errors'

export const UserActivity = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedUserId, setSelectedUserId] = useQueryState('user', parseAsString)
  const [filter, setFilter] = useState<UserActivityFilter>('all')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [payloadEvent, setPayloadEvent] = useState<UserActivityEvent | null>(null)

  const {
    selectedDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const search = useMemo(
    () =>
      buildUserActivitySearch({
        user: selectedUserId ?? '',
        date: [
          new Date(selectedDateRange.period_start.date),
          new Date(selectedDateRange.period_end.date),
        ],
      }),
    [selectedUserId, selectedDateRange]
  )

  const {
    data,
    isLoading,
    isPlaceholderData,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUnifiedLogsInfiniteQuery({ projectRef, search }, { enabled: !!selectedUserId })

  const events = useMemo(() => {
    const rows = data?.pages?.flatMap((page) => page.data ?? []) ?? []
    const mapped = rows.map(mapLogRowToActivityEvent)
    return filter === 'errors' ? mapped.filter((event) => isErrorLevel(event.level)) : mapped
  }, [data?.pages, filter])

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-x-2">
            <h1 className="text-xl text-foreground">User Activity</h1>
            <Badge variant="warning">Beta</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
          <UserActivitySelector
            projectRef={projectRef}
            connectionString={project?.connectionString}
            value={selectedUserId}
            onChange={setSelectedUserId}
          />
          <div className="flex items-center border border-strong rounded-full w-min h-7">
            <button
              tabIndex={0}
              className={cn(
                'text-xs w-[80px] h-full text-center rounded-l-full flex items-center justify-center transition',
                filter === 'all'
                  ? 'bg-overlay-hover text-foreground'
                  : 'hover:bg-surface-200 text-foreground-light'
              )}
              onClick={() => setFilter('all')}
            >
              All events
            </button>
            <div className="h-full w-px border-r border-strong" />
            <button
              tabIndex={0}
              className={cn(
                'text-xs w-[90px] h-full text-center rounded-r-full flex items-center justify-center transition',
                filter === 'errors'
                  ? 'bg-overlay-hover text-foreground'
                  : 'hover:bg-surface-200 text-foreground-light'
              )}
              onClick={() => setFilter('errors')}
            >
              Errors only
            </button>
          </div>

          <LogsDatePicker
            onSubmit={handleDatePickerChange}
            value={datePickerValue}
            helpers={datePickerHelpers}
            open={showDatePicker}
            onOpenChange={setShowDatePicker}
            shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
          />
          <UpgradePrompt
            show={showUpgradePrompt}
            setShowUpgradePrompt={setShowUpgradePrompt}
            title="Report date range"
            description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
            source="userActivityDateRange"
          />
        </div>
      </div>

      {!selectedUserId ? (
        <EmptyStatePresentational
          icon={UserSearch}
          title="Select a user"
          description="Choose a user from the dropdown above to view their activity."
        />
      ) : isLoading || isPlaceholderData ? (
        <GenericSkeletonLoader />
      ) : isError ? (
        <AlertError error={error} subject="Failed to load user activity" />
      ) : (
        <>
          <UserActivityTimeline
            events={events}
            projectRef={projectRef}
            onViewPayload={setPayloadEvent}
            dateRangeStart={selectedDateRange.period_start.date}
            dateRangeEnd={selectedDateRange.period_end.date}
          />
          {hasNextPage && (
            <Button
              variant="outline"
              size="tiny"
              className="self-center"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load more
            </Button>
          )}
        </>
      )}

      <UserActivityEventDetailSheet event={payloadEvent} onClose={() => setPayloadEvent(null)} />
    </div>
  )
}
