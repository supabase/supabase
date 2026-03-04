import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentIdQuery } from 'data/content/content-id-query'
import { usePrimaryDatabase } from 'data/read-replicas/replicas-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { Dashboards, SqlSnippets } from 'types'

import { DEPRECATED_REPORTS } from '../Reports.constants'
import { ChartBlock } from './ChartBlock'
import { DeprecatedChartBlock } from './DeprecatedChartBlock'

interface ReportBlockProps {
  item: Dashboards.Chart
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  disableUpdate: boolean
  isRefreshing: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: ({
    chart,
    chartConfig,
  }: {
    chart?: Partial<Dashboards.Chart>
    chartConfig?: Partial<ChartConfig>
  }) => void
}

export const ReportBlock = ({
  item,
  startDate,
  endDate,
  interval,
  disableUpdate,
  isRefreshing,
  onRemoveChart,
  onUpdateChart,
}: ReportBlockProps) => {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const [isWriteQuery, setIsWriteQuery] = useState(false)

  const isSnippet = item.attribute.startsWith('snippet_')

  const {
    data,
    error: contentError,
    isPending: isLoadingContent,
  } = useContentIdQuery(
    { projectRef, id: item.id },
    {
      enabled: isSnippet && !!item.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchIntervalInBackground: false,
      retry: (failureCount: number, error) => {
        if (error.code === 404 || failureCount >= 2) return false
        return true
      },
    }
  )

  const sql = isSnippet ? (data?.content as SqlSnippets.Content)?.sql : undefined
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...(item.chartConfig ?? {}) }
  const isDeprecatedChart = DEPRECATED_REPORTS.includes(item.attribute)
  const snippetMissing = contentError?.message.includes('Content not found')

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef })
  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only
  const postgresConnectionString = primaryDatabase?.connectionString

  const {
    data: queryResult,
    error: executeSqlError,
    isPending: executeSqlLoading,
    refetch,
  } = useQuery({
    queryKey: sqlKeys.query(projectRef, [
      item.id,
      sql,
      readOnlyConnectionString,
      postgresConnectionString,
    ]),
    queryFn: async () => {
      if (!projectRef || !sql) return null

      const connectionString = readOnlyConnectionString ?? postgresConnectionString

      if (!connectionString) {
        toast.error('Unable to establish a database connection for this project.')
        return null
      }

      return executeSql({
        projectRef,
        connectionString,
        sql,
      })
    },
    enabled: !isLoadingContent && contentError == null,
    refetchOnWindowFocus: false,
  })

  const rows = queryResult?.result

  useEffect(() => {
    if (executeSqlError) {
      const errorMessage = String(executeSqlError).toLowerCase()
      const isReadOnlyError =
        errorMessage.includes('read-only transaction') ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('must be owner')

      if (isReadOnlyError) {
        setIsWriteQuery(true)
      }
    }
  }, [executeSqlError])

  useEffect(() => {
    if (isRefreshing) {
      refetch()
    }
  }, [isRefreshing, refetch])

  return (
    <>
      {isSnippet ? (
        <QueryBlock
          blockWriteQueries
          id={item.id}
          label={item.label}
          chartConfig={chartConfig}
          sql={sql}
          results={rows}
          initialHideSql={true}
          errorText={
            snippetMissing
              ? 'SQL snippet not found'
              : executeSqlError
                ? String(executeSqlError)
                : undefined
          }
          isExecuting={!contentError && executeSqlLoading}
          isWriteQuery={isWriteQuery}
          actions={
            <ButtonTooltip
              type="text"
              icon={<X />}
              className="w-7 h-7"
              onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
              tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
            />
          }
          onExecute={(queryType) => {
            refetch()
          }}
          onUpdateChartConfig={onUpdateChart}
          onRemoveChart={() => onRemoveChart({ metric: { key: item.attribute } })}
          disabled={isLoadingContent || snippetMissing || !sql}
        />
      ) : isDeprecatedChart ? (
        <DeprecatedChartBlock
          attribute={item.attribute}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
        />
      ) : (
        <ChartBlock
          startDate={startDate}
          endDate={endDate}
          interval={interval}
          attribute={item.attribute}
          provider={item.provider}
          defaultChartStyle={item.chart_type}
          defaultLogScale={chartConfig?.logScale ?? false}
          maxHeight={176}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
          onUpdateChartConfig={onUpdateChart}
        />
      )}
    </>
  )
}
