import { untrustedSql } from '@supabase/pg-meta'
import { useState } from 'react'

import type { RenderedAlertIssueCell } from './AlertIssueNotebook.utils'
import { QueryEditor, type ExplorerQueryModel } from '@/components/interfaces/Explorer/QueryEditor'
import type { QueryResult } from '@/components/interfaces/Explorer/types'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

type ReadyCell = Extract<RenderedAlertIssueCell, { status: 'ready' }>

const LOG_TIME_RANGE = { _tag: 'relative_time_range', unit: 'hour', amount: 24 } as const

const toQueryModel = (cell: ReadyCell, sql: string): ExplorerQueryModel =>
  cell.source === 'database'
    ? { _tag: 'database', uncheckedSql: untrustedSql(sql), rowLimit: 100 }
    : { _tag: 'logs', uncheckedSql: untrustedLogSql(sql), time_range: LOG_TIME_RANGE }

/**
 * A query cell prefilled from an alert rule's SQL template. Edits stay local to the alert issue
 * view; the SQL only runs when the user clicks Run.
 */
export const AlertIssueQueryCell = ({ id, cell }: { id: string; cell: ReadyCell }) => {
  const [title, setTitle] = useState(cell.title)
  const [sql, setSql] = useState<string>(cell.sql)
  const [result, setResult] = useState<QueryResult>()
  const [showQuery, setShowQuery] = useState(true)

  return (
    <QueryEditor
      id={id}
      variant="embedded"
      className="h-full min-h-0"
      title={title}
      query={toQueryModel(cell, sql)}
      result={result}
      showQuery={showQuery}
      onShowQueryChange={setShowQuery}
      onTitleChange={setTitle}
      onSqlChange={setSql}
      onResultChange={setResult}
    />
  )
}
