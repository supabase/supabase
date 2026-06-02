import { untrustedSql } from '@supabase/pg-meta'

import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { getLogDatePickerValueForHelper } from '@/components/interfaces/Settings/Logs/logsDateRange'
import { getSnippetSqlFromContent } from '@/components/interfaces/SQLEditor/sqlSnippet.utils'
import type { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { DEFAULT_CHART_CONFIG } from '@/components/ui/QueryBlock/QueryBlock'
import type { Dashboards, SqlSnippets } from '@/types'

export const SQL_BLOCK_ATTRIBUTE = 'sql_block' as const

export function isLegacySnippetBlock(block: Dashboards.Chart) {
  return block.attribute.startsWith('snippet_') || block.attribute.startsWith('new_snippet_')
}

export function isEmbeddedSqlBlock(block: Dashboards.Chart) {
  return block.attribute === SQL_BLOCK_ATTRIBUTE || !!block.sql
}

export function isNotebookSqlBlock(block: Dashboards.Chart) {
  return isEmbeddedSqlBlock(block) || isLegacySnippetBlock(block)
}

export function getBlockSql(block: Dashboards.Chart): string {
  if (block.sql) {
    if (block.sql.unchecked_sql) {
      return String(block.sql.unchecked_sql)
    }
    if (typeof block.sql.sql === 'string') {
      return block.sql.sql
    }
  }
  return ''
}

export function getBlockQuerySource(block: Dashboards.Chart): 'database' | 'logs' {
  return block.sql?.query_source === 'logs' ? 'logs' : 'database'
}

export function getBlockLogsDatePickerValue(block: Dashboards.Chart): DatePickerValue {
  return block.sql?.logs_date_picker_value ?? getLogDatePickerValueForHelper()
}

export function mergeBlockChartConfig(
  chartConfig?: Partial<ChartConfig> | null,
  chartType?: Dashboards.Chart['chart_type']
): ChartConfig {
  const merged = { ...DEFAULT_CHART_CONFIG, ...(chartConfig ?? {}) }
  if (!chartConfig?.type && chartType) {
    merged.type = chartType
  }
  return merged
}

export function chartConfigFromSnippetContent(
  snippetContent:
    | SqlSnippets.Content
    | { chart?: Partial<ChartConfig>; sql?: string }
    | null
    | undefined
): Partial<ChartConfig> | undefined {
  if (!snippetContent || typeof snippetContent !== 'object' || !('chart' in snippetContent)) {
    return undefined
  }

  const { chart } = snippetContent
  if (!chart || typeof chart !== 'object') return undefined

  return chart
}

/** Restore the utility panel tab from persisted block chart settings */
export function getNotebookBlockUtilityTab(chartConfig?: Partial<ChartConfig> | null) {
  const merged = mergeBlockChartConfig(chartConfig)
  if (merged.view === 'chart' || (merged.xKey && merged.yKey)) {
    return 'chart'
  }
  return 'results'
}

export function createEmptyBlockSql(): Dashboards.BlockSql {
  return {
    unchecked_sql: untrustedSql(''),
    query_source: 'database',
    schema_version: '1.0',
  }
}

export function createEmbeddedSqlBlock({
  id,
  label,
  x = 0,
  y = 0,
  sql = '',
  querySource = 'database',
  logsDatePickerValue,
}: {
  id: string
  label: string
  x?: number
  y?: number
  sql?: string
  querySource?: 'database' | 'logs'
  logsDatePickerValue?: DatePickerValue
}): Dashboards.Chart {
  return {
    id,
    label,
    x,
    y,
    w: 1,
    h: 1,
    attribute: SQL_BLOCK_ATTRIBUTE,
    chart_type: 'bar',
    chartConfig: undefined,
    sql: {
      unchecked_sql: untrustedSql(sql),
      query_source: querySource,
      ...(logsDatePickerValue !== undefined ? { logs_date_picker_value: logsDatePickerValue } : {}),
      schema_version: '1.0',
    },
  }
}

export function migrateSnippetBlockToEmbedded(
  block: Dashboards.Chart,
  snippetContent:
    | SqlSnippets.Content
    | { chart?: Partial<ChartConfig>; sql?: string }
    | null
    | undefined
): Dashboards.Chart {
  const sqlText = snippetContent ? getSnippetSqlFromContent(snippetContent) : getBlockSql(block)

  const querySource =
    snippetContent &&
    typeof snippetContent === 'object' &&
    'query_source' in snippetContent &&
    snippetContent.query_source === 'logs'
      ? 'logs'
      : getBlockQuerySource(block)

  const snippetChartConfig = chartConfigFromSnippetContent(snippetContent ?? undefined)

  return {
    ...block,
    attribute: SQL_BLOCK_ATTRIBUTE,
    chartConfig: block.chartConfig ?? snippetChartConfig,
    sql: {
      unchecked_sql: untrustedSql(sqlText),
      query_source: querySource,
      ...(block.sql?.logs_date_picker_value !== undefined
        ? { logs_date_picker_value: block.sql.logs_date_picker_value }
        : {}),
      schema_version:
        snippetContent &&
        typeof snippetContent === 'object' &&
        'schema_version' in snippetContent &&
        typeof snippetContent.schema_version === 'string'
          ? snippetContent.schema_version
          : '1.0',
    },
  }
}

export function remapChartBlockSqlFromApi(block: Dashboards.Chart): Dashboards.Chart {
  if (!block.sql || block.sql.unchecked_sql) return block

  const { sql, ...rest } = block.sql
  if (typeof sql !== 'string') return block

  return {
    ...block,
    sql: {
      ...rest,
      unchecked_sql: untrustedSql(sql),
    },
  }
}

export function unmapChartBlockSqlForApi(block: Dashboards.Chart): Dashboards.Chart {
  if (!block.sql) return block

  const { unchecked_sql, sql, ...rest } = block.sql
  const sqlValue = unchecked_sql ?? sql
  if (sqlValue === undefined) return block

  return {
    ...block,
    sql: {
      ...rest,
      sql: String(sqlValue),
    },
  }
}

export function remapNotebookContentFromApi(content: Dashboards.Content): Dashboards.Content {
  return {
    ...content,
    layout: content.layout.map(remapChartBlockSqlFromApi),
  }
}

export function unmapNotebookContentForApi(content: Dashboards.Content): Dashboards.Content {
  return {
    ...content,
    layout: content.layout.map(unmapChartBlockSqlForApi),
  }
}
