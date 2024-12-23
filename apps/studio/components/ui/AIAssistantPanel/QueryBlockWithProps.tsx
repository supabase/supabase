import { useState } from 'react'
import QueryBlock from 'components/interfaces/Reports/QueryBlock'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { useRouter } from 'next/router'
import { Edit } from 'lucide-react'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TelemetryActions } from 'lib/constants/telemetry'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface QueryBlockWithPropsProps {
  sql: string
  isLoading?: boolean
  readOnly?: boolean
}

const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
}

const QueryBlockWithProps = ({
  sql,
  isLoading = false,
  readOnly = false,
}: QueryBlockWithPropsProps) => {
  const router = useRouter()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { newQuery } = useNewQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')

  const formatted = sql || ''
  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)
  const props = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const title = props.title || 'SQL Query'
  const updatedSql = formatted?.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()

  const [isChart, setIsChart] = useState(props.isChart === 'true')
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    ...DEFAULT_CHART_CONFIG,
    xKey: props.xAxis || '',
    yKey: props.yAxis || '',
  })

  const handleToggleChart = () => {
    setIsChart(!isChart)
  }

  const handleUpdateChartConfig = (config: Partial<ChartConfig>) => {
    setChartConfig((prev) => ({ ...prev, ...config }))
  }

  const handleEditInSQLEditor = () => {
    if (isInSQLEditor) {
      snapV2.setDiffContent(updatedSql, DiffType.Addition)
    } else {
      newQuery(updatedSql, title)
    }
  }

  const editButton =
    !isInSQLEditor || isInNewSnippet ? (
      <ButtonTooltip
        type="text"
        size="tiny"
        className="w-7 h-7"
        icon={<Edit size={14} />}
        onClick={() => {
          handleEditInSQLEditor()
          sendEvent({ action: TelemetryActions.ASSISTANT_EDIT_SQL_CLICKED })
        }}
        tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
      />
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            type="text"
            size="tiny"
            className="w-7 h-7"
            icon={<Edit size={14} />}
            tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36">
          <DropdownMenuItem onClick={() => snapV2.setDiffContent(updatedSql, DiffType.Addition)}>
            Insert code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => snapV2.setDiffContent(updatedSql, DiffType.Modification)}
          >
            Replace code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => newQuery(updatedSql, title)}>
            Create new snippet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

  return (
    <QueryBlock
      sql={updatedSql}
      isChart={isChart}
      chartConfig={chartConfig}
      label={title}
      id={`sql-${Math.random().toString(36).substr(2, 9)}`}
      disableUpdate={readOnly}
      onToggleChart={handleToggleChart}
      onUpdateChartConfig={handleUpdateChartConfig}
      isLoading={isLoading}
      maxHeight={300}
      actions={editButton}
      runQuery={props.runQuery === 'true'}
    />
  )
}

export default QueryBlockWithProps
