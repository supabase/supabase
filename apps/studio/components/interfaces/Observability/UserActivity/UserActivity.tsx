import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Badge, Button, ToggleGroup, ToggleGroupItem } from 'ui'
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

  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useUnifiedLogsInfiniteQuery({ projectRef, search }, { enabled: !!selectedUserId })

  const events = useMemo(() => {
    const rows = data?.pages?.flatMap((page) => page.data ?? []) ?? []
    const mapped = rows.map(mapLogRowToActivityEvent)
    return filter === 'errors' ? mapped.filter((event) => isErrorLevel(event.level)) : mapped
  }, [data?.pages, filter])

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center gap-x-2">
          <h1 className="text-xl text-foreground">User Activity</h1>
          <Badge variant="warning">Beta</Badge>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <UserActivitySelector
            projectRef={projectRef}
            connectionString={project?.connectionString}
            value={selectedUserId}
            onChange={setSelectedUserId}
          />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <ToggleGroup
              type="single"
              value={filter}
              variant="outline"
              size="sm"
              onValueChange={(value) => {
                if (value) setFilter(value as UserActivityFilter)
              }}
            >
              <ToggleGroupItem value="all" className="px-2 py-1 h-7 text-xs">
                Show all
              </ToggleGroupItem>
              <ToggleGroupItem value="errors" className="px-2 py-1 h-7 text-xs">
                Errors only
              </ToggleGroupItem>
            </ToggleGroup>

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
      </div>

      {!selectedUserId ? (
        <p className="text-sm text-foreground-light">Select a user to view their activity.</p>
      ) : isLoading ? (
        <GenericSkeletonLoader />
      ) : isError ? (
        <AlertError error={error} subject="Failed to load user activity" />
      ) : (
        <>
          <UserActivityTimeline
            events={events}
            projectRef={projectRef}
            onViewPayload={setPayloadEvent}
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
