import saveAs from 'file-saver'
import Papa from 'papaparse'
import { useCallback, useState, type ReactNode } from 'react'

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
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  BlobCreationError,
  DownloadSaveError,
  FetchRowsError,
  NoConnectionStringError,
  NoRowsToExportError,
  NoTableError,
  OutputConversionError,
  TableDetailsFetchError,
  TableTooLargeError,
  type ExportAllRowsErrorFamily,
} from './ExportAllRows.errors'
import { useProgressToasts } from './ExportAllRows.progress'

type OutputCallbacks = {
  convertToOutputFormat: (formattedRows: Record<string, unknown>[], table: SupaTable) => string
  convertToBlob: (str: string) => Blob
  save: (blob: Blob, table: SupaTable) => void
}

type FetchAllRowsParams = {
  queryClient: QueryClient
  projectRef: string
  connectionString: string | null
  entity: Pick<Entity, 'id' | 'name' | 'type'>
  bypassConfirmation: boolean
  filters?: Filter[]
  sorts?: Sort[]
  roleImpersonationState?: RoleImpersonationState
  startCallback?: () => void
  progressCallback?: (progress: number) => void
} & OutputCallbacks

type FetchAllRowsReturn =
  | { status: 'require_confirmation'; reason: string }
  | { status: 'error'; error: ExportAllRowsErrorFamily }
  | { status: 'success'; rowsExported: number }

const fetchAllRows = async ({
  queryClient,
  projectRef,
  connectionString,
  entity,
  bypassConfirmation,
  filters,
  sorts,
  roleImpersonationState,
  startCallback,
  progressCallback,
  convertToOutputFormat,
  convertToBlob,
  save,
}: FetchAllRowsParams): Promise<FetchAllRowsReturn> => {
  if (IS_PLATFORM && !connectionString) {
    return { status: 'error', error: new NoConnectionStringError() }
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
    return { status: 'error', error: new TableDetailsFetchError(entity.name, error) }
  }

  if (!table) {
    return { status: 'error', error: new NoTableError(entity.name) }
  }

  const type = table.entity_type
  if (type === ENTITY_TYPE.VIEW && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `Exporting a view may cause consistency issues or performance issues on very large views. If possible, we recommend exporting the underlying table instead.`,
    }
  } else if (type === ENTITY_TYPE.MATERIALIZED_VIEW && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `Exporting a materialized view may cause performance issues on very large views. If possible, we recommend exporting the underlying table instead.`,
    }
  } else if (type === ENTITY_TYPE.FOREIGN_TABLE && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `Exporting a foreign table may cause consistency issues or performance issues on very large tables.`,
    }
  }

  if (isTableLike(table) && table.live_rows_estimate > MAX_EXPORT_ROW_COUNT) {
    return {
      status: 'error',
      error: new TableTooLargeError(table.name, table.live_rows_estimate, MAX_EXPORT_ROW_COUNT),
    }
  }

  const supaTable = parseSupaTable(table)

  const primaryKey = supaTable.primaryKey
  if (!primaryKey && !bypassConfirmation) {
    return {
      status: 'require_confirmation',
      reason: `This table does not have a primary key defined, which may cause performance issues when exporting very large tables.`,
    }
  }

  startCallback?.()

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
    return { status: 'error', error: new FetchRowsError(supaTable.name, error) }
  }

  if (rows.length === 0) {
    return { status: 'error', error: new NoRowsToExportError(entity.name) }
  }
  const formattedRows = formatRowsForExport(rows, supaTable)

  return convertAndDownload(formattedRows, supaTable, {
    convertToOutputFormat,
    convertToBlob,
    save,
  })
}

const formatRowsForExport = (rows: Record<string, unknown>[], table: SupaTable) => {
  return rows.map((row) => {
    const formattedRow = { ...row }
    Object.keys(row).map((column) => {
      if (column === 'idx' && !table.columns.some((col) => col.name === 'idx')) {
        // When we fetch this data from the database, we automatically add an
        // 'idx' column if none exists. We shouldn't export this column since
        // it's not actually part of the user's table.
        delete formattedRow[column]
        return
      }

      if (typeof row[column] === 'object' && row[column] !== null)
        formattedRow[column] = JSON.stringify(formattedRow[column])
    })
    return formattedRow
  })
}

