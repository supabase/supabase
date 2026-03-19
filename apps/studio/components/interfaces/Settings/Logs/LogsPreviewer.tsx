import { useParams } from 'common'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import dayjs from 'dayjs'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { useSelectedLog } from 'hooks/analytics/useSelectedLog'
import useSingleLog from 'hooks/analytics/useSingleLog'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { Rewind } from 'lucide-react'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Button } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import {
  LOG_ROUTES_WITH_REPLICA_SUPPORT,
  LOGS_TABLES,
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
} from './Logs.constants'
import { DatePickerValue } from './Logs.DatePickers'
import type { Filters, LogSearchCallback, LogTemplate, QueryType } from './Logs.types'
import { maybeShowUpgradePromptIfNotEntitled } from './Logs.utils'
import { LogTable } from './LogTable'
import UpgradePrompt from './UpgradePrompt'

/**
 * Calculates the appropriate time range for bar click filtering based on the current time range duration.
 *
 * @param currentRangeStart - The start timestamp of the current time range
 * @param currentRangeEnd - The end timestamp of the current time range
 * @param clickedTimestamp - The timestamp of the clicked bar
 * @returns Object containing the new start and end timestamps for filtering
 */
export const calculateBarClickTimeRange = (
  currentRangeStart: string,
  currentRangeEnd: string | undefined,
  clickedTimestamp: string
) => {
  const datumTimestamp = dayjs(clickedTimestamp).toISOString()

  // Calculate the current time range duration in hours
  // If currentRangeEnd is not provided, use current time as the end
  const endTime = currentRangeEnd ? dayjs(currentRangeEnd) : dayjs()
  const currentRangeDuration = endTime.diff(dayjs(currentRangeStart), 'hour', true)

  let rangeOffset: number
  let rangeUnit: dayjs.ManipulateType

  if (currentRangeDuration >= 12) {
    // For ranges >= 12h, use 1h range
    rangeOffset = 0.5
    rangeUnit = 'hour'
  } else if (currentRangeDuration >= 1) {
    // For ranges >= 1h but < 12h, use 5min range
    rangeOffset = 2.5
    rangeUnit = 'minute'
  } else if (currentRangeDuration >= 1 / 30) {
    // 2 minutes = 1/30 hour
    // For ranges >= 2min but < 1h, use 2min range
    rangeOffset = 1
    rangeUnit = 'minute'
  } else {
    // For ranges < 2min, use 15sec range
    rangeOffset = 7.5
    rangeUnit = 'second'
  }

  return {
    start: dayjs(datumTimestamp).subtract(rangeOffset, rangeUnit).toISOString(),
    end: dayjs(datumTimestamp).add(rangeOffset, rangeUnit).toISOString(),
  }
}

/**
 * Acts as a container component for the entire log display
 *
 * ## Query Params Syncing
 * Query params are synced on query submission.
 *
 * params used are:
 * - `s` for search query.
 * - `te` for timestamp start value.
 */
