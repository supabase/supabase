import { useRef, useState } from 'react'

import { identifyQueryType } from './AIAssistant.utils'
import {
  changeAssistantQuerySource,
  createAssistantQueryModel,
  DEFAULT_ASSISTANT_LOGS_QUERY_TITLE,
  DEFAULT_ASSISTANT_QUERY_TITLE,
  getAssistantQueryDisplay,
  setAssistantQuerySql,
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
  initialResult?: QueryResult
  source?: QuerySourceBinding
  view?: 'table' | 'chart'
  xAxis?: string
  yAxis?: string
  /** Follow incoming SQL while the assistant is still streaming the query text. */
  isStreaming?: boolean
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

const DEFAULT_SOURCE: QuerySourceBinding = { _tag: 'database' }

/** Assistant adapter around the shared QueryEditor. Local state only — nothing is persisted. */
export const AssistantQueryCell = ({
  id,
  sql: initialSql,
  title: initialTitle,
  initialResult,
  source = DEFAULT_SOURCE,
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

  const fallbackTitle =
    initialTitle?.trim() ||
    (source._tag === 'logs' ? DEFAULT_ASSISTANT_LOGS_QUERY_TITLE : DEFAULT_ASSISTANT_QUERY_TITLE)

  const hasExplicitAxes = Boolean(xAxis || yAxis)

  const [title, setTitle] = useState(fallbackTitle)
  const [query, setQuery] = useState(() => createAssistantQueryModel(initialSql, source))
  // undefined uses the tool output; null intentionally clears it after changing source.
  const [resultOverride, setResultOverride] = useState<QueryResult | null>()
  const [localDisplay, setLocalDisplay] = useState<QueryDisplay | undefined>(undefined)
  const previousId = useRef(id)

  if (previousId.current !== id) {
    previousId.current = id
    setTitle(fallbackTitle)
    setQuery(createAssistantQueryModel(initialSql, source))
    setResultOverride(undefined)
    setLocalDisplay(undefined)
  }

  if (isStreaming && query.uncheckedSql !== initialSql) {
    setQuery((current) => setAssistantQuerySql(current, initialSql))
  }

  const result = resultOverride === undefined ? initialResult : (resultOverride ?? undefined)
  const display =
    localDisplay ??
    getAssistantQueryDisplay({
      view,
      xAxis,
      yAxis,
      sql: query.uncheckedSql,
      rows: result?.rows,
    })

  const handleTitleChange = (value: string) => {
    const nextTitle = value.trim()
    if (!nextTitle) return
    setTitle(nextTitle)
  }

  const handleSourceChange = (nextSource: QuerySourceBinding) => {
    const isBackendChange = nextSource._tag !== query._tag
    if (isBackendChange) {
      setResultOverride(null)
      if (!hasExplicitAxes) setLocalDisplay(undefined)
    }
    setQuery((current) => changeAssistantQuerySource(current, nextSource))
  }

  const handleDisplayChange = (nextDisplay: QueryDisplay) => {
    setLocalDisplay(nextDisplay)
  }

  const handleResultChange = (nextResult: QueryResult) => {
    setResultOverride(nextResult)
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
        onResultChange={handleResultChange}
        onRowLimitChange={(rowLimit) =>
          setQuery((current) => (current._tag === 'database' ? { ...current, rowLimit } : current))
        }
        onDisplayChange={handleDisplayChange}
        onRun={handleRun}
      />
    </Confirm>
  )
}
