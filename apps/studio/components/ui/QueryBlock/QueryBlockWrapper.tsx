import { useState } from 'react'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { useContentIdQuery } from 'data/content/content-id-query'
import { Parameter } from 'lib/sql-parameters'
import { SqlSnippets } from 'types'
import { QueryBlock } from './QueryBlock'

interface QueryBlockWrapperProps {
  item: {
    label: string
    id?: string
    sql?: string
    isSnippet?: boolean
    isChart?: boolean
    chartConfig?: ChartConfig
    results?: any
  }
  maxHeight?: number
  lockColumns?: boolean
  runQuery?: boolean
  isLoading?: boolean
  parameterValues?: Record<string, string>
  onUpdateChartConfig: (config: ChartConfig) => void
  onSetParameter?: (params: Parameter[]) => void
}

// [Joshen ReportsV2] I'm actually not sure if this wrapper but keeping for now till it becomes clearer
// when we progress on with the work for ReportsV2. Currently the only logic here is just fetching data for QueryBlock
export const QueryBlockWrapper = ({
  item,
  maxHeight,
  lockColumns = false,
  runQuery = false,
  isLoading = false,
  parameterValues,
  onUpdateChartConfig,
  onSetParameter,
}: QueryBlockWrapperProps) => {
  const { ref: projectRef } = useParams()
  const [sql, setSql] = useState(item.sql || '')

  useContentIdQuery(
    { projectRef, id: item.id },
    {
      enabled: item.isSnippet && !!item.id,
      onSuccess: (data) => setSql((data.content as SqlSnippets.Content).sql),
    }
  )

  return (
    <QueryBlock
      id={''}
      label={item.label}
      sql={sql}
      maxHeight={maxHeight}
      chartConfig={item.chartConfig}
      isChart={item.isChart}
      isLoading={isLoading}
      runQuery={runQuery}
      lockColumns={lockColumns}
      parameterValues={parameterValues}
      onUpdateChartConfig={onUpdateChartConfig}
      onSetParameter={onSetParameter}
    />
  )
}
