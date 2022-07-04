import { Button, IconPlay } from '@supabase/ui'
import { useProjectContext } from 'data/projects/ProjectContext'
import { useExecuteQueryMutation } from 'data/sql/useExecuteQueryMutation'
import { useCallback } from 'react'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import MonacoEditor from './MonacoEditor'
import UtilityTabResults from './UtilityTabResults'

type SQLCardProps = {
  id: string
}

const SQLCard = ({ id }: SQLCardProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id]

  const { isLoading: isExecuting, mutate: execute } = useExecuteQueryMutation({
    onSuccess(data) {
      if (id) {
        snap.addResult(id, data.result)
      }
    },
    onError(error) {
      if (id) {
        snap.addResultError(id, error)
      }
    },
  })
  const executeQuery = useCallback(
    (overrideSql?: string) => {
      // use the latest state
      const state = getSqlEditorStateSnapshot()
      const snippet = id && state.snippets[id]

      if (project && snippet && !isExecuting) {
        execute?.({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: overrideSql ?? snippet.snippet.content.sql,
        })
      }
    },
    [isExecuting, project]
  )

  return (
    <div className="overflow-hidden rounded-md border shadow-md">
      <div className="flex items-center justify-between border-b">
        <p className="px-4 py-2">{snippet.snippet.name}</p>

        <div className="px-2">
          <Button icon={<IconPlay />} onClick={() => executeQuery()}>
            Run Query
          </Button>
        </div>
      </div>

      <div>
        <div className="h-[150px]">
          <MonacoEditor id={id} executeQuery={executeQuery} />
        </div>

        <hr />

        <div className="h-[150px]">
          <UtilityTabResults id={id} isExecuting={isExecuting} />
        </div>
      </div>
    </div>
  )
}

export default SQLCard
