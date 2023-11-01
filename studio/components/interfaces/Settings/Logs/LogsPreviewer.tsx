import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Button, IconRewind } from 'ui'

import {
  Filters,
  LogEventChart,
  LogSearchCallback,
  LogTable,
  LogTemplate,
  LogsTableName,
  QueryType,
  TEMPLATES,
  ensureNoTimestampConflict,
  maybeShowUpgradePrompt,
} from 'components/interfaces/Settings/Logs'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import ShimmerLine from 'components/ui/ShimmerLine'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { LOGS_TABLES } from './Logs.constants'
import UpgradePrompt from './UpgradePrompt'
import { useSelectedOrganization } from 'hooks'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

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
  const { s, ite, its } = useParams()
  const [showChart, setShowChart] = useState(true)
  const organization = useSelectedOrganization()
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
    setFilters((prev) => ({ ...prev, search_query: s as string }))
    if (ite || its) {
      setParams((prev) => ({
        ...prev,
        iso_timestamp_start: (its || '') as string,
        iso_timestamp_end: (ite || '') as string,
      }))
    }
  }, [s, ite, its])

  // Show the prompt on page load based on query params
  useEffect(() => {
    if (its) {
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(its as string, subscription?.plan?.id)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [its, subscription])

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

  return (
    <div className="flex flex-col flex-grow h-full">
      <PreviewFilterPanel
        csvData={logData}
        isLoading={isLoading}
        newCount={newCount}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        defaultSearchValue={filters.search_query as string}
        defaultToValue={params.iso_timestamp_end}
        defaultFromValue={params.iso_timestamp_start}
        onExploreClick={() => {
          router.push(
            `/project/${projectRef}/logs/explorer?q=${encodeURIComponent(
              params.sql || ''
            )}&its=${encodeURIComponent(params.iso_timestamp_start || '')}&ite=${encodeURIComponent(
              params.iso_timestamp_end || ''
            )}`
          )
        }}
        onSelectTemplate={onSelectTemplate}
        filters={filters}
        onFiltersChange={setFilters}
        table={table}
        condensedLayout={condensedLayout}
        isShowingEventChart={showChart}
        onToggleEventChart={() => setShowChart(!showChart)}
      />
      {children}
      <div
        className={
          'transition-all duration-500 ' +
          (showChart && !isLoading && logData.length > 0
            ? 'mb-4 h-24 pt-4 opacity-100'
            : 'h-0 opacity-0')
        }
      >
        <div className={condensedLayout ? 'px-4' : ''}>
          {!isLoading && showChart && (
            <LogEventChart
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
        {!error && (
          <div className="flex flex-row justify-between p-2">
            <Button
              onClick={loadOlder}
              icon={<IconRewind />}
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
    </div>
  )
}

export default LogsPreviewer
