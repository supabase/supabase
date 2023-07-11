import { useState } from 'react'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { find, isEmpty, isUndefined, noop } from 'lodash'
import { Dictionary } from 'components/grid'
import { Modal } from 'ui'
import type { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

import { useStore, useUrlState } from 'hooks'
import { entityTypeKeys } from 'data/entity-types/keys'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { RowEditor, ColumnEditor, TableEditor, SpreadsheetImport } from '.'
import { ImportContent } from './TableEditor/TableEditor.types'
import {
  ColumnField,
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from './SidePanelEditor.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import JsonEdit from './RowEditor/JsonEditor/JsonEditor'
import { JsonEditValue } from './RowEditor/RowEditor.types'
import { sqlKeys } from 'data/sql/keys'
import ForeignRowSelector, {
  ForeignRowSelectorProps,
} from './RowEditor/ForeignRowSelector/ForeignRowSelector'

export interface SidePanelEditorProps {
  selectedSchema: string
  selectedTable?: PostgresTable
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable
  selectedValueForJsonEdit?: JsonEditValue
  selectedForeignKeyToEdit?: {
    foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
    row: any
    column: any
  }
  sidePanelKey?: 'row' | 'column' | 'table' | 'json' | 'foreign-row-selector' | 'csv-import'
  isDuplicating?: boolean
  closePanel: () => void
  onRowCreated?: (row: Dictionary<any>) => void
  onRowUpdated?: (row: Dictionary<any>, idx: number) => void

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: PostgresTable) => void
  onColumnSaved?: (hasEncryptedColumns?: boolean) => void
}

const SidePanelEditor = ({
  selectedSchema,
  selectedTable,
  selectedRowToEdit,
  selectedColumnToEdit,
  selectedTableToEdit,
  selectedValueForJsonEdit,
  selectedForeignKeyToEdit,
  sidePanelKey,
  isDuplicating = false,
  closePanel,
  onRowCreated = noop,
  onRowUpdated = noop,
  onTableCreated = noop,
  onColumnSaved = noop,
}: SidePanelEditorProps) => {
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })
  const { meta, ui } = useStore()
  const queryClient = useQueryClient()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const tables = meta.tables.list()
  const enumArrayColumns = (selectedTable?.columns ?? [])
    .filter((column) => {
      return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
    })
    .map((column) => column.name)

  const { project } = useProjectContext()
  const { mutateAsync: createTableRows } = useTableRowCreateMutation()
  const { mutateAsync: updateTableRow } = useTableRowUpdateMutation({
    async onMutate({ projectRef, table, configuration, payload }) {
      closePanel()

      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))

      const queryKey = sqlKeys.query(projectRef, [
        table.schema,
        table.name,
        { table: { name: table.name, schema: table.schema } },
      ])

      await queryClient.cancelQueries(queryKey)

      const previousRowsQueries = queryClient.getQueriesData<{ result: any[] }>(queryKey)

      queryClient.setQueriesData<{ result: any[] }>(queryKey, (old) => {
        return {
          result:
            old?.result.map((row) => {
              // match primary keys
              if (
                Object.entries(row)
                  .filter(([key]) => primaryKeyColumns.has(key))
                  .every(([key, value]) => value === configuration.identifiers[key])
              ) {
                return { ...row, ...payload }
              }

              return row
            }) ?? [],
        }
      })

      return { previousRowsQueries }
    },
    onError(error, _variables, context) {
      const { previousRowsQueries } = context as {
        previousRowsQueries: [
          QueryKey,
          (
            | {
                result: any[]
              }
            | undefined
          )
        ][]
      }

      previousRowsQueries.forEach(([queryKey, previousRows]) => {
        if (previousRows) {
          queryClient.setQueriesData(queryKey, previousRows)
        }
        queryClient.invalidateQueries(queryKey)
      })
    },
  })

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number },
    onComplete: Function
  ) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    let saveRowError = false
    if (isNewRecord) {
      try {
        const result = await createTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable as any,
          payload,
          enumArrayColumns,
        })
        onRowCreated(result[0])
      } catch (error: any) {
        saveRowError = true
      }
    } else {
      const hasChanges = !isEmpty(payload)
      if (hasChanges) {
        if (selectedTable.primary_keys.length > 0) {
          try {
            const result = await updateTableRow({
              projectRef: project.ref,
              connectionString: project.connectionString,
              table: selectedTable as any,
              configuration,
              payload,
              enumArrayColumns,
            })
            onRowUpdated(result[0], configuration.rowIdx)
          } catch (error: any) {
            saveRowError = true
          }
        } else {
          saveRowError = true
          ui.setNotification({
            category: 'error',
            message:
              "We can't make changes to this table because there is no primary key. Please create a primary key and try again.",
          })
        }
      }
    }

    onComplete()
    if (!saveRowError) {
      setIsEdited(false)
      closePanel()
    }
  }

  const onSaveJSON = async (value: string | number) => {
    if (selectedTable === undefined || selectedValueForJsonEdit === undefined) return

    try {
      const { row, column } = selectedValueForJsonEdit
      const payload = { [column]: JSON.parse(value as any) }
      const identifiers = {} as Dictionary<any>
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))

      const isNewRecord = false
      const configuration = { identifiers, rowIdx: row.idx }

      saveRow(payload, isNewRecord, configuration, () => {})
    } catch (error: any) {}
  }

  const onSaveForeignRow = async (value: any) => {
    if (selectedTable === undefined || selectedForeignKeyToEdit === undefined) return

    try {
      const { row, column } = selectedForeignKeyToEdit
      const payload = { [column.name]: value }
      const identifiers = {} as Dictionary<any>
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))

      const isNewRecord = false
      const configuration = { identifiers, rowIdx: row.idx }

      saveRow(payload, isNewRecord, configuration, () => {})
    } catch (error) {}
  }

  const saveColumn = async (
    payload: CreateColumnPayload | UpdateColumnPayload,
    foreignKey: ExtendedPostgresRelationship | undefined,
    isNewRecord: boolean,
    configuration: { columnId?: string; isEncrypted: boolean; keyId?: string; keyName?: string },
    resolve: any
  ) => {
    const { columnId, ...securityConfig } = configuration
    const response = isNewRecord
      ? await meta.createColumn(
          payload as CreateColumnPayload,
          selectedTable as PostgresTable,
          foreignKey,
          securityConfig
        )
      : await meta.updateColumn(
          columnId as string,
          payload as UpdateColumnPayload,
          selectedTable as PostgresTable,
          foreignKey
        )

    if (response?.error) {
      ui.setNotification({ category: 'error', message: response.error.message })
    } else {
      if (
        !isNewRecord &&
        payload.name &&
        selectedColumnToEdit &&
        selectedColumnToEdit.name !== payload.name
      ) {
        reAddRenamedColumnSortAndFilter(selectedColumnToEdit.name, payload.name)
      }
      queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreign-key-constraints']))
      await Promise.all([
        meta.tables.loadById(selectedTable!.id),
        queryClient.invalidateQueries(
          sqlKeys.query(project?.ref, [selectedTable!.schema, selectedTable!.name])
        ),
        queryClient.invalidateQueries(
          sqlKeys.query(project?.ref, [
            'table-definition',
            selectedTable!.schema,
            selectedTable!.name,
          ])
        ),
        queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
      ])
      onColumnSaved(configuration.isEncrypted)
      setIsEdited(false)
      closePanel()
    }

    if (configuration.isEncrypted && selectedTable?.schema) {
      await meta.views.loadBySchema(selectedTable.schema)
    }

    resolve()
  }

  /**
   * Adds the renamed column's filter and/or sort rules.
   */
  const reAddRenamedColumnSortAndFilter = (oldColumnName: string, newColumnName: string) => {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const existingSorts = (prevParams?.sort ?? []) as string[]

      return {
        ...prevParams,
        filter: existingFilters.map((filter: string) => {
          const [column] = filter.split(':')
          return column === oldColumnName ? filter.replace(column, newColumnName) : filter
        }),
        sort: existingSorts.map((sort: string) => {
          const [column] = sort.split(':')
          return column === oldColumnName ? sort.replace(column, newColumnName) : sort
        }),
      }
    })
  }

  const saveTable = async (
    payload: any,
    columns: ColumnField[],
    isNewRecord: boolean,
    configuration: {
      tableId?: number
      importContent?: ImportContent
      isRLSEnabled: boolean
      isRealtimeEnabled: boolean
      isDuplicateRows: boolean
    },
    resolve: any
  ) => {
    let toastId
    let saveTableError = false
    const { tableId, importContent, isRLSEnabled, isRealtimeEnabled, isDuplicateRows } =
      configuration

    try {
      if (isDuplicating) {
        const duplicateTable = find(tables, { id: tableId }) as PostgresTable

        toastId = ui.setNotification({
          category: 'loading',
          message: `Duplicating table: ${duplicateTable.name}...`,
        })

        const table: any = await meta.duplicateTable(payload, {
          isRLSEnabled,
          isRealtimeEnabled,
          isDuplicateRows,
          duplicateTable,
        })

        await queryClient.invalidateQueries(entityTypeKeys.list(project?.ref))

        ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Table ${duplicateTable.name} has been successfully duplicated into ${table.name}!`,
        })

        onTableCreated(table)
      } else if (isNewRecord) {
        toastId = ui.setNotification({
          category: 'loading',
          message: `Creating new table: ${payload.name}...`,
        })

        const table = await meta.createTable(
          toastId,
          payload,
          columns,
          isRLSEnabled,
          isRealtimeEnabled,
          importContent
        )

        await queryClient.invalidateQueries(entityTypeKeys.list(project?.ref))

        ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Table ${table.name} is good to go!`,
        })

        onTableCreated(table)
      } else if (selectedTableToEdit) {
        toastId = ui.setNotification({
          category: 'loading',
          message: `Updating table: ${selectedTableToEdit?.name}...`,
        })

        const { table, hasError }: any = await meta.updateTable(
          toastId,
          selectedTableToEdit,
          payload,
          columns,
          isRealtimeEnabled
        )

        if (hasError) {
          ui.setNotification({
            id: toastId,
            category: 'info',
            message: `Table ${table.name} has been updated, but there were some errors`,
          })
        } else {
          queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreign-key-constraints']))
          await Promise.all([
            queryClient.invalidateQueries(
              sqlKeys.query(project?.ref, [selectedTableToEdit.schema, selectedTableToEdit.name])
            ),
            queryClient.invalidateQueries(
              sqlKeys.query(project?.ref, [
                'table-definition',
                selectedTableToEdit.schema,
                selectedTableToEdit.name,
              ])
            ),
            queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
          ])

          ui.setNotification({
            id: toastId,
            category: 'success',
            message: `Successfully updated ${table.name}!`,
          })
        }
      }
    } catch (error: any) {
      saveTableError = true
      ui.setNotification({ error, id: toastId, category: 'error', message: error.message })
    }

    if (!saveTableError) {
      setIsEdited(false)
      closePanel()
    }

    resolve()
  }

  const onImportData = async (importContent: ImportContent) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    const { file, rowCount, selectedHeaders, resolve } = importContent
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`,
    })

    if (file && rowCount > 0) {
      // CSV file upload
      const { error }: any = await meta.insertRowsViaSpreadsheet(
        file,
        selectedTable,
        selectedHeaders,
        (progress: number) => {
          ui.setNotification({
            id: toastId,
            progress,
            category: 'loading',
            message: `Adding ${rowCount.toLocaleString()} rows to ${selectedTable.name}`,
          })
        }
      )
      if (error) {
        ui.setNotification({
          error,
          id: toastId,
          category: 'error',
          message: `Failed to import data: ${error.message}`,
        })
        return resolve()
      }
    } else {
      // Text paste
      const { error } = await meta.insertTableRows(
        selectedTable,
        importContent.rows,
        selectedHeaders,
        (progress: number) => {
          ui.setNotification({
            id: toastId,
            progress,
            category: 'loading',
            message: `Adding ${importContent.rows.length.toLocaleString()} rows to ${
              selectedTable.name
            }`,
          })
        }
      )
      if (error) {
        ui.setNotification({
          error,
          id: toastId,
          category: 'error',
          message: `Failed to import data: ${error.message}`,
        })
        return resolve()
      }
    }

    await Promise.all([
      queryClient.invalidateQueries(
        sqlKeys.query(project?.ref, [selectedTable!.schema, selectedTable!.name])
      ),
    ])
    ui.setNotification({
      id: toastId,
      category: 'success',
      message: `Successfully imported ${rowCount} rows of data into ${selectedTable.name}`,
    })
    resolve()
    closePanel()
  }

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosingPanel(true)
    } else {
      closePanel()
    }
  }

  return (
    <>
      {!isUndefined(selectedTable) && (
        <RowEditor
          row={selectedRowToEdit}
          selectedTable={selectedTable}
          visible={sidePanelKey === 'row'}
          closePanel={onClosePanel}
          saveChanges={saveRow}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      {!isUndefined(selectedTable) && (
        <ColumnEditor
          column={selectedColumnToEdit}
          selectedTable={selectedTable}
          visible={sidePanelKey === 'column'}
          closePanel={onClosePanel}
          saveChanges={saveColumn}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      <TableEditor
        table={selectedTableToEdit}
        selectedSchema={selectedSchema}
        isDuplicating={isDuplicating}
        visible={sidePanelKey === 'table'}
        closePanel={onClosePanel}
        saveChanges={saveTable}
        updateEditorDirty={() => setIsEdited(true)}
      />
      <JsonEdit
        visible={sidePanelKey === 'json'}
        column={selectedValueForJsonEdit?.column ?? ''}
        jsonString={selectedValueForJsonEdit?.jsonString ?? ''}
        backButtonLabel="Cancel"
        applyButtonLabel="Save changes"
        closePanel={onClosePanel}
        onSaveJSON={onSaveJSON}
      />
      <ForeignRowSelector
        key={`foreign-row-selector-${selectedForeignKeyToEdit?.foreignKey?.id ?? 'null'}`}
        visible={sidePanelKey === 'foreign-row-selector'}
        foreignKey={selectedForeignKeyToEdit?.foreignKey}
        closePanel={onClosePanel}
        onSelect={onSaveForeignRow}
      />
      <SpreadsheetImport
        visible={sidePanelKey === 'csv-import'}
        selectedTable={selectedTableToEdit}
        saveContent={onImportData}
        closePanel={onClosePanel}
        updateEditorDirty={setIsEdited}
      />
      <ConfirmationModal
        visible={isClosingPanel}
        header="Confirm to close"
        buttonLabel="Confirm"
        onSelectCancel={() => setIsClosingPanel(false)}
        onSelectConfirm={() => {
          setIsClosingPanel(false)
          setIsEdited(false)
          closePanel()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-scale-1100">
            There are unsaved changes. Are you sure you want to close the panel? Your changes will
            be lost.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default SidePanelEditor
