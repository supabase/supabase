import { Typography } from '@supabase/ui'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const snap = useSqlEditorStateSnapshot()
  const utilityPanelCollapsed = snap.snippets[id].utilityPanelCollapsed
  const result = snap.results[id][0]

  if (utilityPanelCollapsed) return null
  if (isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <Typography.Text>
          <p className="m-0 border-0 px-6 py-4 font-mono">{result.error.message ?? result.error}</p>
        </Typography.Text>
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <Typography.Text type="secondary">
          <p className="m-0 border-0 px-6 py-4 ">
            Click <Typography.Text code>RUN</Typography.Text> to execute your query.
          </p>
        </Typography.Text>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Results rows={result.rows} />
    </div>
  )
}

export default UtilityTabResults
