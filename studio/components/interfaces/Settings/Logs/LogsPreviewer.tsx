import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { IconRewind, Button } from 'ui'

import {
  LogTable,
  LogTemplate,
  TEMPLATES,
  LogSearchCallback,
  LogsTableName,
  QueryType,
  LogEventChart,
  Filters,
  ensureNoTimestampConflict,
  maybeShowUpgradePrompt,
} from 'components/interfaces/Settings/Logs'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'

import { LOGS_TABLES } from './Logs.constants'
import ShimmerLine from 'components/ui/ShimmerLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'
import { useProjectSubscription } from 'hooks'
import { useUpgradePrompt } from 'hooks/misc/useUpgradePrompt'
import { StripeProduct } from 'components/interfaces/Billing'
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
interface Props {
  projectRef: string
  queryType: QueryType
  filterOverride?: Filters
  condensedLayout?: boolean
  tableName?: LogsTableName
}
export const LogsPreviewer: React.FC<Props> = ({
  projectRef,
  queryType,
  filterOverride,
  condensedLayout = false,
  tableName,
}) => {
  const router = useRouter()
  const { s, ite, its, ref } = router.query
  const [showChart, setShowChart] = useState(true)
  const { subscription } = useProjectSubscription(ref as string)
  const tier = subscription?.tier

  const table = !tableName ? LOGS_TABLES[queryType] : tableName

  const [
    { error, logData, params, newCount, filters, isLoading, eventChartData },
    { loadOlder, setFilters, refresh, setParams },
  ] = useLogsPreview(projectRef as string, table, filterOverride)

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
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(its as string, tier?.key)
      if (shouldShowUpgradePrompt) {
        setShowUpgradePrompt(!showUpgradePrompt)
      }
    }
  }, [its, tier])

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
      const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, tier?.key)

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
    <div className="flex h-full flex-grow flex-col">
      <PreviewFilterPanel
        csvData={logData}
        isLoading={isLoading}
        newCount={newCount}
        templates={TEMPLATES.filter(
          (template) => queryType && template.for?.includes(queryType) && template.mode === 'simple'
        )}
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
      <div
        className={
          'transition-all duration-500 ' +
          (showChart && !isLoading && logData.length > 0
            ? 'mb-4 h-24 pt-4 opacity-100'
            : 'h-0 opacity-0')
        }
      >
        <div className={condensedLayout ? 'px-4' : ''}>
          {showChart && (
            <LogEventChart
              data={!isLoading && eventChartData ? eventChartData : undefined}
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
      <div className="relative flex flex-grow flex-col pt-4">
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
            <Button onClick={loadOlder} icon={<IconRewind />} type="default">
              Load older
            </Button>
            <div className="mt-2 flex flex-row justify-end">
              <UpgradePrompt show={showUpgradePrompt} setShowUpgradePrompt={setShowUpgradePrompt} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogsPreviewer
