import dayjs from 'dayjs'
import { Rewind } from 'lucide-react'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams } from 'common'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Button } from 'ui'
import LogTable from './LogTable'
import { LOGS_TABLES, LOG_ROUTES_WITH_REPLICA_SUPPORT, LogsTableName } from './Logs.constants'
import type { Filters, LogSearchCallback, LogTemplate, QueryType } from './Logs.types'
import { maybeShowUpgradePrompt } from './Logs.utils'
import UpgradePrompt from './UpgradePrompt'
import { useSelectedLog } from 'hooks/analytics/useSelectedLog'
import useSingleLog from 'hooks/analytics/useSingleLog'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

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
  const [showChart, setShowChart] = useState(true)

  const organization = useSelectedOrganization()
  const state = useDatabaseSelectorStateSnapshot()
  const { search, setSearch, timestampStart, timestampEnd, setTimeRange, filters, setFilters } =
    useLogsUrlState()

  const [selectedLogId, setSelectedLogId] = useSelectedLog()

  const { data: databases, isSuccess } = useReadReplicasQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

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

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (timestampStart) {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(timestampStart, subscription?.plan?.id)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [timestampStart, subscription])

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

  const onSelectTemplate = (template: LogTemplate) => {
    setFilters({ ...filters, search_query: template.searchString })
  }

  const handleRefresh = () => {
    // Call refresh first to ensure we get the count with current timestamps
    setTimeRange('', '')
    refresh()
  }

  const handleSearch: LogSearchCallback = async (event, { query, to, from }) => {
    if (event === 'search-input-change') {
      setSearch(query || '')
      setSelectedLogId(null)
    } else if (event === 'event-chart-bar-click') {
      setTimeRange(from || '', to || '')
    } else if (event === 'datepicker-change') {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from || '', subscription?.plan?.id)

      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      } else {
        setTimeRange(from || '', to || '')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PreviewFilterPanel
        className={filterPanelClassName}
        csvData={logData}
        isLoading={isLoading}
        newCount={newCount}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        defaultSearchValue={search}
        defaultToValue={timestampEnd}
        defaultFromValue={timestampStart}
        queryUrl={`/project/${projectRef}/logs/explorer?q=${encodeURIComponent(
          params.sql || ''
        )}&its=${encodeURIComponent(timestampStart)}&ite=${encodeURIComponent(timestampEnd)}`}
        onSelectTemplate={onSelectTemplate}
        filters={filters}
        onFiltersChange={setFilters}
        table={table}
        condensedLayout={condensedLayout}
        isShowingEventChart={showChart}
        onToggleEventChart={() => setShowChart(!showChart)}
        onSelectedDatabaseChange={(id: string) => {
          setFilters({ ...filters, database: id !== projectRef ? id : undefined })
          const { db, ...params } = router.query
          router.push({
            pathname: router.pathname,
            query: id !== projectRef ? { ...router.query, db: id } : params,
          })
        }}
      />
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

export default LogsPreviewer
