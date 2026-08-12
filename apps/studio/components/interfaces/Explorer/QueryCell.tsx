import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { CodeSquare, Eye, EyeOff, Play, Settings2 } from 'lucide-react'
import { useState } from 'react'

import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
} from './ExplorerQuery'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type DatabaseCell as DatabaseCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface QueryCellProps {
  cell: DatabaseCellSchema
  onCommitChanges: (sql: string) => void
}

// [Joshen] Note that this is visually quite similar to ReportBlock.tsx, but functionally
// rather different, so am opting to spin up a new UI component rather than trying to extend
// ReportBlock.tsx, so that its easier to clean up when we sunset custom reports. But will based
// the functionality off ReportBlocks quite closely.

export const QueryCell = ({ cell, onCommitChanges }: QueryCellProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { title = 'Untitled snippet', row_limit } = cell

  const [showQuery, setShowQuery] = useState(true)
  const [value, setValue] = useState<string>(cell.unchecked_sql)
  const [results, setResults] = useState<Object[]>([])

  const valueRef = useLatest(value)
  const onCommitChangesRef = useLatest(onCommitChanges)

  const {
    mutateAsync: executeQuery,
    isSuccess,
    isPending: isExecuting,
  } = useExecuteSqlMutation({
    onSuccess: (data) => setResults(data.result),
    onError: () => {},
  })

  const handleCommit = () => {
    onCommitChangesRef.current(valueRef.current)
  }

  const onRunQuery = async () => {
    if (!project) return console.error('Project is required')

    executeQuery({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: acceptUntrustedSql(untrustedSql(value)),
    })
  }

  return (
    <SortableSection gripClassName="mt-2.5" id={cell.id}>
      <ExplorerQuery>
        <ExplorerToolbar>
          <ExplorerToolbarIcon>
            <CodeSquare size={14} />
          </ExplorerToolbarIcon>
          <ExplorerToolbarTitle>{title}</ExplorerToolbarTitle>
          <ExplorerToolbarActions>
            <ExplorerToolbarAction icon={<Settings2 />} tooltip="Display settings" />
            <ExplorerToolbarAction
              icon={showQuery ? <EyeOff /> : <Eye />}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => setShowQuery((prev) => !prev)}
            />
            <ExplorerToolbarAction
              loading={isExecuting}
              icon={<Play />}
              tooltip="Run query"
              onClick={onRunQuery}
            />
          </ExplorerToolbarActions>
        </ExplorerToolbar>

        {showQuery && (
          <ExplorerQueryEditor>
            <CodeEditor
              language="pgsql"
              value={value}
              onInputChange={(v) => setValue(v ?? '')}
              className="h-32"
              onMount={(editor) => {
                editor.onDidBlurEditorWidget(handleCommit)
              }}
            />
          </ExplorerQueryEditor>
        )}

        <ExplorerQueryResults className="flex items-center justify-center">
          {results.length === 0 && !isSuccess && (
            <p className="text-xs text-foreground-lighter">Run the query to see results</p>
          )}
        </ExplorerQueryResults>

        <ExplorerQueryFooter className="flex items-center gap-x-2">
          <p>{results.length.toLocaleString()} rows</p>
          <p>·</p>
          <p>Limit {row_limit} rows</p>
        </ExplorerQueryFooter>
      </ExplorerQuery>
    </SortableSection>
  )
}
