import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Typography, IconAlertCircle, IconRewind, Button, Card, Input } from '@supabase/ui'

import {
  LogTable,
  LogTemplate,
  TEMPLATES,
  LogSearchCallback,
  LogsTableName,
  QueryType,
  LogEventChart,
  Filters,
  unixMicroToIsoTimestamp,
} from 'components/interfaces/Settings/Logs'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import PreviewFilterPanel from 'components/interfaces/Settings/Logs/PreviewFilterPanel'

import { LOGS_TABLES } from './Logs.constants'
import ShimmerLine from 'components/ui/ShimmerLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'
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
  const { s, ite, its } = router.query
  const [showChart, setShowChart] = useState(true)

  const table = !tableName ? LOGS_TABLES[queryType] : tableName

  const [
    { error, logData, params, newCount, filters, isLoading },
    { loadOlder, setFilters, refresh, setParams },
  ] = useLogsPreview(projectRef as string, table, filterOverride)

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

  const handleSearch: LogSearchCallback = async ({ query = '', to, from }) => {
    setParams((prev) => ({
      ...prev,
      iso_timestamp_start: from || prev.iso_timestamp_start || '',
      iso_timestamp_end: to || prev.iso_timestamp_end || '',
    }))
    setFilters((prev) => ({ ...prev, search_query: query }))
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        s: query || '',
        its: from || its || '',
        ite: to || ite || '',
      },
    })
  }
  return (
    <div className="h-full flex flex-col flex-grow">
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
            `/project/${projectRef}/logs-explorer?q=${encodeURIComponent(
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
            ? 'opacity-100 h-24 pt-4 mb-4'
            : 'opacity-0 h-0')
        }
      >
        <div className={condensedLayout ? 'px-4' : ''}>
          {showChart && (
            <LogEventChart
              data={!isLoading ? logData : undefined}
              onBarClick={(timestampMicro) => {
                const to = unixMicroToIsoTimestamp(timestampMicro)
                handleSearch({ query: filters.search_query as string, to, from: null })
              }}
            />
          )}
        </div>
      </div>
      <div className="flex flex-col flex-grow relative pt-4">
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
          />
        </LoadingOpacity>
        {!error && (
          <div className="p-2 flex flex-row justify-between">
            <Button onClick={loadOlder} icon={<IconRewind />} type="default">
              Load older
            </Button>
            <UpgradePrompt projectRef={projectRef} from={params.iso_timestamp_start || ''} />
          </div>
        )}
        {error && (
          <div className="flex w-full h-full justify-center items-center mx-auto">
            <Card className="flex flex-col gap-y-2  w-2/5 bg-scale-400">
              <div className="flex flex-row gap-x-2 py-2">
                <IconAlertCircle size={16} />
                <Typography.Text type="secondary">
                  Sorry! An error occured when fetching data.
                </Typography.Text>
              </div>
              <Input.TextArea
                label="Error Messages"
                value={JSON.stringify(error, null, 2)}
                borderless
                className=" border-t-2 border-scale-800 pt-2 font-mono"
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogsPreviewer
