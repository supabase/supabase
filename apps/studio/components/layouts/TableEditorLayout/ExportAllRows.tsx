import saveAs from 'file-saver'
import Papa from 'papaparse'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import {
  MAX_EXPORT_ROW_COUNT,
  MAX_EXPORT_ROW_COUNT_MESSAGE,
} from 'components/grid/components/header/Header'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import type { SupaTable } from 'components/grid/types'
import { formatTableRowsToSQL } from 'components/interfaces/TableGridEditor/TableEntity.utils'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import type { Entity } from 'data/entity-types/entity-types-infinite-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { getTableEditor, type TableEditorData } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { fetchAllTableRows } from 'data/table-rows/table-rows-query'
import useLatest from 'hooks/misc/useLatest'
import { AlertTriangle } from 'lucide-react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const toLoggableError = (error: unknown): { message: string; stack: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack || '' }
  }
  if (!!error && typeof error === 'object') {
    return {
      message: 'message' in error ? String(error.message) : JSON.stringify(error),
      stack: '',
    }
  }
  return { message: String(error), stack: '' }
}

type FetchFormattedRowsParams = {
  queryClient: QueryClient
  projectRef: string
  connectionString: string | null
  entity: Entity
  bypassConfirmation: boolean
}

type FetchFormattedRowsReturn =
  | { status: 'require_confirmation'; reason: string }
  | { status: 'error'; customMessage: ReactNode | null }
  | { status: 'success'; table: SupaTable; formattedRows: Record<string, unknown>[] }

const fetchFormattedRows = async ({
  queryClient,
  projectRef,
  connectionString,
  entity,
  bypassConfirmation,
}: FetchFormattedRowsParams): Promise<FetchFormattedRowsReturn> => {
  if (IS_PLATFORM && !connectionString) {
    console.error('Export All Rows > Connection string is required')
    return { status: 'error', customMessage: null }
  }

  let table: TableEditorData | undefined
  try {
    table = await queryClient.ensureQueryData({
      // Query is the same even if connectionString changes
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey: tableEditorKeys.tableEditor(projectRef, entity.id),
      queryFn: ({ signal }) =>
        getTableEditor({ projectRef, connectionString, id: entity.id }, signal),
    })
  } catch (error: unknown) {
    const loggableError = toLoggableError(error)
    console.error(
      'Export All Rows > Error fetching table %s: %s\n%s',
      entity.name,
      loggableError.message,
      loggableError.stack
    )
    return { status: 'error', customMessage: null }
  }

  if (!table) {
    console.error('Export All Rows > Table %s not found', entity.name)
    return { status: 'error', customMessage: null }
  }

  const type = table.entity_type
  if (
    (type === ENTITY_TYPE.VIEW || type === ENTITY_TYPE.MATERIALIZED_VIEW) &&
    !bypassConfirmation
  ) {
    return {
      status: 'require_confirmation',
      reason: `You're exporting a view, which may cause performance issues on very large views. If possible, we recommend exporting the underlying table instead.`,
    }
  } else if (type === ENTITY_TYPE.FOREIGN_TABLE && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `You're exporting a foreign table, which may cause performance issues on very large tables.`,
    }
  }

  if (isTableLike(table) && table.live_rows_estimate > MAX_EXPORT_ROW_COUNT) {
    return {
      status: 'error',
      customMessage: MAX_EXPORT_ROW_COUNT_MESSAGE,
    }
  }

  const supaTable = parseSupaTable(table)

  const primaryKey = supaTable.primaryKey
  if (!primaryKey && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `This table does not have a primary key defined, which may cause performance issues when exporting large tables.`,
    }
  }

  let rows: Record<string, unknown>[]
  try {
    rows = await fetchAllTableRows({
      projectRef,
      connectionString,
      table: supaTable,
    })
  } catch (error: unknown) {
    const loggableError = toLoggableError(error)
    console.error(
      'Export All Rows > Error fetching rows for table %s: %s\n%s',
      entity.name,
      loggableError.message,
      loggableError.stack
    )
    return { status: 'error', customMessage: null }
  }
  const formattedRows = rows.map((row) => {
    const formattedRow = row
    Object.keys(row).map((column) => {
      if (typeof row[column] === 'object' && row[column] !== null)
        formattedRow[column] = JSON.stringify(formattedRow[column])
    })
    return formattedRow
  })

  return {
    status: 'success',
    table: supaTable,
    formattedRows,
  }
}

type UseExportAllRowsAsCsvParams = {
  projectRef: string
  connectionString: string | null
  entity: Entity
}

