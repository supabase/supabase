import {
  createEmbeddedSqlBlock,
  mergeBlockChartConfig,
} from '@/components/interfaces/Notebook/notebookBlock.utils'
import { getLogDatePickerValueForHelper } from '@/components/interfaces/Settings/Logs/logsDateRange'
import type { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import type { GeneratedNotebookBlock } from '@/lib/ai/notebook-generate-schema'
import type { Dashboards } from '@/types'

export function generatedResultConfigToChartConfig(
  config: GeneratedNotebookBlock['result_config']
): Partial<ChartConfig> {
  if (config.view === 'table') {
    return {
      view: 'table',
      type: config.chart_type,
      cumulative: config.cumulative,
      xKey: '',
      yKey: '',
    }
  }

  return {
    view: 'chart',
    type: config.chart_type,
    cumulative: config.cumulative,
    xKey: config.x_key,
    yKey: config.y_key,
  }
}

export function generatedNotebookBlocksToLayout(
  blocks: GeneratedNotebookBlock[],
  createId: () => string
): Dashboards.Chart[] {
  return blocks.map((block, index) => {
    const chartConfig = mergeBlockChartConfig(
      generatedResultConfigToChartConfig(block.result_config)
    )

    return {
      ...createEmbeddedSqlBlock({
        id: createId(),
        label: block.label,
        x: 0,
        y: index,
        sql: block.sql,
        querySource: block.query_source ?? 'database',
        logsDatePickerValue:
          block.query_source === 'logs'
            ? getLogDatePickerValueForHelper(block.logs_time_range ?? undefined)
            : undefined,
      }),
      chart_type: chartConfig.type,
      chartConfig,
    }
  })
}
