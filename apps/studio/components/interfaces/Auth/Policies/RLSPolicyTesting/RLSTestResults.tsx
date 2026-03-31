import { Check, X } from 'lucide-react'
import { cn } from 'ui'
import type { RoleTestResult } from './rls-test-worker'

const OPERATIONS = ['select', 'insert', 'update', 'delete'] as const
type Operation = (typeof OPERATIONS)[number]

interface RLSTestResultsProps {
  results: RoleTestResult[]
}

function StatusBadge({ allowed }: { allowed: boolean }) {
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

function VisibleRowsPreview({ result }: { result: RoleTestResult }) {
  if (!result.select.allowed || result.select.rows.length === 0) return null

  const columns = Object.keys(result.select.rows[0])

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-foreground-light">
        Rows visible to <span className="font-mono">{result.role.name}</span>{' '}
        ({result.select.rowCount})
      </h4>
      <div className="overflow-x-auto rounded-md border border-default max-h-[200px]">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-default bg-surface-200 sticky top-0">
              {columns.map((col) => (
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
}

function ErrorDetails({ results }: { results: RoleTestResult[] }) {
  const errors = results.flatMap((r) =>
    OPERATIONS.filter((op) => {
      const err = r[op].error
      return err && !err.includes('new row violates row-level security')
    }).map((op) => ({
      key: `${r.role.name}-${r.role.uid ?? 'no-uid'}-${op}`,
      roleName: r.role.name,
      operation: op.toUpperCase(),
      message: r[op].error!,
    }))
  )

  if (errors.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-foreground-light">Errors</h4>
      <div className="space-y-1">
        {errors.map((err) => (
          <div
            key={err.key}
            className="rounded-md bg-destructive-200/50 px-3 py-2 text-xs text-destructive-600"
          >
            <span className="font-medium">
              {err.roleName} / {err.operation}:
            </span>{' '}
            {err.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RLSTestResults({ results }: RLSTestResultsProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-4" data-testid="rls-test-results">
      <h3 className="text-sm font-medium text-foreground">Test Results</h3>
      <div className="overflow-x-auto rounded-md border border-default" data-testid="rls-test-results-table">
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
            {results.map((result) => {
              const roleKey = `${result.role.name}-${result.role.uid ?? 'no-uid'}`
              return (
                <tr key={roleKey} className="border-b border-default last:border-b-0">
                  <td className="px-4 py-2 font-mono text-xs text-foreground">
                    {result.role.name}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-foreground-light">
                    {result.role.uid ? result.role.uid.slice(0, 8) + '...' : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <StatusBadge allowed={result.select.allowed} />
                      {result.select.allowed && (
                        <span className="text-xs text-foreground-lighter">
                          {result.select.rowCount} row{result.select.rowCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge allowed={result.insert.allowed} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge allowed={result.update.allowed} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge allowed={result.delete.allowed} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {results.map((result) => (
        <VisibleRowsPreview
          key={`${result.role.name}-${result.role.uid ?? 'no-uid'}-rows`}
          result={result}
        />
      ))}

      <ErrorDetails results={results} />
    </div>
  )
}
