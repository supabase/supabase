import { AlertTriangle, Table, Wand } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useLocation } from 'wouter'
import { z, type ZodTypeAny } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { DynamicForm } from '@/registry/default/platform/platform-kit-nextjs/components/dynamic-form'
import { ResultsTable } from '@/registry/default/platform/platform-kit-nextjs/components/results-table'
import { SqlEditor } from '@/registry/default/platform/platform-kit-nextjs/components/sql-editor'
import { useManagerState } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/manager-state'
import {
  useTableRows,
  useUpdateRow,
} from '@/registry/default/platform/platform-kit-nextjs/hooks/use-table-rows'
import { useListTables } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-tables'
import { useFeatures } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import type { IntrospectedTable } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/introspection-types'

// Build a Zod schema from a table's editable columns.
function generateZodSchema(table: IntrospectedTable | undefined): z.ZodObject<any, any, any> {
  if (!table?.columns) return z.object({})

  const shape: Record<string, ZodTypeAny> = {}
  for (const column of table.columns) {
    if (!column.is_updatable || column.is_generated) continue

    let fieldSchema: ZodTypeAny
    const dataType = column.data_type.toLowerCase()

    if (dataType.includes('array')) {
      fieldSchema = z.array(z.any())
    } else if (dataType.includes('int') || dataType.includes('numeric')) {
      fieldSchema = z.number()
    } else if (dataType.includes('bool')) {
      fieldSchema = z.boolean()
    } else if (dataType === 'user-defined' && column.enums.length > 0) {
      fieldSchema = z.enum(column.enums as [string, ...string[]])
    } else {
      fieldSchema = z.string()
    }

    if (column.is_nullable) {
      fieldSchema = fieldSchema.nullish()
    }

    shape[column.name] = fieldSchema
  }
  return z.object(shape)
}

function getPrimaryKeys(table: IntrospectedTable | undefined): string[] {
  return table?.primary_keys?.map((pk) => pk.name) ?? []
}

export function EditRowView({ tableName }: { tableName: string }) {
  const [, navigate] = useLocation()
  const { editingRow } = useManagerState()
  const { data: tables } = useListTables(['public'])
  const table = tables?.find((t) => t.name === tableName)
  const { mutate: updateRow, isPending } = useUpdateRow()

  const backPath = `/database/${encodeURIComponent(tableName)}`

  const formSchema = useMemo(() => generateZodSchema(table), [table])

  const columnInfo = useMemo(() => {
    if (!table?.columns) return {}
    const info: Record<string, any> = {}
    for (const column of table.columns) {
      if (!column.is_updatable || column.is_generated) continue
      const dataType = column.data_type.toLowerCase()
      const displayType = dataType === 'user-defined' && column.enums.length > 0 ? 'enum' : dataType
      info[column.name] = { data_type: displayType, is_nullable: column.is_nullable }
    }
    return info
  }, [table])

  const handleFormSubmit = useCallback(
    (formData: any) => {
      if (!table || !editingRow) return

      const pks = getPrimaryKeys(table)
      if (pks.length === 0) {
        toast.error('Cannot update row. This table does not have a primary key.')
        return
      }

      const values: Record<string, any> = {}
      for (const [key, value] of Object.entries(formData)) {
        if (JSON.stringify(editingRow[key]) === JSON.stringify(value)) continue
        const column = table.columns.find((c) => c.name === key)
        let next = value
        if ((next === '' || next === undefined) && column?.is_nullable) {
          next = null
        }
        values[key] = next
      }

      if (Object.keys(values).length === 0) {
        toast.error('No changes to save')
        navigate(backPath)
        return
      }

      const match: Record<string, any> = {}
      for (const pk of pks) match[pk] = editingRow[pk]

      updateRow(
        { schema: 'public', table: tableName, values, match },
        { onSuccess: () => navigate(backPath) }
      )
    },
    [table, editingRow, tableName, updateRow, navigate, backPath]
  )

  if (!editingRow) {
    return (
      <div className="px-6 pt-4 lg:px-12 lg:pt-10">
        <Alert>
          <AlertTitle>No row selected</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(backPath)}>
              Back to {tableName}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-6 pb-10 pt-4 lg:px-12 lg:pt-10">
      <h2 className="mb-4 text-base font-semibold lg:text-xl">Editing row in {tableName}</h2>
      <DynamicForm
        schema={formSchema}
        initialValues={editingRow}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
        columnInfo={columnInfo}
      />
    </div>
  )
}

export function TableRecordsView({ tableName }: { tableName: string }) {
  const [, navigate] = useLocation()
  const { setEditingRow } = useManagerState()
  const { data, isLoading, isError } = useTableRows({ schema: 'public', table: tableName })

  const handleRowClick = useCallback(
    (row: any) => {
      setEditingRow(row)
      navigate(`/database/${encodeURIComponent(tableName)}/edit`)
    },
    [setEditingRow, navigate, tableName]
  )

  return (
    <div>
      <div className="px-6 pt-4 lg:px-8 lg:pt-8">
        <h2 className="font-semibold">Records in {tableName}</h2>
      </div>
      {isLoading && (
        <div className="space-y-2 p-4 px-6 lg:px-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {isError && (
        <div className="px-6 py-4 lg:px-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading rows</AlertTitle>
            <AlertDescription>There was a problem loading records for this table.</AlertDescription>
          </Alert>
        </div>
      )}
      {data && <ResultsTable data={data.rows} onRowClick={handleRowClick} />}
    </div>
  )
}

export function DatabaseQueryView() {
  const features = useFeatures()
  return <SqlEditor initialNaturalLanguageMode={features.naturalLanguageSql} hideSql />
}

export function DatabaseManager() {
  const [, navigate] = useLocation()
  const features = useFeatures()
  const { data: tables, isLoading, isError } = useListTables(['public'])

  const canQuery = features.runSql || features.naturalLanguageSql

  return (
    <div className="p-6 pt-4 lg:p-8 lg:pt-8">
      <div className="mb-6 flex items-center justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-base font-semibold lg:text-xl">Database</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground lg:block lg:text-base">
            View and manage the data stored in your app.
          </p>
        </div>
        {canQuery && (
          <Button
            variant="outline"
            className="flex-row justify-between"
            onClick={() => navigate('/database/query')}
          >
            <Wand strokeWidth={1.5} size={16} />
            Query your database
          </Button>
        )}
      </div>

      {isError && (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading tables</AlertTitle>
          <AlertDescription>There was a problem loading your database tables.</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {tables && tables.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Button
              variant="outline"
              key={table.id}
              size="lg"
              className="flex-row justify-between text-left"
              onClick={() => navigate(`/database/${encodeURIComponent(table.name)}`)}
            >
              <Table className="h-4 w-4 text-muted-foreground" />
              <h2 className="flex-1 truncate font-mono text-sm font-medium">{table.name}</h2>
              <div className="shrink-0 font-mono text-sm text-muted-foreground">
                {table.live_rows_estimate == null ? '—' : `${table.live_rows_estimate} rows`}
              </div>
            </Button>
          ))}
        </div>
      ) : !isLoading && (!tables || tables.length === 0) ? (
        <Alert className="mt-8">
          <Table className="h-4 w-4" />
          <AlertTitle>No database tables</AlertTitle>
          <AlertDescription>Create tables to store and organize your data.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
