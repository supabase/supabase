import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildUserActivitySearch,
  mapLogRowToActivityEvent,
  type UserActivityEvent,
} from './UserActivity.constants'
import { UserActivityEventDetailSheet } from './UserActivityEventDetailSheet'
import { UserActivityTimeline } from './UserActivityTimeline'
import { PANEL_PADDING } from './Users.constants'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { AlertError } from '@/components/ui/AlertError'
import { User } from '@/data/auth/users-infinite-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface UserActivityTabProps {
  user: User
}

export const UserActivityTab = ({ user }: UserActivityTabProps) => {
  const { ref: projectRef } = useParams()

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
        user: user.id!,
        date: [
          new Date(selectedDateRange.period_start.date),
          new Date(selectedDateRange.period_end.date),
        ],
      }),
    [user.id, selectedDateRange]
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
  } = useUnifiedLogsInfiniteQuery({ projectRef, search })

  const events = useMemo(() => {
    const rows = data?.pages?.flatMap((page) => page.data ?? []) ?? []
    return rows.map(mapLogRowToActivityEvent)
  }, [data?.pages])

  return (
    <div className={cn('flex flex-col gap-y-6', PANEL_PADDING)}>
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
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

      {isLoading || isPlaceholderData ? (
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
