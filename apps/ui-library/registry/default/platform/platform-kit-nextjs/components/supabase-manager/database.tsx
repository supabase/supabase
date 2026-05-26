'use client'

import { AlertTriangle, Table, Wand } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z, type ZodTypeAny } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { DynamicForm } from '@/registry/default/platform/platform-kit-nextjs/components/dynamic-form'
import { SqlEditor } from '@/registry/default/platform/platform-kit-nextjs/components/sql-editor'
import { useSheetNavigation } from '@/registry/default/platform/platform-kit-nextjs/contexts/SheetNavigationContext'
import { useRunQuery } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-run-query'
import { useListTables } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-tables'

// Helper to generate a Zod schema from the table's column definitions
function generateZodSchema(table: any): z.ZodObject<any, any, any> {
  if (!table || !table.columns) {
    return z.object({})
  }

  const shape: Record<string, ZodTypeAny> = {}
  for (const column of table.columns) {
    // We can only edit updatable columns that are not generated
    if (!column.is_updatable || column.is_generated) continue

    let fieldSchema: ZodTypeAny
    const dataType = column.data_type.toLowerCase()

    if (dataType.includes('array')) {
      fieldSchema = z.array(z.any())
    } else if (dataType.includes('int') || dataType.includes('numeric')) {
      fieldSchema = z.number()
    } else if (dataType.includes('bool')) {
      fieldSchema = z.boolean()
    } else if (
      dataType === 'user-defined' &&
      column.enums &&
      Array.isArray(column.enums) &&
      column.enums.length > 0
    ) {
      // Handle enum types
      fieldSchema = z.enum(column.enums as [string, ...string[]])
    } else {
      // Default to string for text, varchar, timestamp, uuid, etc.
      fieldSchema = z.string()
    }

    if (column.is_nullable) {
      fieldSchema = fieldSchema.nullish()
    }

    shape[column.name] = fieldSchema
  }
  return z.object(shape)
}

const getPrimaryKeys = (table: any): string[] => {
  if (!table || !table.primary_keys) {
    return []
  }
  return table.primary_keys.map((pk: any) => pk.name)
}

function EditRowView({
  projectRef,
  table,
  row,
  onSuccess,
}: {
  projectRef: string
  table: any
  row: any
  onSuccess: () => void
}) {
  const { mutate: runUpdateQuery, isPending: isUpdatePending } = useRunQuery()
  const formSchema = useMemo(() => generateZodSchema(table), [table])

  const columnInfo = useMemo(() => {
    if (!table || !table.columns) return {}

    const info: Record<string, any> = {}
    for (const column of table.columns) {
      // Only include updatable columns that are not generated
      if (!column.is_updatable || column.is_generated) continue

      const dataType = column.data_type.toLowerCase()
      const displayType =
        dataType === 'user-defined' &&
        column.enums &&
        Array.isArray(column.enums) &&
        column.enums.length > 0
          ? 'enum'
          : dataType

      info[column.name] = {
        data_type: displayType,
        is_nullable: column.is_nullable,
      }
    }
    return info
  }, [table])

  const handleFormSubmit = useCallback(
    (formData: any) => {
      const pks = getPrimaryKeys(table)
      if (pks.length === 0) {
        toast.error('Cannot update row. This table does not have a primary key.')
        return
      }

      const setClauses = Object.entries(formData)
        .map(([key, value]) => {
          if (JSON.stringify(row[key]) === JSON.stringify(value)) return null

          // Find the column type to determine formatting
          const column = table.columns.find((col: any) => col.name === key)
          const dataType = column?.data_type?.toLowerCase() || ''
          const isNullable = column?.is_nullable || false

          let formattedValue

          // Handle empty/null values
          if (
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim() === '')
          ) {
            if (isNullable) {
              formattedValue = 'NULL'
            } else if (dataType.includes('array')) {
              // Non-nullable array, set to empty array
              const jsonObj = JSON.stringify({ [key]: [] })
              formattedValue = `(select ${key} from json_populate_record(null::public."${
                table.name
              }", '${jsonObj.replace(/'/g, "''")}'))`
            } else {
              // Non-nullable text field, set to empty string
              formattedValue = "''"
            }
          } else if (Array.isArray(value) && value.length === 0) {
            // Explicitly empty array (different from null)
            const jsonObj = JSON.stringify({ [key]: [] })
            formattedValue = `(select ${key} from json_populate_record(null::public."${
              table.name
            }", '${jsonObj.replace(/'/g, "''")}'))`
          } else if (dataType.includes('array')) {
            // Array type with actual values - use json_populate_record syntax
            const jsonObj = JSON.stringify({ [key]: value })
            formattedValue = `(select ${key} from json_populate_record(null::public."${
              table.name
            }", '${jsonObj.replace(/'/g, "''")}'))`
          } else if (dataType === 'user-defined' && column?.enums) {
            // Handle enum values - treat as strings with proper escaping
            formattedValue = `'${String(value).replace(/'/g, "''")}'`
          } else if (typeof value === 'string') {
            formattedValue = `'${value.replace(/'/g, "''")}'`
          } else {
            formattedValue = value
          }

          return `"${key}" = ${formattedValue}`
        })
        .filter(Boolean)
        .join(', ')

      if (!setClauses) {
        toast.error('No changes to save')
        onSuccess()
        return
      }

      const whereClauses = pks
        .map((pk) => {
          const value = row[pk]
          const formattedValue =
            typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
          return `"${pk}" = ${formattedValue}`
        })
        .join(' AND ')

      const updateSql = `UPDATE public."${table.name}" SET ${setClauses} WHERE ${whereClauses};`

      runUpdateQuery({ projectRef, query: updateSql, readOnly: false }, { onSuccess })
    },
    [projectRef, table, row, runUpdateQuery, onSuccess]
  )

  return (
    <div className="px-6 pt-4 pb-10 lg:px-12 lg:pt-10">
      <h2 className="text-base lg:text-xl font-semibold mb-4">Editing row in {table.name}</h2>
      <DynamicForm
        schema={formSchema}
        initialValues={row}
        onSubmit={handleFormSubmit}
        isLoading={isUpdatePending}
        columnInfo={columnInfo}
      />
    </div>
  )
}

