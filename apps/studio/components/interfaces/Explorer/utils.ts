import { untrustedSql } from '@supabase/pg-meta'

import { DEFAULT_CELL_ROW_LIMIT } from './QueryCell/QueryCell.utils'
import { generateDraftId } from '@/data/content/notebooks/notebook-schema'

export const createQueryCellSkeleton = ({ sql }: { sql?: string } = {}) => {
  return {
    _tag: 'database_cell' as const,
    _id: generateDraftId(),
    view: 'table' as const,
    chart: undefined,
    unchecked_sql: untrustedSql(sql ?? ''),
    row_limit: DEFAULT_CELL_ROW_LIMIT,
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