type UseExportAllRowsAsCsvReturn = {
  exportCsv: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsAsCsv = ({
  projectRef,
  connectionString,
  entity,
}: UseExportAllRowsAsCsvParams): UseExportAllRowsAsCsvReturn => {
  const queryClient = useQueryClient()

  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const toastIdRef = useRef<string | number>()
  const timeoutHandle = useRef<NodeJS.Timeout>()
  useEffect(() => () => clearTimeout(timeoutHandle.current), [])

  const projectRefRef = useLatest(projectRef)
  const connectionStringRef = useLatest(connectionString)
  const entityRef = useLatest(entity)
  const exportCsvInternal = useCallback(
    async ({ bypassConfirmation }: { bypassConfirmation: boolean }): Promise<void> => {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading(`Exporting ${entityRef.current.name} as CSV...`)
      }

      const result = await fetchFormattedRows({
        queryClient,
        projectRef: projectRefRef.current,
        connectionString: connectionStringRef.current,
        entity: entityRef.current,
        bypassConfirmation,
      })

      if (result.status === 'error') {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined
        return void toast.error(
          result.customMessage ?? `There was an error exporting ${entityRef.current.name}`
        )
      }

      if (result.status === 'require_confirmation') {
        return setConfirmationMessage(result.reason)
      }

      const { table, formattedRows } = result
      if (formattedRows.length === 0) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined
        return void toast.info(`No rows found in ${entityRef.current.name} to export`)
      }

      let csv: string
      try {
        csv = Papa.unparse(formattedRows, {
          columns: table.columns.map((col) => col.name),
        })
      } catch (error: unknown) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined

        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error converting table rows to CSV: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        return void toast.error(`There was an error exporting ${entityRef.current.name}`)
      }
      const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      try {
        saveAs(csvData, `${entityRef.current.name}_rows.csv`)
      } catch (error: unknown) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined

        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error saving CSV file: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        return void toast.error(`There was an error exporting ${entityRef.current.name}`)
      }

      toast.success(`Successfully exported ${entityRef.current.name} as CSV`, {
        id: toastIdRef.current,
      })
      timeoutHandle.current = setTimeout(() => {
        toastIdRef.current = undefined
      })
    },
    [queryClient, setConfirmationMessage, entityRef, projectRefRef, connectionStringRef]
  )

  const exportCsv = useCallback(
    () => exportCsvInternal({ bypassConfirmation: false }),
    [exportCsvInternal]
  )

  const onConfirmExport = () => {
    exportCsvInternal({ bypassConfirmation: true })
    setConfirmationMessage(null)
  }
  const onCancelExport = () => {
    setConfirmationMessage(null)
    toast.dismiss(toastIdRef.current)
    toastIdRef.current = undefined
  }

  return {
    exportCsv,
    confirmationModal: confirmationMessage ? (
      <ConfirmationModal
        title="Confirm export"
        visible={true}
        onCancel={onCancelExport}
        onConfirm={onConfirmExport}
      >
        <div className="flex items-center gap-4">
          <AlertTriangle aria-label="warning" className="shrink-0 text-foreground-lighter" />
          <p className="text-sm text-foreground-lighter">{confirmationMessage}</p>
        </div>
      </ConfirmationModal>
    ) : null,
  }
}

type UseExportAllRowsAsSqlParams = {
  projectRef: string
  connectionString: string | null
  entity: Entity
}

type UseExportAllRowsAsSqlReturn = {
  exportSql: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsAsSql = ({
  projectRef,
  connectionString,
  entity,
}: UseExportAllRowsAsSqlParams): UseExportAllRowsAsSqlReturn => {
  const queryClient = useQueryClient()

  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const toastIdRef = useRef<string | number>()
  const timeoutHandle = useRef<NodeJS.Timeout>()
  useEffect(() => () => clearTimeout(timeoutHandle.current), [])

  const projectRefRef = useLatest(projectRef)
  const connectionStringRef = useLatest(connectionString)
  const entityRef = useLatest(entity)
  const exportSqlInternal = useCallback(
    async ({ bypassConfirmation }: { bypassConfirmation: boolean }): Promise<void> => {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading(`Exporting ${entityRef.current.name} as CSV...`)
      }

      const result = await fetchFormattedRows({
        queryClient,
        projectRef: projectRefRef.current,
        connectionString: connectionStringRef.current ?? null,
        entity: entityRef.current,
        bypassConfirmation,
      })

      if (result.status === 'error') {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined
        return void toast.error(
          result.customMessage ?? `There was an error exporting ${entityRef.current.name}`
        )
      }

      if (result.status === 'require_confirmation') {
        return setConfirmationMessage(result.reason)
      }

      const { table, formattedRows } = result
      if (formattedRows.length === 0) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined
        return void toast.info(`No rows found in ${entityRef.current.name} to export`)
      }

      let sqlStatements: string
      try {
        sqlStatements = formatTableRowsToSQL(table, formattedRows)
      } catch (error: unknown) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined

        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error converting table rows to CSV: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        return void toast.error(`There was an error exporting ${entityRef.current.name}`)
      }
      const sqlData = new Blob([sqlStatements], { type: 'text/sql;charset=utf-8;' })
      try {
        saveAs(sqlData, `${entityRef.current.name}_rows.sql`)
      } catch (error: unknown) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = undefined

        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error saving CSV file: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        return void toast.error(`There was an error exporting ${entityRef.current.name}`)
      }

      toast.success(`Successfully exported ${entityRef.current.name} as CSV`, {
        id: toastIdRef.current,
      })
      timeoutHandle.current = setTimeout(() => {
        toastIdRef.current = undefined
      })
    },
    [queryClient, setConfirmationMessage, entityRef, projectRefRef, connectionStringRef]
  )

  const exportSql = useCallback(
    () => exportSqlInternal({ bypassConfirmation: false }),
    [exportSqlInternal]
  )

  const onConfirmExport = () => {
    exportSqlInternal({ bypassConfirmation: true })
    setConfirmationMessage(null)
  }
  const onCancelExport = () => {
    setConfirmationMessage(null)
    toast.dismiss(toastIdRef.current)
    toastIdRef.current = undefined
  }

  return {
    exportSql,
    confirmationModal: confirmationMessage ? (
      <ConfirmationModal
        title="Confirm export"
        visible={true}
        onCancel={onCancelExport}
        onConfirm={onConfirmExport}
      >
        <div className="flex items-center gap-4">
          <AlertTriangle aria-label="warning" className="shrink-0 text-foreground-lighter" />
          <p className="text-sm text-foreground-lighter">{confirmationMessage}</p>
        </div>
      </ConfirmationModal>
    ) : null,
  }
}