interface LogsPreviewerProps {
  projectRef: string
  queryType: QueryType
  filterOverride?: Filters
  condensedLayout?: boolean
  tableName?: LogsTableName
  EmptyState?: React.ReactNode
  filterPanelClassName?: string
}
export const LogsPreviewer = ({
  projectRef,
  queryType,
  filterOverride,
  condensedLayout = false,
  tableName,
  children,
  EmptyState,
  filterPanelClassName,
}: PropsWithChildren<LogsPreviewerProps>) => {
  const router = useRouter()
  const { db } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const state = useDatabaseSelectorStateSnapshot()

  const [showChart, setShowChart] = useState(true)
  const [selectedDatePickerValue, setSelectedDatePickerValue] = useState<DatePickerValue>(
    getDefaultDatePickerValue()
  )

  const { search, setSearch, timestampStart, timestampEnd, setTimeRange, filters, setFilters } =
    useLogsUrlState()

  useEffect(() => {
    if (timestampStart && timestampEnd) {
      setSelectedDatePickerValue({
        to: timestampEnd,
        from: timestampStart,
        text: `${dayjs(timestampStart).format('DD MMM, HH:mm')} - ${dayjs(timestampEnd).format('DD MMM, HH:mm')}`,
        isHelper: false,
      })
    }
  }, [timestampStart, timestampEnd])

  const [selectedLogId, setSelectedLogId] = useSelectedLog()
  const { data: databases, isSuccess } = useReadReplicasQuery({ projectRef })

  // TODO: Move this to useLogsUrlState to simplify LogsPreviewer. - Jordi
  function getDefaultDatePickerValue() {
    const iso_timestamp_start = router.query.iso_timestamp_start as string
    const iso_timestamp_end = router.query.iso_timestamp_end as string

    if (iso_timestamp_start && iso_timestamp_end) {
      return {
        to: iso_timestamp_end,
        from: iso_timestamp_start,
        text: `${dayjs(iso_timestamp_start).format('DD MMM, HH:mm')} - ${dayjs(iso_timestamp_end).format('DD MMM, HH:mm')}`,
        isHelper: false,
      }
    }

    const defaultDatePickerValue = PREVIEWER_DATEPICKER_HELPERS.find((x) => x.default)
    return {
      to: defaultDatePickerValue!.calcTo(),
      from: defaultDatePickerValue!.calcFrom(),
      text: defaultDatePickerValue!.text,
      isHelper: true,
    }
  }

  const table = !tableName ? LOGS_TABLES[queryType] : tableName

  const {
    error,
    logData,
    params,
    newCount,
    isLoading,
    eventChartData,
    isLoadingOlder,
    loadOlder,
    refresh,
  } = useLogsPreview({ projectRef, table, filterOverride })

  const {
    data: selectedLog,
    isLoading: isSelectedLogLoading,
    error: selectedLogError,
  } = useSingleLog({
    projectRef,
    id: selectedLogId ?? undefined,
    queryType,
    paramsToMerge: params,
  })

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(timestampStart)

  const onSelectTemplate = (template: LogTemplate) => {
    setFilters({ ...filters, search_query: template.searchString })
  }

  // [Joshen] For helper date picker values, reset the timestamp start to prevent data caching
  // Since the helpers are "Last n minutes" -> hitting refresh, you'd expect to see the latest result
  // Whereas if a specific range is selected, you'd not expect new data to show up
  const handleRefresh = () => {
    if (selectedDatePickerValue.isHelper) {
      const helper = PREVIEWER_DATEPICKER_HELPERS.find(
        (x) => x.text === selectedDatePickerValue.text
      )
      if (helper) {
        const newTimestampStart = helper.calcFrom()
        setTimeRange(newTimestampStart, timestampEnd)
      }
    }
    refresh()
  }

  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const handleSearch: LogSearchCallback = async (event, { query, to, from }) => {
    if (event === 'search-input-change') {
      setSearch(query || '')
      setSelectedLogId(null)
    } else if (event === 'event-chart-bar-click') {
      setTimeRange(from || '', to || '')
    } else if (event === 'datepicker-change') {
      const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(
        from || '',
        entitledToAuditLogDays
      )
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      } else {
        setTimeRange(from || '', to || '')
      }
    }
  }

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (timestampStart) {
      const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(
        timestampStart,
        entitledToAuditLogDays
      )
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [timestampStart, organization])

  useEffect(() => {
    if (db !== undefined) {
      const database = databases?.find((d) => d.identifier === db)
      if (database !== undefined) state.setSelectedDatabaseId(db)
    } else if (state.selectedDatabaseId !== undefined && state.selectedDatabaseId !== projectRef) {
      if (LOG_ROUTES_WITH_REPLICA_SUPPORT.includes(router.pathname)) {
        router.push({
          pathname: router.pathname,
          query: { ...router.query, db: state.selectedDatabaseId },
        })
      } else {
        state.setSelectedDatabaseId(projectRef)
      }
    }
  }, [db, isSuccess])

  // Common props shared between both filter panel components to avoid duplication
  const filterPanelProps = {
    className: filterPanelClassName,
    csvData: logData,
    isLoading,
    newCount,
    onRefresh: handleRefresh,
    onSearch: handleSearch,
    defaultSearchValue: search,
    defaultToValue: timestampEnd,
    defaultFromValue: timestampStart,
    queryUrl: `/project/${projectRef}/logs/explorer?q=${encodeURIComponent(
      params.sql || ''
    )}&its=${encodeURIComponent(timestampStart)}&ite=${encodeURIComponent(timestampEnd)}`,
    onSelectTemplate,
    filters,
    onFiltersChange: setFilters,
    table,
    condensedLayout,
    isShowingEventChart: showChart,
    onToggleEventChart: () => setShowChart(!showChart),
    onSelectedDatabaseChange: (id: string) => {
      setFilters({ ...filters, database: id !== projectRef ? id : undefined })
      const { db, ...params } = router.query
      router.push({
        pathname: router.pathname,
        query: id !== projectRef ? { ...router.query, db: id } : params,
      })
    },
    selectedDatePickerValue,
    setSelectedDatePickerValue,
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PreviewFilterPanel {...filterPanelProps} />
      {children}
      <div
        className={
          'transition-all duration-500 ' +
          (showChart && logData.length > 0 ? 'mb-2 mt-1 opacity-100' : 'h-0 opacity-0')
        }
      >
        <div className={condensedLayout ? 'px-3' : ''}>
          {showChart && (
            <LogsBarChart
              data={eventChartData}
              onBarClick={(datum) => {
                if (!datum?.timestamp) return

                const { start, end } = calculateBarClickTimeRange(
                  timestampStart,
                  timestampEnd,
                  datum.timestamp
                )

                handleSearch('event-chart-bar-click', {
                  query: filters.search_query?.toString(),
                  to: end,
                  from: start,
                })
              }}
              EmptyState={
                <div className="flex flex-col items-center justify-center h-[67px]">
                  <p className="text-foreground-light text-xs">No data</p>
                  <p className="text-foreground-lighter text-xs">
                    It may take up to 24 hours for data to refresh
                  </p>
                </div>
              }
            />
          )}
        </div>
      </div>
      <div className="relative flex flex-col flex-grow flex-1 overflow-auto">
        <ShimmerLine active={isLoading} />
        <LoadingOpacity active={isLoading}>
          <LogTable
            projectRef={projectRef}
            isLoading={isLoading}
            data={logData}
            queryType={queryType}
            isHistogramShowing={showChart}
            onHistogramToggle={() => setShowChart(!showChart)}
            error={error}
            EmptyState={EmptyState}
            onSelectedLogChange={(log) => setSelectedLogId(log?.id ?? null)}
            selectedLog={selectedLog}
            isSelectedLogLoading={isSelectedLogLoading}
            selectedLogError={selectedLogError ?? undefined}
          />
        </LoadingOpacity>
      </div>
      {!error && logData.length > 0 && (
        <div className="border-t flex flex-row items-center gap-3 p-2">
          <Button
            onClick={loadOlder}
            icon={<Rewind />}
            type="default"
            loading={isLoadingOlder}
            disabled={isLoadingOlder}
          >
            Load older
          </Button>
          <div className="text-sm text-foreground-lighter">
            Showing <span className="font-mono">{logData.length}</span> results
          </div>
          <div className="flex flex-row justify-end mt-2">
            <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
          </div>
        </div>
      )}
    </div>
  )
}
