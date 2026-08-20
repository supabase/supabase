import { useRef, useState } from 'react'

import { identifyQueryType } from './AIAssistant.utils'
import {
  changeAssistantQuerySource,
  createAssistantQueryModel,
  DEFAULT_ASSISTANT_QUERY_TITLE,
  getAssistantQueryDisplay,
  setAssistantQuerySql,
  toAssistantQueryResult,
} from './AssistantQueryCell.utils'
import { Confirm } from './Confirm'
import { type ConfirmFooterApprovalState } from './Confirm.utils'
import { QueryEditor } from '@/components/interfaces/Explorer/QueryEditor'
import { type QueryDisplay, type QueryResult } from '@/components/interfaces/Explorer/types'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useTrack } from '@/lib/telemetry/track'
import { useLocalRoleImpersonationState } from '@/state/role-impersonation-state'

interface AssistantQueryCellProps {
  id: string
  sql: string
  title?: string
  initialRows?: unknown
  view?: 'table' | 'chart'
  xAxis?: string
  yAxis?: string
  /** Follow incoming SQL while the assistant is still streaming the query text. */
  isStreaming?: boolean
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

/** Assistant adapter around the shared QueryEditor. Local state only — nothing is persisted. */
export const AssistantQueryCell = ({
  id,
  sql: initialSql,
  title: initialTitle,
  initialRows,
  view,
  xAxis,
  yAxis,
  isStreaming = false,
  confirmState,
  onApprove,
  onDeny,
}: AssistantQueryCellProps) => {
  const track = useTrack()
  const roleImpersonationState = useLocalRoleImpersonationState()

  const [title, setTitle] = useState(initialTitle?.trim() || DEFAULT_ASSISTANT_QUERY_TITLE)
  const [query, setQuery] = useState(() => createAssistantQueryModel(initialSql))
  const [result, setResult] = useState<QueryResult | undefined>(() =>
    toAssistantQueryResult(initialRows)
  )
  const [display, setDisplay] = useState<QueryDisplay>(() =>
    getAssistantQueryDisplay({ view, xAxis, yAxis })
  )

  const prevId = useRef(id)
  const prevSql = useRef(initialSql)
  const prevRows = useRef(initialRows)

  if (prevId.current !== id) {
    prevId.current = id
    prevSql.current = initialSql
    prevRows.current = initialRows
    setTitle(initialTitle?.trim() || DEFAULT_ASSISTANT_QUERY_TITLE)
    setQuery(createAssistantQueryModel(initialSql))
    setResult(toAssistantQueryResult(initialRows))
    setDisplay(getAssistantQueryDisplay({ view, xAxis, yAxis }))
  }

  if (prevSql.current !== initialSql) {
    prevSql.current = initialSql
    if (isStreaming) {
      setQuery((current) => setAssistantQuerySql(current, initialSql))
    }
  }

  if (prevRows.current !== initialRows) {
    prevRows.current = initialRows
    setResult(toAssistantQueryResult(initialRows))
  }

  const handleTitleChange = (value: string) => {
    const nextTitle = value.trim()
    if (!nextTitle) return
    setTitle(nextTitle)
  }

  const handleSourceChange = (source: QuerySourceBinding) => {
    const isBackendChange = source._tag !== query._tag
    if (isBackendChange) setResult(undefined)
    setQuery((current) => changeAssistantQuerySource(current, source))
  }

  const handleRun = () => {
    const sql = query.uncheckedSql
    const mutationType = identifyQueryType(sql)
    track('assistant_suggestion_run_query_clicked', {
      queryType: mutationType ? 'mutation' : 'select',
      ...(mutationType ? { mutationType } : {}),
    })
  }

  const isConfirming = confirmState !== undefined

  return (
    <Confirm
      fill
      className="h-96"
      state={confirmState}
      message="Assistant wants to run this query"
      cancelLabel="Skip"
      confirmLabel="Run query"
      confirmLabelLoading="Running..."
      onCancel={onDeny}
      onConfirm={onApprove}
    >
      <QueryEditor
        id={id}
        variant="viewport"
        title={title}
        query={query}
        result={result}
        roleImpersonationState={roleImpersonationState}
        display={display}
        isRunDisabled={isConfirming}
        onTitleChange={handleTitleChange}
        onSqlChange={(sql) => setQuery((current) => setAssistantQuerySql(current, sql))}
        onSourceChange={handleSourceChange}
        onResultChange={setResult}
        onRowLimitChange={(rowLimit) =>
          setQuery((current) => (current._tag === 'database' ? { ...current, rowLimit } : current))
        }
        onDisplayChange={setDisplay}
        onRun={handleRun}
      />
    </Confirm>
  )
}
