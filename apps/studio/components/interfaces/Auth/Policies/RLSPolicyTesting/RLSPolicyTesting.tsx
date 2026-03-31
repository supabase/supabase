import type { PostgresTable } from '@supabase/postgres-meta'
import Editor from '@monaco-editor/react'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useMigrationUpsertMutation } from 'data/database/migration-upsert-mutation'
import { AlertCircle, CheckCircle2, Loader2, Play, Plus, Save, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import type { TestRole } from './rls-test-worker'
import { RLSTestResults } from './RLSTestResults'
import { useRLSPolicyTest } from './useRLSPolicyTest'

const DEFAULT_POLICY_SQL = `-- Write your RLS policy here. Example:
CREATE POLICY "Users can view own data"
  ON {schema}.{table}
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);`

const DEFAULT_ROLES: TestRole[] = [
  { name: 'anon', role: 'anon' },
  {
    name: 'authenticated',
    uid: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    role: 'authenticated',
  },
]

interface RLSPolicyTestingProps {
  schema: string
  tables: (PostgresTable & { rls_enabled?: boolean })[]
}

export function RLSPolicyTesting({ schema, tables }: RLSPolicyTestingProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [policySql, setPolicySql] = useState('')
  const [roles, setRoles] = useState<TestRole[]>(DEFAULT_ROLES)
  const [dataLimit, setDataLimit] = useState(50)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const { status, results, error, dataRowCount, runTest, dispose } = useRLSPolicyTest()

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId),
    [tables, selectedTableId]
  )

  const { data: tableDDL } = useTableDefinitionQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: selectedTableId ?? undefined,
    },
    { enabled: !!selectedTableId }
  )

  const { mutateAsync: upsertMigration, isPending: isApplyingMigration } =
    useMigrationUpsertMutation({
      onSuccess: () => {
        toast.success('Policy applied as migration successfully!')
      },
    })

  const handleSelectTable = useCallback(
    (tableId: number) => {
      setSelectedTableId(tableId)
      const table = tables.find((t) => t.id === tableId)
      if (table) {
        setPolicySql(
          DEFAULT_POLICY_SQL.replace('{schema}', schema).replace('{table}', table.name)
        )
      }
    },
    [tables, schema]
  )

  const handleAddRole = useCallback(() => {
    setRoles((prev) => [
      ...prev,
      {
        name: 'authenticated',
        uid: crypto.randomUUID(),
        email: `user${prev.length}@example.com`,
        role: 'authenticated',
      },
    ])
  }, [])

  const handleRemoveRole = useCallback((index: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpdateRole = useCallback((index: number, updates: Partial<TestRole>) => {
    setRoles((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }, [])

  const fetchSampleData = useCallback(async (): Promise<string> => {
    if (!project?.ref || !selectedTable) return ''

    const sql = `SELECT * FROM "${schema}"."${selectedTable.name}" LIMIT ${dataLimit};`
    const { result } = await executeSql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql,
      queryKey: ['rls-test-data', selectedTable.id, dataLimit],
    })

    if (!result || (result as any[]).length === 0) return ''

    const rows = result as Record<string, unknown>[]
    if (rows.length === 0) return ''

    // Build INSERT statements from fetched data
    const columns = Object.keys(rows[0])
    const values = rows
      .map((row) => {
        const vals = columns.map((col) => {
          const val = row[col]
          if (val === null) return 'NULL'
          if (typeof val === 'number' || typeof val === 'boolean') return String(val)
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
          return `'${String(val).replace(/'/g, "''")}'`
        })
        return `(${vals.join(', ')})`
      })
      .join(',\n  ')

    return `INSERT INTO "${schema}"."${selectedTable.name}" (${columns.map((c) => `"${c}"`).join(', ')})\nVALUES\n  ${values};`
  }, [project, selectedTable, schema, dataLimit])

  const handleRunTest = useCallback(async () => {
    if (!selectedTable || !tableDDL || !policySql.trim()) {
      toast.error('Please select a table and write a policy to test')
      return
    }

    try {
      setIsLoadingData(true)
      const dataSql = await fetchSampleData()
      setIsLoadingData(false)

      await runTest({
        schemaSql: tableDDL,
        dataSql,
        policySql: policySql.trim(),
        tableName: selectedTable.name,
        schema,
        roles,
      })
    } catch (err: any) {
      setIsLoadingData(false)
      toast.error(err.message)
    }
  }, [selectedTable, tableDDL, policySql, schema, roles, runTest, fetchSampleData])

  const handleApplyAsMigration = useCallback(async () => {
    if (!project?.ref || !policySql.trim()) return

    const migrationSql = selectedTable
      ? `-- Enable RLS on ${schema}.${selectedTable.name}\nALTER TABLE "${schema}"."${selectedTable.name}" ENABLE ROW LEVEL SECURITY;\n\n${policySql.trim()}`
      : policySql.trim()

    try {
      await upsertMigration({
        projectRef: project.ref,
        query: migrationSql,
        name: `rls_policy_${selectedTable?.name ?? 'custom'}_${Date.now()}`,
      })
    } catch (err: any) {
      toast.error(`Failed to apply migration: ${err.message}`)
    }
  }, [project, policySql, selectedTable, schema, upsertMigration])

  const isRunning = status === 'initializing' || status === 'loading_schema' || status === 'loading_data' || status === 'testing'
  const statusMessage = {
    idle: '',
    initializing: 'Starting local Postgres...',
    loading_schema: 'Loading table schema...',
    loading_data: `Loading sample data...`,
    testing: 'Testing policy with each role...',
    done: `Tests complete (${dataRowCount} rows loaded)`,
    error: '',
  }[status]

  return (
    <div className="space-y-6">
      {/* Table selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Table</label>
        <div className="flex flex-wrap gap-2">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => handleSelectTable(table.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                selectedTableId === table.id
                  ? 'border-brand-500 bg-brand-400/10 text-brand-600'
                  : 'border-default bg-surface-100 text-foreground-light hover:bg-surface-200'
              )}
            >
              {table.name}
            </button>
          ))}
        </div>
        {tables.length === 0 && (
          <p className="text-sm text-foreground-lighter">
            No tables found in schema "{schema}". Create a table first.
          </p>
        )}
      </div>

      {selectedTable && (
        <>
          {/* Policy SQL Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Policy SQL</label>
            <p className="text-xs text-foreground-lighter">
              Write the CREATE POLICY statement to test. Uses{' '}
              <code className="rounded bg-surface-200 px-1">auth.uid()</code>,{' '}
              <code className="rounded bg-surface-200 px-1">auth.role()</code>, and{' '}
              <code className="rounded bg-surface-200 px-1">auth.email()</code> like production.
            </p>
            <div className="rounded-md border border-default overflow-hidden h-[200px]">
              <Editor
                theme="supabase"
                language="pgsql"
                value={policySql}
                onChange={(val) => setPolicySql(val ?? '')}
                options={{
                  tabSize: 2,
                  fontSize: 13,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3,
                }}
              />
            </div>
          </div>

          {/* Data sampling config */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sample Data Rows
            </label>
            <p className="text-xs text-foreground-lighter">
              Number of rows to load from your table for testing. Data is fetched ad-hoc and
              runs entirely in-browser — nothing leaves your machine.
            </p>
            <Input
              type="number"
              size="tiny"
              className="w-32"
              value={dataLimit}
              min={1}
              max={500}
              onChange={(e) => setDataLimit(Math.min(500, Math.max(1, Number(e.target.value))))}
            />
          </div>

          {/* Test Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Test Roles</label>
                <p className="text-xs text-foreground-lighter">
                  Configure which roles to test the policy against. Each runs in an isolated
                  worker thread.
                </p>
              </div>
              <Button
                type="default"
                size="tiny"
                icon={<Plus size={14} />}
                onClick={handleAddRole}
              >
                Add Role
              </Button>
            </div>

            <div className="space-y-2">
              {roles.map((role, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-default bg-surface-100 p-3"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-foreground-lighter mb-1 block">
                        Role
                      </label>
                      <select
                        className="w-full rounded-md border border-default bg-surface-200 px-2 py-1 text-sm text-foreground"
                        value={role.name}
                        onChange={(e) =>
                          handleUpdateRole(i, {
                            name: e.target.value,
                            role: e.target.value,
                          })
                        }
                      >
                        <option value="anon">anon</option>
                        <option value="authenticated">authenticated</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-foreground-lighter mb-1 block">
                        User ID (uid)
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-default bg-surface-200 px-2 py-1 text-xs font-mono text-foreground"
                        placeholder="UUID..."
                        value={role.uid ?? ''}
                        onChange={(e) => handleUpdateRole(i, { uid: e.target.value })}
                        disabled={role.name === 'anon'}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground-lighter mb-1 block">
                        Email
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-default bg-surface-200 px-2 py-1 text-xs font-mono text-foreground"
                        placeholder="user@example.com"
                        value={role.email ?? ''}
                        onChange={(e) => handleUpdateRole(i, { email: e.target.value })}
                        disabled={role.name === 'anon'}
                      />
                    </div>
                  </div>
                  {roles.length > 1 && (
                    <Button
                      type="text"
                      size="tiny"
                      icon={<Trash2 size={14} />}
                      className="text-foreground-lighter hover:text-foreground"
                      onClick={() => handleRemoveRole(i)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={
                isRunning || isLoadingData ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )
              }
              disabled={isRunning || isLoadingData || !policySql.trim()}
              onClick={handleRunTest}
            >
              {isRunning || isLoadingData ? 'Testing...' : 'Run Test'}
            </Button>

            {status === 'done' && (
              <Button
                type="default"
                icon={
                  isApplyingMigration ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )
                }
                disabled={isApplyingMigration}
                onClick={handleApplyAsMigration}
              >
                Apply as Migration
              </Button>
            )}

            {statusMessage && (
              <div className="flex items-center gap-2 text-sm text-foreground-light">
                {status === 'done' ? (
                  <CheckCircle2 size={14} className="text-brand-500" />
                ) : status === 'error' ? (
                  <AlertCircle size={14} className="text-destructive-500" />
                ) : null}
                {statusMessage}
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-md border border-destructive-500/20 bg-destructive-200/50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-destructive-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive-600">Test Error</p>
                  <p className="text-xs text-destructive-500 mt-1 font-mono whitespace-pre-wrap">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <RLSTestResults results={results} />
        </>
      )}
    </div>
  )
}
