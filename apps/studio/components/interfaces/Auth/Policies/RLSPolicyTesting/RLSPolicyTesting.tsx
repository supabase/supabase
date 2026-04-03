import type { PostgresTable } from '@supabase/postgres-meta'
import Editor from '@monaco-editor/react'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableDefinitionQuery } from 'data/database/table-definition-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useMigrationUpsertMutation } from 'data/database/migration-upsert-mutation'
import { AlertCircle, CheckCircle2, Loader2, Play, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
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

type RoleWithId = TestRole & { _id: string }

const DEFAULT_ROLES: RoleWithId[] = [
  { _id: 'default-anon', name: 'anon', role: 'anon' },
  {
    _id: 'default-auth',
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

function RoleEditor({
  role,
  canRemove,
  onUpdate,
  onRemove,
}: {
  role: RoleWithId
  canRemove: boolean
  onUpdate: (updates: Partial<TestRole>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-default bg-surface-100 p-3">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-foreground-lighter mb-1 block">Role</label>
          <Select_Shadcn_
            value={role.name}
            onValueChange={(value) => onUpdate({ name: value, role: value })}
          >
            <SelectTrigger_Shadcn_ className="h-8 text-sm">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="anon">anon</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="authenticated">authenticated</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div>
          <label className="text-xs text-foreground-lighter mb-1 block">User ID (uid)</label>
          <Input
            type="text"
            size="tiny"
            className="font-mono text-xs"
            placeholder="UUID..."
            value={role.uid ?? ''}
            onChange={(e) => onUpdate({ uid: e.target.value })}
            disabled={role.name === 'anon'}
          />
        </div>
        <div>
          <label className="text-xs text-foreground-lighter mb-1 block">Email</label>
          <Input
            type="text"
            size="tiny"
            className="font-mono text-xs"
            placeholder="user@example.com"
            value={role.email ?? ''}
            onChange={(e) => onUpdate({ email: e.target.value })}
            disabled={role.name === 'anon'}
          />
        </div>
      </div>
      {canRemove && (
        <Button
          type="text"
          size="tiny"
          icon={<Trash2 size={14} />}
          className="text-foreground-lighter hover:text-foreground"
          onClick={onRemove}
        />
      )}
    </div>
  )
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function RLSPolicyTesting({ schema, tables }: RLSPolicyTestingProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [policySql, setPolicySql] = useState('')
  const [roles, setRoles] = useState<RoleWithId[]>(DEFAULT_ROLES)
  const [dataLimit, setDataLimit] = useState(50)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false)

  const { status, results, error, dataRowCount, runTest } = useRLSPolicyTest()

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
        setShowMigrationConfirm(false)
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
        _id: crypto.randomUUID(),
        name: 'authenticated',
        uid: crypto.randomUUID(),
        email: `user${prev.length}@example.com`,
        role: 'authenticated',
      },
    ])
  }, [])

  const handleRemoveRole = useCallback((id: string) => {
    setRoles((prev) => prev.filter((r) => r._id !== id))
  }, [])

  const handleUpdateRole = useCallback((id: string, updates: Partial<TestRole>) => {
    setRoles((prev) => prev.map((r) => (r._id === id ? { ...r, ...updates } : r)))
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

    const rows = result as Record<string, unknown>[]
    if (!rows || rows.length === 0) return ''

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
    } catch (err: unknown) {
      setIsLoadingData(false)
      toast.error(getErrorMessage(err))
    }
  }, [selectedTable, tableDDL, policySql, schema, roles, runTest, fetchSampleData])

  const migrationSql = useMemo(() => {
    if (!policySql.trim()) return ''
    return selectedTable
      ? `ALTER TABLE "${schema}"."${selectedTable.name}" ENABLE ROW LEVEL SECURITY;\n\n${policySql.trim()}`
      : policySql.trim()
  }, [policySql, selectedTable, schema])

  const handleApplyAsMigration = useCallback(async () => {
    if (!project?.ref || !migrationSql) return

    try {
      await upsertMigration({
        projectRef: project.ref,
        query: migrationSql,
        name: `rls_policy_${selectedTable?.name ?? 'custom'}_${Date.now()}`,
      })
    } catch (err: unknown) {
      toast.error(`Failed to apply migration: ${getErrorMessage(err)}`)
    }
  }, [project, migrationSql, selectedTable, upsertMigration])

  const RUNNING_STATUSES = ['initializing', 'loading_schema', 'loading_data', 'testing'] as const
  const isRunning = (RUNNING_STATUSES as readonly string[]).includes(status)
  const statusMessage = {
    idle: '',
    initializing: 'Starting local Postgres...',
    loading_schema: 'Loading table schema...',
    loading_data: 'Loading sample data...',
    testing: 'Testing policy with each role...',
    done: `Tests complete (${dataRowCount} rows loaded)`,
    error: '',
  }[status]

  return (
    <div className="space-y-6" data-testid="rls-policy-testing">
      {/* Table selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Table</label>
        <div className="flex flex-wrap gap-2" data-testid="rls-testing-table-selector">
          {tables.map((table) => (
            <button
              key={table.id}
              data-testid={`rls-testing-table-${table.name}`}
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
            <div className="rounded-md border border-default overflow-hidden h-[200px]" data-testid="rls-testing-sql-editor">
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
              Number of rows to load from your table for testing. Data is fetched from your
              database and loaded into an in-browser Postgres instance for local testing.
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
                  Configure which roles to test the policy against. Each role is tested
                  in sequence within the same worker.
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
              {roles.map((role) => (
                <RoleEditor
                  key={role._id}
                  role={role}
                  canRemove={roles.length > 1}
                  onUpdate={(updates) => handleUpdateRole(role._id, updates)}
                  onRemove={() => handleRemoveRole(role._id)}
                />
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
              data-testid="rls-testing-run-button"
            >
              {isRunning || isLoadingData ? 'Testing...' : 'Run Test'}
            </Button>

            {status === 'done' && (
              <Button
                type="default"
                icon={<Save size={14} />}
                onClick={() => setShowMigrationConfirm(true)}
                data-testid="rls-testing-apply-migration-button"
              >
                Apply as Migration
              </Button>
            )}

            {statusMessage && (
              <div className="flex items-center gap-2 text-sm text-foreground-light" data-testid="rls-testing-status">
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

          {/* Migration confirmation modal */}
          <ConfirmationModal
            visible={showMigrationConfirm}
            variant="default"
            title="Apply policy as migration"
            description="This will create a new migration that enables RLS and applies the policy to your database. This action will be tracked in your migration history."
            confirmLabel="Apply Migration"
            confirmLabelLoading="Applying..."
            loading={isApplyingMigration}
            onCancel={() => setShowMigrationConfirm(false)}
            onConfirm={handleApplyAsMigration}
          >
            <div className="rounded-md bg-surface-200 p-3 mt-2">
              <pre className="text-xs font-mono text-foreground-light whitespace-pre-wrap overflow-x-auto max-h-[200px]">
                {migrationSql}
              </pre>
            </div>
          </ConfirmationModal>
        </>
      )}
    </div>
  )
}
