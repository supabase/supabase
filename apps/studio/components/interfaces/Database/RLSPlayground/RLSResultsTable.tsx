import type { PostgresPolicy } from '@supabase/postgres-meta'
import { RLSSimulationResult, RLSRowResult } from 'data/rls-playground'
import {
  cn,
  Badge,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { CheckCircle2, XCircle, AlertCircle, Info, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'

interface RLSResultsTableProps {
  result: RLSSimulationResult | null
  policies: PostgresPolicy[]
  isLoading: boolean
}

export const RLSResultsTable = ({
  result,
  policies,
  isLoading,
}: RLSResultsTableProps) => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] text-foreground-lighter">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full" />
          <span>Running simulation...</span>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-foreground-lighter gap-2">
        <Info className="h-8 w-8" />
        <p className="text-center">
          Select a table and click "Run Simulation" to see
          <br />
          which rows are accessible with the current context.
        </p>
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-destructive gap-2">
        <AlertCircle className="h-8 w-8" />
        <p className="text-center">
          Simulation Error
          <br />
          <span className="text-sm text-foreground-lighter">{result.error}</span>
        </p>
      </div>
    )
  }

  // Get column names from the first row
  const columns = result.rows.length > 0 ? Object.keys(result.rows[0].row_data) : []

  // Summary stats
  const totalRows = result.total_rows_without_rls
  const accessibleRows = result.accessible_rows
  const blockedRows = totalRows - accessibleRows
  const accessRate = totalRows > 0 ? ((accessibleRows / totalRows) * 100).toFixed(1) : '0'

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          {/* RLS Status */}
          {result.rls_enabled ? (
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-brand" />
              <span>RLS Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-warning">
              <Unlock className="h-4 w-4" />
              <span>RLS Disabled (all rows visible)</span>
            </div>
          )}
        </div>

        {/* Access Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            <span>{accessibleRows} accessible</span>
          </div>
          {blockedRows > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{blockedRows} blocked</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {accessRate}% access rate
          </Badge>
        </div>
      </div>

      {/* Context Summary */}
      <div className="bg-surface-100 rounded-md p-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="text-foreground-lighter">Simulated as:</span>
          <Badge variant="default">{result.context.role}</Badge>
          {result.context.userId && (
            <span className="text-foreground-lighter">
              user_id: <code className="text-foreground">{result.context.userId}</code>
            </span>
          )}
        </div>
      </div>

      {/* Results Table */}
      {result.rows.length > 0 ? (
        <ScrollArea className="h-[350px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-100">
                <TableHead className="w-[100px]">Access</TableHead>
                <TableHead className="w-[120px]">Policies</TableHead>
                {columns.slice(0, 5).map((col) => (
                  <TableHead key={col} className="font-mono text-xs">
                    {col}
                  </TableHead>
                ))}
                {columns.length > 5 && (
                  <TableHead className="text-xs text-foreground-lighter">
                    +{columns.length - 5} more
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedRow === idx && 'bg-surface-200'
                  )}
                  onClick={() => setSelectedRow(selectedRow === idx ? null : idx)}
                >
                  <TableCell>
                    {row.accessible ? (
                      <div className="flex items-center gap-1 text-brand">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Allowed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Blocked</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <PolicyStatusBadges evaluations={row.policies_evaluated} />
                  </TableCell>
                  {columns.slice(0, 5).map((col) => (
                    <TableCell key={col} className="font-mono text-xs max-w-[200px] truncate">
                      {formatCellValue(row.row_data[col])}
                    </TableCell>
                  ))}
                  {columns.length > 5 && (
                    <TableCell className="text-xs text-foreground-lighter">...</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] border rounded-md text-foreground-lighter gap-2">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="text-center">
            No rows accessible with current context
            <br />
            <span className="text-xs">
              {result.total_rows_without_rls > 0
                ? `${result.total_rows_without_rls} rows exist but are blocked by RLS`
                : 'Table is empty'}
            </span>
          </p>
        </div>
      )}

      {/* Selected Row Details */}
      {selectedRow !== null && result.rows[selectedRow] && (
        <PolicyEvaluationDetails
          row={result.rows[selectedRow]}
          policies={policies}
        />
      )}
    </div>
  )
}

// Helper component for policy status badges
const PolicyStatusBadges = ({
  evaluations,
}: {
  evaluations: RLSRowResult['policies_evaluated']
}) => {
  const passed = evaluations.filter((e) => e.passed).length
  const failed = evaluations.filter((e) => !e.passed).length

  return (
    <div className="flex items-center gap-1">
      {passed > 0 && (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="default" className="text-xs bg-brand/10 text-brand">
              {passed} ✓
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {passed} {passed === 1 ? 'policy' : 'policies'} passed
          </TooltipContent>
        </Tooltip>
      )}
      {failed > 0 && (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="text-xs">
              {failed} ✗
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {failed} {failed === 1 ? 'policy' : 'policies'} failed
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// Helper component for detailed policy evaluation
const PolicyEvaluationDetails = ({
  row,
  policies,
}: {
  row: RLSRowResult
  policies: PostgresPolicy[]
}) => {
  return (
    <div className="bg-surface-100 rounded-md p-4">
      <h4 className="text-sm font-medium mb-3">Policy Evaluation Details</h4>
      <div className="space-y-2">
        {row.policies_evaluated.map((eval_) => {
          const policy = policies.find((p) => p.id === eval_.policy_id)
          return (
            <div
              key={eval_.policy_id}
              className={cn(
                'flex items-start gap-3 p-2 rounded border',
                eval_.passed
                  ? 'bg-brand/5 border-brand/20'
                  : 'bg-destructive/5 border-destructive/20'
              )}
            >
              {eval_.passed ? (
                <CheckCircle2 className="h-4 w-4 text-brand mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{eval_.policy_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {eval_.command}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {eval_.action}
                  </Badge>
                </div>
                {eval_.expression && (
                  <pre className="mt-1 text-xs text-foreground-lighter overflow-x-auto">
                    USING: {eval_.expression}
                  </pre>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Row Data */}
      <div className="mt-4 pt-4 border-t">
        <h5 className="text-xs font-medium text-foreground-lighter mb-2">Row Data</h5>
        <pre className="text-xs bg-surface-200 p-2 rounded overflow-x-auto">
          {JSON.stringify(row.row_data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

// Helper to format cell values
const formatCellValue = (value: any): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}
