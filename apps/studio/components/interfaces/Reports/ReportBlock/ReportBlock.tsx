import { X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentIdQuery } from 'data/content/content-id-query'
import { usePrimaryDatabase } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useChangedSync } from 'hooks/misc/useChanged'
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

  const isSnippet = item.attribute.startsWith('snippet_')

  const { data, error, isLoading } = useContentIdQuery(
    { projectRef, id: item.id },
    {
      enabled: isSnippet && !!item.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchIntervalInBackground: false,
      retry: (failureCount: number) => {
        if (failureCount >= 2) return false
        return true
      },
      onSuccess: (contentData) => {
        if (!isSnippet) return
        const fetchedSql = (contentData?.content as SqlSnippets.Content | undefined)?.sql
        if (fetchedSql) runQuery('select', fetchedSql)
      },
    }
  )
  const sql = isSnippet ? (data?.content as SqlSnippets.Content)?.sql : undefined
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...(item.chartConfig ?? {}) }
  const isDeprecatedChart = DEPRECATED_REPORTS.includes(item.attribute)
  const snippetMissing = error?.message.includes('Content not found')

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef })
  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only
  const postgresConnectionString = primaryDatabase?.connectionString

  const [rows, setRows] = useState<any[] | undefined>(undefined)
  const [isWriteQuery, setIsWriteQuery] = useState(false)

  const {
    mutate: executeSql,
    error: executeSqlError,
    isLoading: executeSqlLoading,
  } = useExecuteSqlMutation({
    onError: () => {
      // Silence the error toast because the error will be displayed inline
    },
  })

  const runQuery = useCallback(
    (queryType: 'select' | 'mutation' = 'select', sqlToRun?: string) => {
      if (!projectRef || !sqlToRun) return false

      const connectionString =
        queryType === 'mutation'
          ? postgresConnectionString
          : readOnlyConnectionString ?? postgresConnectionString

      if (!connectionString) {
        toast.error('Unable to establish a database connection for this project.')
        return false
      }

      if (queryType === 'mutation') {
        setIsWriteQuery(true)
      }
      executeSql(
        { projectRef, connectionString, sql: sqlToRun },
        {
          onSuccess: (data) => {
            setRows(data.result)
            setIsWriteQuery(queryType === 'mutation')
          },
          onError: (mutationError) => {
            const lowerMessage = mutationError.message.toLowerCase()
            const isReadOnlyError =
              lowerMessage.includes('read-only transaction') ||
              lowerMessage.includes('permission denied') ||
              lowerMessage.includes('must be owner')

            if (queryType === 'select' && isReadOnlyError) {
              setIsWriteQuery(true)
            }
          },
        }
      )
      return true
    },
    [projectRef, readOnlyConnectionString, postgresConnectionString, executeSql]
  )

  const sqlHasChanged = useChangedSync(sql)
  const isRefreshingChanged = useChangedSync(isRefreshing)
  if (sqlHasChanged || (isRefreshingChanged && isRefreshing)) {
    runQuery('select', sql)
  }

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
          errorText={snippetMissing ? 'SQL snippet not found' : executeSqlError?.message}
          isExecuting={executeSqlLoading}
          isWriteQuery={isWriteQuery}
          actions={
            !isLoading && (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            )
          }
          onExecute={(queryType) => {
            runQuery(queryType, sql)
          }}
          onUpdateChartConfig={onUpdateChart}
          onRemoveChart={() => onRemoveChart({ metric: { key: item.attribute } })}
          disabled={isLoading || snippetMissing || !sql}
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
