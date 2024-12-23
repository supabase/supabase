import { useParams } from 'common'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useState, useEffect } from 'react'
import QueryBlock from './QueryBlock'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { Parameter } from 'lib/sql-parameters'

interface QueryBlockWrapperProps {
  item: {
    id: string
    label: string
    isSnippet?: boolean
    sql?: string
    isChart: boolean
    chartConfig?: ChartConfig
    results?: any
  }
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  startDate?: string
  endDate?: string
  interval?: string
  onToggleChart: () => void
  onUpdateChartConfig: (config: ChartConfig) => void
  parameterValues?: Record<string, string>
  onSetParameter?: (params: Parameter[]) => void
}

const QueryBlockWrapper = ({ item, ...restProps }: QueryBlockWrapperProps) => {
  const { ref } = useParams()
  const [sql, setSql] = useState(item.sql || '')

  const { data: snippetData } = useContentIdQuery(
    { projectRef: ref, id: item.id },
    { enabled: item.isSnippet }
  )

  useEffect(() => {
    if (snippetData?.content?.sql) {
      setSql(snippetData.content.sql)
    }
  }, [snippetData])

  return (
    <QueryBlock
      sql={sql}
      isChart={item.isChart}
      chartConfig={item.chartConfig}
      results={item.results}
      label={item.label}
      id={item.id}
      {...restProps}
    />
  )
}

export default QueryBlockWrapper
