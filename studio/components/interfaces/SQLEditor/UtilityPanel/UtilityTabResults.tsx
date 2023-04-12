import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id]
  const result = snap.results[id]?.[0]
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  if (isUtilityPanelCollapsed) return null

  if (isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono">{result.error.message ?? result.error}</p>
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 text-sm text-scale-1100">
          Click <code>RUN</code> to execute your query.
        </p>
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
