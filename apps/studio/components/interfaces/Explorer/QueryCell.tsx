import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { Eye, EyeOff, Play, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { SQL_ICON } from 'ui'

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

  const title = 'Snippet Title'
  const { row_limit } = cell

  const [showQuery, setShowQuery] = useState(true)
  const [value, setValue] = useState<string>(cell.unchecked_sql)
  const [results, setResults] = useState<Object[]>([])

  const valueRef = useLatest(value)
  const onCommitChangesRef = useLatest(onCommitChanges)

  const { mutateAsync: executeQuery, isPending: isExecuting } = useExecuteSqlMutation({
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
      <div className="w-full border rounded bg-surface-200 max-w-6xl mx-auto">
        <div className="border-b px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <SQL_ICON size={14} className="fill-foreground-light w-5 h-4 shrink-0 grow-0 " />
            <p className="text-sm">{title}</p>
          </div>
          <div className="flex items-center gap-x-1">
            {/* [Joshen] We might be able to re-use BlockViewConfiguration */}
            <ButtonTooltip
              variant="text"
              icon={<Settings2 />}
              className="px-1"
              tooltip={{ content: { side: 'bottom', text: 'Display settings' } }}
            />
            <ButtonTooltip
              variant="text"
              icon={showQuery ? <EyeOff /> : <Eye />}
              className="px-1"
              onClick={() => setShowQuery((prev) => !prev)}
              tooltip={{
                content: { side: 'bottom', text: showQuery ? 'Hide query' : 'Show query' },
              }}
            />
            <ButtonTooltip
              variant="text"
              icon={<Play />}
              className="px-1"
              loading={isExecuting}
              onClick={onRunQuery}
              tooltip={{ content: { side: 'bottom', text: 'Run query' } }}
            />
          </div>
        </div>

        <div className="bg-surface-100">
          {showQuery && (
            <div className="border-b">
              <CodeEditor
                language="pgsql"
                value={value}
                onInputChange={(v) => setValue(v ?? '')}
                className="h-32"
                onMount={(editor) => {
                  editor.onDidBlurEditorWidget(handleCommit)
                }}
              />
            </div>
          )}
          <div className="h-32 flex items-center justify-center">Results</div>
        </div>

        <div className="border-t px-3 py-1 flex items-center gap-x-2 text-xs font-mono text-foreground-lighter">
          <p>{results.length.toLocaleString()} rows</p>
          <p>·</p>
          <p>Limit {row_limit} rows</p>
        </div>
      </div>
    </SortableSection>
  )
}
