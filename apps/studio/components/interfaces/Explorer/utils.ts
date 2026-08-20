import { untrustedSql } from '@supabase/pg-meta'

import { DEFAULT_CELL_ROW_LIMIT } from './QueryCell/QueryCell.utils'
import { generateDraftId } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import type { Notebooks } from '@/types'

export const createQueryCellSkeleton = ({ title, sql }: { title?: string; sql?: string } = {}) => {
  return {
    title,
    _tag: 'database_cell' as const,
    _id: generateDraftId(),
    view: 'table' as const,
    chart: undefined,
    unchecked_sql: untrustedSql(sql ?? ''),
    row_limit: DEFAULT_CELL_ROW_LIMIT,
  }
}

const DEFAULT_LOG_TIME_RANGE: Notebooks.TimeRange = {
  _tag: 'relative_time_range',
  unit: 'hour',
  amount: 1,
}

export const createLogCellSkeleton = ({
  sql,
  title,
  time_range = DEFAULT_LOG_TIME_RANGE,
}: { sql?: string; title?: string; time_range?: Notebooks.TimeRange } = {}) => {
  return {
    title,
    _tag: 'log_cell' as const,
    id: generateDraftId(),
    view: 'table' as const,
    chart: undefined,
    unchecked_sql: untrustedLogSql(sql ?? ''),
    time_range,
  }
}

const DEFAULT_MARKDOWN_CONTENT = `
  # New section
  Add notes about your queries and results
`.trim()

export const createMarkdownCellSkeleton = ({
  content = DEFAULT_MARKDOWN_CONTENT,
}: {
  content?: string
} = {}) => {
  return {
    _tag: 'markdown_cell' as const,
    _id: generateDraftId(),
    text: content,
  }
}