const convertAndDownload = (
  formattedRows: Record<string, unknown>[],
  table: SupaTable,
  callbacks: OutputCallbacks
):
  | { status: 'error'; error: ExportAllRowsErrorFamily }
  | { status: 'success'; rowsExported: number } => {
  let output: string
  try {
    output = callbacks.convertToOutputFormat(formattedRows, table)
  } catch (error: unknown) {
    return { status: 'error', error: new OutputConversionError(error) }
  }
  let data: Blob
  try {
    data = callbacks.convertToBlob(output)
  } catch (error: unknown) {
    return { status: 'error', error: new BlobCreationError(error) }
  }
  try {
    callbacks.save(data, table)
  } catch (error: unknown) {
    return { status: 'error', error: new DownloadSaveError(error) }
  }

  return {
    status: 'success',
    rowsExported: formattedRows.length,
  }
}

type UseExportAllRowsParams =
  | { enabled: false }
  | ({
      enabled: true
      projectRef: string
      connectionString: string | null
      entity: Pick<Entity, 'id' | 'name' | 'type'>
      /**
       * If known, the total number of rows that will be exported.
       * This is used to show progress percentage during export.
       */
      totalRows?: number
    } & (
      | {
          /**
           * Rows need to be fetched from the database.
           */
          type: 'fetch_all'
          filters?: Filter[]
          sorts?: Sort[]
          roleImpersonationState?: RoleImpersonationState
        }
      | {
          /**
           * Rows are already available and provided directly.
           */
          type: 'provided_rows'
          table: SupaTable
          rows: Record<string, unknown>[]
        }
    ))

type UseExportAllRowsReturn = {
  exportInDesiredFormat: () => Promise<void>
  confirmationModal: ReactNode | null
}

export const useExportAllRowsGeneric = (
  params: UseExportAllRowsParams & OutputCallbacks
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

      const exportResult =
        params.type === 'provided_rows'
          ? convertAndDownload(formatRowsForExport(params.rows, params.table), params.table, {
              convertToOutputFormat,
              convertToBlob,
              save,
            })
          : await fetchAllRows({
              queryClient,
              projectRef: projectRef,
              connectionString: connectionString,
              entity: entity,
              bypassConfirmation,
              filters: params.filters,
              sorts: params.sorts,
              roleImpersonationState: params.roleImpersonationState,
              startCallback: () => {
                startProgressTracker({
                  id: entity.id,
                  name: entity.name,
                  trackPercentage: totalRows !== undefined,
                })
              },
              progressCallback: totalRows
                ? (value: number) =>
                    trackPercentageProgress({
                      id: entity.id,
                      name: entity.name,
                      totalRows: totalRows,
                      value,
                    })
                : undefined,
              convertToOutputFormat,
              convertToBlob,
              save,
            })

      if (exportResult.status === 'error') {
        const error = exportResult.error
        if (error instanceof NoRowsToExportError) {
          return stopTrackerWithError(
            entity.id,
            entity.name,
            `The table ${entity.name} has no rows to export.`
          )
        }
        if (error instanceof TableTooLargeError) {
          return stopTrackerWithError(entity.id, entity.name, MAX_EXPORT_ROW_COUNT_MESSAGE)
        }
        console.error(
          `Export All Rows > Error: %s%s%s`,
          error.message,
          error.cause?.message ? `\n${error.cause.message}` : '',
          error.cause?.stack ? `:\n${error.cause.stack}` : ''
        )
        return stopTrackerWithError(entity.id, entity.name)
      }

      if (exportResult.status === 'require_confirmation') {
        return setConfirmationMessage(exportResult.reason)
      }

      markTrackerComplete(entity.id, exportResult.rowsExported)
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
        title="Confirm to export data"
        visible={true}
        onCancel={onCancelExport}
        onConfirm={onConfirmExport}
        alert={{
          base: { className: '[&>div>div>h5]:font-normal border-x-0 border-t-0 rounded-none mb-0' },
          title: confirmationMessage,
        }}
      />
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
    convertToBlob: (jsonStr) => new Blob([jsonStr], { type: 'application/json;charset=utf-8;' }),
    save: (jsonData, table) => saveAs(jsonData, `${table.name}_rows.json`),
  })

  return {
    exportJson,
    confirmationModal,
  }
}
