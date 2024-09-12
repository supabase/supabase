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
import { Button, cn } from 'ui'
import LogEventChart from './LogEventChart'
import LogTable from './LogTable'
import { LOGS_TABLES, LOG_ROUTES_WITH_REPLICA_SUPPORT, LogsTableName } from './Logs.constants'
import type { Filters, LogSearchCallback, LogTemplate, QueryType } from './Logs.types'
import { ensureNoTimestampConflict, maybeShowUpgradePrompt } from './Logs.utils'
import UpgradePrompt from './UpgradePrompt'

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
}
export const LogsPreviewer = ({
  projectRef,
  queryType,
  filterOverride,
  condensedLayout = false,
  tableName,
  children,
}: PropsWithChildren<LogsPreviewerProps>) => {
  const router = useRouter()
  const { s, ite, its, db } = useParams()
  const [showChart, setShowChart] = useState(true)
  const organization = useSelectedOrganization()
  const state = useDatabaseSelectorStateSnapshot()

  const { data: databases, isSuccess } = useReadReplicasQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  const table = !tableName ? LOGS_TABLES[queryType] : tableName

  const {
    error,
    logData,
    params,
    newCount,
    filters,
    isLoading,
    eventChartData,
    isLoadingOlder,
    loadOlder,
    setFilters,
    refresh,
    setParams,
  } = useLogsPreview(projectRef as string, table, filterOverride)

  const { showUpgradePrompt, setShowUpgradePrompt } = useUpgradePrompt(
    params.iso_timestamp_start as string
  )

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search_query: s,
      database: db,
    }))
    if (ite || its) {
      setParams((prev) => ({
        ...prev,
        iso_timestamp_start: its || '',
        iso_timestamp_end: ite || '',
      }))
    }
  }, [db, s, ite, its])

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (its) {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(its as string, subscription?.plan?.id)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [its, subscription])

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
    setFilters((prev: any) => ({ ...prev, search_query: template.searchString }))
  }

  const handleRefresh = () => {
    refresh()
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        ite: undefined,
        its: undefined,
        // ...whereFilters,
      },
    })
  }
  const handleSearch: LogSearchCallback = async (event, { query, to, from }) => {
    if (event === 'search-input-change') {
      setFilters((prev) => ({ ...prev, search_query: query }))
      router.push({
        pathname: router.pathname,
        query: { ...router.query, s: query },
      })
    } else if (event === 'event-chart-bar-click') {
      const [nextStart, nextEnd] = ensureNoTimestampConflict(
        [params.iso_timestamp_start || '', params.iso_timestamp_end || ''],
        [from || '', to || '']
      )
      setParams((prev) => ({
        ...prev,
        iso_timestamp_start: nextStart,
        iso_timestamp_end: nextEnd,
      }))
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          its: nextStart,
          ite: nextEnd,
        },
      })
    } else if (event === 'datepicker-change') {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, subscription?.plan?.id)

      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      } else {
        setParams((prev) => ({
          ...prev,
          iso_timestamp_start: from || '',
          iso_timestamp_end: to || '',
        }))
        router.push({
          pathname: router.pathname,
          query: {
            ...router.query,
            its: from || '',
            ite: to || '',
          },
        })
      }
    }
  }

  const footerHeight = '48px'
  const navBarHeight = '48px'
  const filterPanelHeight = '54px'
  const chartHeight = showChart ? '114px' : '0px'
  const maxHeight = `calc(100vh - ${navBarHeight} - ${filterPanelHeight} - ${footerHeight} - ${chartHeight})`

  return (
    <div>
      <PreviewFilterPanel
        csvData={logData}
        isLoading={isLoading}
        newCount={newCount}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        defaultSearchValue={filters.search_query as string}
        defaultToValue={params.iso_timestamp_end}
        defaultFromValue={params.iso_timestamp_start}
        queryUrl={`/project/${projectRef}/logs/explorer?q=${encodeURIComponent(
          params.sql || ''
        )}&its=${encodeURIComponent(params.iso_timestamp_start || '')}&ite=${encodeURIComponent(
          params.iso_timestamp_end || ''
        )}`}
        onSelectTemplate={onSelectTemplate}
        filters={filters}
        onFiltersChange={setFilters}
        table={table}
        condensedLayout={condensedLayout}
        isShowingEventChart={showChart}
        onToggleEventChart={() => setShowChart(!showChart)}
        onSelectedDatabaseChange={(id: string) => {
          setFilters((prev) => ({
            ...prev,
            database: id !== projectRef ? undefined : id,
          }))
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
          (showChart && logData.length > 0 ? 'mb-4 h-24 pt-4 opacity-100' : 'h-0 opacity-0')
        }
      >
        <div className={condensedLayout ? 'px-4' : ''}>
          {showChart && (
            <LogEventChart
              className={cn({
                'opacity-40': isLoading,
              })}
              data={eventChartData}
              onBarClick={(isoTimestamp) => {
                handleSearch('event-chart-bar-click', {
                  query: filters.search_query as string,
                  to: isoTimestamp as string,
                  from: null,
                })
              }}
            />
          )}
        </div>
      </div>
      <div className="relative flex flex-col flex-grow pt-4">
        <ShimmerLine active={isLoading} />
        <LoadingOpacity active={isLoading}>
          <LogTable
            maxHeight={maxHeight}
            projectRef={projectRef}
            isLoading={isLoading}
            data={logData}
            queryType={queryType}
            isHistogramShowing={showChart}
            onHistogramToggle={() => setShowChart(!showChart)}
            params={params}
            error={error}
          />
        </LoadingOpacity>
      </div>
      {!error && logData.length > 0 && (
        <div className="border-t flex flex-row justify-between p-2">
          <Button
            className={cn({
              'opacity-0': isLoadingOlder || isLoading,
            })}
            onClick={loadOlder}
            icon={<Rewind />}
            type="default"
            loading={isLoadingOlder}
            disabled={isLoadingOlder}
          >
            Load older
          </Button>
          <div className="flex flex-row justify-end mt-2">
            <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
          </div>
        </div>
      )}
    </div>
  )
}

export default LogsPreviewer
