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
        {(result.error.message ?? result.error)?.includes(
          'canceling statement due to statement timeout'
        ) && (
          <p className="m-0 border-0 px-6 py-4 font-mono">
            You can either{' '}
            <a
              className="underline"
              href="https://iechor.com/docs/guides/platform/performance#examining-query-performance"
            >
              optimize your query
            </a>
            , or{' '}
            <a className="underline" href="https://iechor.com/docs/guides/database/timeouts">
              increase the statement timeout
            </a>
            .
          </p>
        )}
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
      <Results id={id} rows={result.rows} />
    </div>
  )
}

export default UtilityTabResults
