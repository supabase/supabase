import dayjs from 'dayjs'
import { Rewind } from 'lucide-react'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams } from 'common'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import useUnifiedLogs from 'hooks/analytics/useUnifiedLogs'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { useSelectedLog } from 'hooks/analytics/useSelectedLog'
import useSingleLog from 'hooks/analytics/useSingleLog'
import { useFlag } from 'hooks/ui/useFlag'
import { Button } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import LogTable from '../Settings/Logs/LogTable'
import { DatePickerValue } from '../Settings/Logs/Logs.DatePickers'
import { LogsTableName, PREVIEWER_DATEPICKER_HELPERS } from '../Settings/Logs/Logs.constants'
import type {
  Filters,
  LogSearchCallback,
  LogTemplate,
  QueryType,
} from '../Settings/Logs/Logs.types'
import { PreviewFilterPanelWithUniversal } from '../Settings/Logs/PreviewFilterPanelWithUniversal'

interface UnifiedLogsPreviewerProps {
  projectRef: string
  filterOverride?: Filters
  condensedLayout?: boolean
  EmptyState?: React.ReactNode
  filterPanelClassName?: string
}

export const UnifiedLogsPreviewer = ({
  projectRef,
  filterOverride,
  condensedLayout = false,
  children,
  EmptyState,
  filterPanelClassName,
}: PropsWithChildren<UnifiedLogsPreviewerProps>) => {
  const useUniversalFilterBar = useFlag('universalFilterBar')
  const router = useRouter()
  const { db } = useParams()

  const [showChart, setShowChart] = useState(true)
  const [selectedDatePickerValue, setSelectedDatePickerValue] = useState<DatePickerValue>(
    getDefaultDatePickerValue()
  )

  const { search, setSearch, timestampStart, timestampEnd, setTimeRange, filters, setFilters } =
    useLogsUrlState()
  const [selectedLogId, setSelectedLogId] = useSelectedLog()

  // Use the custom useUnifiedLogs hook
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
  } = useUnifiedLogs({ projectRef, filterOverride })

  const {
    data: selectedLog,
    isLoading: isSelectedLogLoading,
    error: selectedLogError,
  } = useSingleLog({
    projectRef,
    id: selectedLogId ?? undefined,
    queryType: 'unified',
    paramsToMerge: params,
  })

  // TODO: Move this to useLogsUrlState to simplify LogsPreviewer
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

  const onSelectTemplate = (template: LogTemplate) => {
    setFilters({ ...filters, search_query: template.searchString })
  }

  // For helper date picker values, reset the timestamp start to prevent data caching
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

  const handleSearch: LogSearchCallback = async (event, { query, to, from }) => {
    if (event === 'search-input-change') {
      setSearch(query || '')
      setSelectedLogId(null)
    } else if (event === 'event-chart-bar-click') {
      setTimeRange(from || '', to || '')
    } else if (event === 'datepicker-change') {
      setTimeRange(from || '', to || '')
    }
  }

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
    table: LogsTableName.UNIFIED,
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
      {useUniversalFilterBar ? (
        // Experimental Universal Filter Bar
        <PreviewFilterPanelWithUniversal {...filterPanelProps} />
      ) : (
        // Legacy Filter Panel
        <PreviewFilterPanel {...filterPanelProps} />
      )}
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

                const datumTimestamp = dayjs(datum.timestamp).toISOString()

                const start = dayjs(datumTimestamp).subtract(1, 'minute').toISOString()
                const end = dayjs(datumTimestamp).add(1, 'minute').toISOString()

                handleSearch('event-chart-bar-click', {
                  query: filters.search_query?.toString(),
                  to: end,
                  from: start,
                })
              }}
              EmptyState={
                <div className="flex flex-col items-center justify-center h-[67px]">
                  <h2 className="text-foreground-light text-xs">No data</h2>
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
            queryType="unified"
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
        </div>
      )}
    </div>
  )
}

export default UnifiedLogsPreviewer