function TableRecordsView({ projectRef, table }: { projectRef: string; table: any }) {
  const { push, pop } = useSheetNavigation()
  const [refetchCounter, setRefetchCounter] = useState(0)

  const handleRowClick = useCallback(
    (row: any) => {
      push({
        title: `Editing row`,
        component: (
          <EditRowView
            projectRef={projectRef}
            table={table}
            row={row}
            onSuccess={() => {
              pop()
              setRefetchCounter((c) => c + 1)
            }}
          />
        ),
      })
    },
    [push, pop, projectRef, table]
  )

  return (
    <SqlEditor
      hideChartOption={true}
      projectRef={projectRef}
      label={`View records in ${table.name}`}
      initialSql={`SELECT * FROM public."${table.name}" LIMIT 100;`}
      queryKey={table.id}
      onRowClick={handleRowClick}
      hideSql={true}
      runAutomatically={true}
      refetch={refetchCounter}
      readOnly
    />
  )
}

export function DatabaseManager({ projectRef }: { projectRef: string }) {
  const { push } = useSheetNavigation()
  const { data: tables, isLoading, isError } = useListTables(projectRef, ['public'])

  const handleTableClick = useCallback(
    (table: any) => {
      push({
        title: table.name,
        component: <TableRecordsView projectRef={projectRef} table={table} />,
      })
    },
    [push, projectRef]
  )

  const handleNaturalLanguageQueryClick = useCallback(() => {
    push({
      title: 'Talk to your database',
      component: (
        <SqlEditor projectRef={projectRef} initialNaturalLanguageMode={true} hideSql={true} />
      ),
    })
  }, [push, projectRef])

  return (
    <div className="p-6 pt-4 lg:p-8 lg:pt-8">
      <div className="flex items-center justify-between mb-6 gap-6">
        <div className="flex-1">
          <h1 className="text-base lg:text-xl font-semibold">Database</h1>
          <p className="hidden lg:block text-sm lg:text-base text-muted-foreground mt-1">
            View and manage the data stored in your app.
          </p>
        </div>
        <Button
          variant="outline"
          key="talk-to-db"
          className="flex-row justify-between"
          onClick={handleNaturalLanguageQueryClick}
        >
          <Wand strokeWidth={1.5} size={16} />
          Query your database
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading tables</AlertTitle>
          <AlertDescription>There was a problem loading your database tables.</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {tables && tables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {tables.map((table: any) => (
            <Button
              variant="outline"
              key={table.id}
              size="lg"
              className="flex-row justify-between text-left"
              onClick={() => handleTableClick(table)}
            >
              <Table className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium font-mono truncate flex-1">{table.name}</h2>
              <div className="text-sm text-muted-foreground font-mono shrink-0">
                {table.live_rows_estimate} rows
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
