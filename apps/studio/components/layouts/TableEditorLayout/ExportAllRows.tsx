import saveAs from 'file-saver'
import Papa from 'papaparse'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import {
  MAX_EXPORT_ROW_COUNT,
  MAX_EXPORT_ROW_COUNT_MESSAGE,
} from 'components/grid/components/header/Header'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import type { Filter, Sort, SupaTable } from 'components/grid/types'
import { formatTableRowsToSQL } from 'components/interfaces/TableGridEditor/TableEntity.utils'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import type { Entity } from 'data/entity-types/entity-types-infinite-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { getTableEditor, type TableEditorData } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { fetchAllTableRows } from 'data/table-rows/table-rows-query'
import { useStaticEffectEvent } from 'hooks/useStaticEffectEvent'
import type { RoleImpersonationState } from 'lib/role-impersonation'
import { AlertTriangle } from 'lucide-react'
import { SonnerProgress } from 'ui'
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
  entity: Pick<Entity, 'id' | 'name' | 'type'>
  bypassConfirmation: boolean
  filters?: Filter[]
  sorts?: Sort[]
  roleImpersonationState?: RoleImpersonationState
  progressCallback?: (progress: number) => void
}

type FetchFormattedRowsReturn =
  | { status: 'require_confirmation'; reason: string }
  | { status: 'error'; customMessage: ReactNode | null }
  | { status: 'success'; table: SupaTable; rows: Record<string, unknown>[] }

