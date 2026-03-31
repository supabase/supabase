import { Check, X } from 'lucide-react'
import { cn } from 'ui'
import type { RoleTestResult } from './rls-test-worker'

interface RLSTestResultsProps {
  results: RoleTestResult[]
}

function Badge({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        allowed
          ? 'bg-brand-400/10 text-brand-600'
          : 'bg-destructive-400/10 text-destructive-600'
      )}
    >
      {allowed ? <Check size={12} /> : <X size={12} />}
      {allowed ? 'Allowed' : 'Denied'}
    </span>
  )
}

export function RLSTestResults({ results }: RLSTestResultsProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Test Results</h3>
      <div className="overflow-x-auto rounded-md border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default bg-surface-200">
              <th className="px-4 py-2 text-left font-medium text-foreground-light">Role</th>
              <th className="px-4 py-2 text-left font-medium text-foreground-light">User ID</th>
              <th className="px-4 py-2 text-center font-medium text-foreground-light">SELECT</th>
              <th className="px-4 py-2 text-center font-medium text-foreground-light">INSERT</th>
              <th className="px-4 py-2 text-center font-medium text-foreground-light">UPDATE</th>
              <th className="px-4 py-2 text-center font-medium text-foreground-light">DELETE</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <tr key={i} className="border-b border-default last:border-b-0">
                <td className="px-4 py-2 font-mono text-xs text-foreground">
                  {result.role.name}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-foreground-light">
                  {result.role.uid ? result.role.uid.slice(0, 8) + '...' : '—'}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge allowed={result.select.allowed} />
                    {result.select.allowed && (
                      <span className="text-xs text-foreground-lighter">
                        {result.select.rowCount} row{result.select.rowCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge allowed={result.insert.allowed} />
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge allowed={result.update.allowed} />
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge allowed={result.delete.allowed} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show visible rows per role */}
      {results.map(
        (result, i) =>
          result.select.allowed &&
          result.select.rows.length > 0 && (
            <div key={i} className="space-y-2">
              <h4 className="text-xs font-medium text-foreground-light">
                Rows visible to <span className="font-mono">{result.role.name}</span>{' '}
                ({result.select.rowCount})
              </h4>
              <div className="overflow-x-auto rounded-md border border-default max-h-[200px]">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-default bg-surface-200 sticky top-0">
                      {Object.keys(result.select.rows[0]).map((col) => (
                        <th key={col} className="px-3 py-1.5 text-left font-medium text-foreground-light">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.select.rows.slice(0, 20).map((row, ri) => (
                      <tr key={ri} className="border-b border-default last:border-b-0">
                        {Object.values(row).map((val, ci) => (
                          <td key={ci} className="px-3 py-1 text-foreground-light truncate max-w-[200px]">
                            {val === null ? <span className="text-foreground-muted italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}

      {/* Show errors */}
      {results.some(
        (r) => r.select.error || r.insert.error || r.update.error || r.delete.error
      ) && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-foreground-light">Errors</h4>
          <div className="space-y-1">
            {results.map((r, i) =>
              ['select', 'insert', 'update', 'delete'].map((op) => {
                const err = (r as any)[op].error
                if (!err || err.includes('new row violates row-level security')) return null
                return (
                  <div
                    key={`${i}-${op}`}
                    className="rounded-md bg-destructive-200/50 px-3 py-2 text-xs text-destructive-600"
                  >
                    <span className="font-medium">
                      {r.role.name} / {op.toUpperCase()}:
                    </span>{' '}
                    {err}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
