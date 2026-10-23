import { useState } from 'react'

import {
  getCellDisplay,
  toQueryModel,
} from '@/components/interfaces/Explorer/QueryCell/QueryCell.utils'
import { QueryEditor } from '@/components/interfaces/Explorer/QueryEditor'
import type { QueryDisplay, QueryResult } from '@/components/interfaces/Explorer/types'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor/MarkdownEditor'
import {
  isQueryCell,
  notebookDomainSchema,
  type QueryCell,
} from '@/data/content/notebooks/notebook-schema'
import type { IssueCell, IssueDocument, IssueQuerySnapshot } from '@/data/issues/issue-schema'
import { useLocalRoleImpersonationState } from '@/state/role-impersonation-state'

type IssueQueryCellWire = Extract<IssueCell, { _tag: 'database_cell' | 'log_cell' }>

/**
 * Parses a stored cell into the notebook domain shape, so it goes through the same
 * normalization (branded SQL, default view) as a cell opened in a notebook.
 */
function toDomainQueryCell(id: string, cell: IssueQueryCellWire): QueryCell | undefined {
  const parsed = notebookDomainSchema.safeParse({
    schema_version: 1,
    cells: [{ ...cell, _id: id }],
  })
  const [domainCell] = parsed.success ? parsed.data.cells : []
  return domainCell && isQueryCell(domainCell) ? domainCell : undefined
}

const IssueQueryCell = ({
  id,
  cell,
  asOf,
  snapshot,
}: {
  id: string
  cell: QueryCell
  // The document's `as_of`, which relative log ranges count back from
  asOf: string | null | undefined
  snapshot?: IssueQuerySnapshot
}) => {
  const roleImpersonationState = useLocalRoleImpersonationState()
  const [title, setTitle] = useState(cell.title ?? 'Query')
  const [sql, setSql] = useState<string>(cell.unchecked_sql)
  const [showQuery, setShowQuery] = useState(false)
  const [display, setDisplay] = useState<QueryDisplay>(() => getCellDisplay(cell))
  // A query written into an issue keeps what it returned at the time; running it again
  // replaces that with live results
  const [result, setResult] = useState<QueryResult | undefined>(
    snapshot ? { rows: snapshot.rows } : undefined
  )

  return (
    <QueryEditor
      isReadOnly
      id={id}
      variant="embedded"
      className="min-h-0"
      title={title}
      query={toQueryModel(cell, sql, asOf)}
      result={result}
      showQuery={showQuery}
      onShowQueryChange={setShowQuery}
      roleImpersonationState={roleImpersonationState}
      display={display}
      onTitleChange={setTitle}
      onSqlChange={setSql}
      onResultChange={setResult}
      onDisplayChange={setDisplay}
    />
  )
}

/**
 * Renders an issue body or comment. These use the notebook document format, so they're
 * drawn with the notebook's own pieces: the markdown editor (read-only) and the shared
 * query editor, runnable against the project.
 */
export const IssueDocumentView = ({ id, document }: { id: string; document: IssueDocument }) => (
  <div className="flex flex-col gap-3">
    {document.cells.map((cell, index) => {
      const cellId = `${id}-${index}`

      if (cell._tag === 'markdown_cell') {
        return (
          <MarkdownEditor
            key={cellId}
            isReadOnly
            value={cell.text}
            className="px-0 py-0 text-sm text-foreground-light"
          />
        )
      }

      const domainCell = toDomainQueryCell(cellId, cell)
      if (!domainCell) return null
      return (
        <IssueQueryCell
          key={cellId}
          id={cellId}
          cell={domainCell}
          asOf={document.as_of}
          snapshot={cell.snapshot}
        />
      )
    })}
  </div>
)