const fetchAllRows = async ({
  queryClient,
  projectRef,
  connectionString,
  entity,
  bypassConfirmation,
  filters,
  sorts,
  roleImpersonationState,
  progressCallback,
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
      filters,
      sorts,
      roleImpersonationState,
      progressCallback,
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

  return {
    status: 'success',
    table: supaTable,
    rows,
  }
}

const formatRowsForExport = (rows: Record<string, unknown>[]) => {
  return rows.map((row) => {
    const formattedRow = row
    Object.keys(row).map((column) => {
      if (typeof row[column] === 'object' && row[column] !== null)
        formattedRow[column] = JSON.stringify(formattedRow[column])
    })
    return formattedRow
  })
}

const useProgressToasts = () => {
  const toastIdsRef = useRef(new Map<number, string | number>())

  const startProgressTracker = useCallback(
    ({
      id,
      name,
      trackPercentage = false,
    }: {
      id: number
      name: string
      trackPercentage?: boolean
    }) => {
      if (toastIdsRef.current.has(id)) return

      if (trackPercentage) {
        toastIdsRef.current.set(
          id,
          toast(<SonnerProgress progress={0} message={`Exporting ${name}...`} />, {
            closeButton: false,
            duration: Infinity,
          })
        )
      } else {
        toastIdsRef.current.set(id, toast.loading(`Exporting ${name}...`))
      }
    },
    []
  )

  const trackPercentageProgress = useCallback(
    ({
      id,
      name,
      value,
      totalRows,
    }: {
      id: number
      name: string
      value: number
      totalRows: number
    }) => {
      const savedToastId = toastIdsRef.current.get(id)

      const progress = Math.min((value / totalRows) * 100, 100)
      const newToastId = toast(
        <SonnerProgress progress={progress} message={`Exporting ${name}...`} />,
        {
          id: savedToastId,
          closeButton: false,
          duration: Infinity,
        }
      )

      if (!savedToastId) toastIdsRef.current.set(id, newToastId)
    },
    []
  )

  const stopTrackerWithError = useCallback(
    (id: number, name: string, customMessage?: ReactNode) => {
      const savedToastId = toastIdsRef.current.get(id)
      if (savedToastId) {
        toast.dismiss(savedToastId)
        toastIdsRef.current.delete(id)
      }

      toast.error(customMessage ?? `There was an error exporting ${name}`)
    },
    []
  )

  const dismissTrackerSilently = useCallback((id: number) => {
    const savedToastId = toastIdsRef.current.get(id)
    if (savedToastId) {
      toast.dismiss(savedToastId)
      toastIdsRef.current.delete(id)
    }
  }, [])

  const markTrackerComplete = useCallback((id: number, name: string, totalRows: number) => {
    const savedToastId = toastIdsRef.current.get(id)
    const deleteSavedToastId = () => toastIdsRef.current.delete(id)

    toast.success(`Successfully exported ${totalRows} rows`, {
      id: savedToastId,
      onAutoClose: deleteSavedToastId,
      onDismiss: deleteSavedToastId,
    })
  }, [])

  return {
    startProgressTracker,
    trackPercentageProgress,
    stopTrackerWithError,
    dismissTrackerSilently,
    markTrackerComplete,
  }
}

type UseExportAllRowsParams =
  | { enabled: false }
  | ({
      enabled: true
      projectRef: string
      connectionString: string | null
      entity: Pick<Entity, 'id' | 'name' | 'type'>
      totalRows?: number
    } & (
      | {
          type: 'fetch_all'
          filters?: Filter[]
          sorts?: Sort[]
          roleImpersonationState?: RoleImpersonationState
        }
      | {
          type: 'provided_rows'
          table: SupaTable
          rows: Record<string, unknown>[]
        }
    ))

type GenericProviders = {
  convertToOutputFormat: (formattedRows: Record<string, unknown>[], table: SupaTable) => string
  convertToBlob: (str: string) => Blob
  save: (blob: Blob, table: SupaTable) => void
}

type UseExportAllRowsReturn = {
  exportInDesiredFormat: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsGeneric = (
  params: UseExportAllRowsParams & GenericProviders
): UseExportAllRowsReturn => {
  const queryClient = useQueryClient()
  const {
    startProgressTracker,
    trackPercentageProgress,
    stopTrackerWithError,
    dismissTrackerSilently,
    markTrackerComplete,
  } = useProgressToasts()

  const { convertToOutputFormat, convertToBlob, save } = params

  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  const exportInternal = useStaticEffectEvent(
    async ({ bypassConfirmation }: { bypassConfirmation: boolean }): Promise<void> => {
      if (!params.enabled) return

      const { projectRef, connectionString, entity, totalRows } = params

      startProgressTracker({
        id: entity.id,
        name: entity.name,
        trackPercentage: totalRows !== undefined,
      })

      const rowsResult =
        params.type === 'provided_rows'
          ? ({
              status: 'success',
              table: params.table,
              rows: params.rows,
            } as const)
          : await fetchAllRows({
              queryClient,
              projectRef: projectRef,
              connectionString: connectionString,
              entity: entity,
              bypassConfirmation,
              filters: params.filters,
              sorts: params.sorts,
              roleImpersonationState: params.roleImpersonationState,
              progressCallback: totalRows
                ? (value: number) =>
                    trackPercentageProgress({
                      id: entity.id,
                      name: entity.name,
                      totalRows: totalRows,
                      value,
                    })
                : undefined,
            })

      if (rowsResult.status === 'error') {
        return stopTrackerWithError(entity.id, entity.name)
      }

      if (rowsResult.status === 'require_confirmation') {
        return setConfirmationMessage(rowsResult.reason)
      }

      const { table, rows } = rowsResult
      if (rows.length === 0) {
        return stopTrackerWithError(
          entity.id,
          entity.name,
          `No rows found in ${entity.name} to export`
        )
      }
      const formattedRows = formatRowsForExport(rows)

      let output: string
      try {
        output = convertToOutputFormat(formattedRows, table)
      } catch (error: unknown) {
        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error converting table rows to CSV: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        return stopTrackerWithError(entity.id, entity.name)
      }
      const data = convertToBlob(output)
      try {
        save(data, table)
      } catch (error: unknown) {
        const loggableError = toLoggableError(error)
        console.error(
          `Export All Rows > Error saving CSV file: %s\n%s`,
          loggableError.message,
          loggableError.stack
        )
        stopTrackerWithError(entity.id, entity.name)
      }

      markTrackerComplete(entity.id, entity.name, formattedRows.length)
    }
  )

  const exportInDesiredFormat = useCallback(
    () => exportInternal({ bypassConfirmation: false }),
    [exportInternal]
  )

  const onConfirmExport = () => {
    exportInternal({
      bypassConfirmation: true,
    })
    setConfirmationMessage(null)
  }
  const onCancelExport = () => {
    if (!params.enabled) return

    dismissTrackerSilently(params.entity.id)
    setConfirmationMessage(null)
  }

  return {
    exportInDesiredFormat,
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

type UseExportAllRowsAsCsvReturn = {
  exportCsv: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsAsCsv = (
  params: UseExportAllRowsParams
): UseExportAllRowsAsCsvReturn => {
  const { exportInDesiredFormat: exportCsv, confirmationModal } = useExportAllRowsGeneric({
    ...params,
    convertToOutputFormat: (formattedRows, table) =>
      Papa.unparse(formattedRows, {
        columns: table.columns.map((col) => col.name),
      }),
    convertToBlob: (csv) => new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    save: (csvData, table) => saveAs(csvData, `${table.name}_rows.csv`),
  })

  return {
    exportCsv,
    confirmationModal,
  }
}

type UseExportAllRowsAsSqlReturn = {
  exportSql: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsAsSql = (
  params: UseExportAllRowsParams
): UseExportAllRowsAsSqlReturn => {
  const { exportInDesiredFormat: exportSql, confirmationModal } = useExportAllRowsGeneric({
    ...params,
    convertToOutputFormat: (formattedRows, table) => formatTableRowsToSQL(table, formattedRows),
    convertToBlob: (sqlStatements) =>
      new Blob([sqlStatements], { type: 'text/sql;charset=utf-8;' }),
    save: (sqlData, table) => saveAs(sqlData, `${table.name}_rows.sql`),
  })

  return {
    exportSql,
    confirmationModal,
  }
}

type UseExportAllRowsAsJsonReturn = {
  exportJson: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsAsJson = (
  params: UseExportAllRowsParams
): UseExportAllRowsAsJsonReturn => {
  const { exportInDesiredFormat: exportJson, confirmationModal } = useExportAllRowsGeneric({
    ...params,
    convertToOutputFormat: (formattedRows) => JSON.stringify(formattedRows),
    convertToBlob: (jsonStr) => new Blob([jsonStr], { type: 'text/sql;charset=utf-8;' }),
    save: (jsonData, table) => saveAs(jsonData, `${table.name}_rows.json`),
  })

  return {
    exportJson,
    confirmationModal,
  }
}
