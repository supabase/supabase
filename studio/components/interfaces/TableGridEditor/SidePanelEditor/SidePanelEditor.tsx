import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { isEmpty, isUndefined, noop } from 'lodash'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Modal } from 'ui'

import { Dictionary } from 'components/grid'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { entityTypeKeys } from 'data/entity-types/keys'
import { sqlKeys } from 'data/sql/keys'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { tableKeys } from 'data/tables/keys'
import { useStore, useUrlState } from 'hooks'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { ColumnEditor, RowEditor, SpreadsheetImport, TableEditor } from '.'
import ForeignRowSelector from './RowEditor/ForeignRowSelector/ForeignRowSelector'
import JsonEdit from './RowEditor/JsonEditor/JsonEditor'
import SchemaEditor from './SchemaEditor'
import {
  ColumnField,
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from './SidePanelEditor.types'
import { ImportContent } from './TableEditor/TableEditor.types'

export interface SidePanelEditorProps {
  editable?: boolean
  selectedTable?: PostgresTable
  onRowCreated?: (row: Dictionary<any>) => void
  onRowUpdated?: (row: Dictionary<any>, idx: number) => void

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: PostgresTable) => void
}

const SidePanelEditor = ({
  editable = true,
  selectedTable,
  onRowCreated = noop,
  onRowUpdated = noop,
  onTableCreated = noop,
}: SidePanelEditorProps) => {
  const snap = useTableEditorStateSnapshot()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })
  const { meta, ui } = useStore()
  const queryClient = useQueryClient()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const enumArrayColumns = (selectedTable?.columns ?? [])
    .filter((column) => {
      return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
    })
    .map((column) => column.name)

  const { project } = useProjectContext()
  const { mutateAsync: createTableRows } = useTableRowCreateMutation()
  const { mutateAsync: updateTableRow } = useTableRowUpdateMutation({
    async onMutate({ projectRef, table, configuration, payload }) {
      snap.closeSidePanel()

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

      ui.setNotification({ error, category: 'error', message: error.message })
    },
  })

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number },
    onComplete: (err?: any) => void
  ) => {
    if (!project || selectedTable === undefined) {
      return console.error('no project or table selected')
    }

    let saveRowError: Error | undefined
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
        saveRowError = error
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
            saveRowError = error
          }
        } else {
          saveRowError = new Error('No primary key')
          ui.setNotification({
            category: 'error',
            message:
              "We can't make changes to this table because there is no primary key. Please create a primary key and try again.",
          })
        }
      }
    }

    onComplete(saveRowError)
    if (!saveRowError) {
      setIsEdited(false)
      snap.closeSidePanel()
    }
  }

  const onSaveJSON = async (value: string | number | null) => {
    if (selectedTable === undefined || !(snap.sidePanel?.type === 'json')) return
    const selectedValueForJsonEdit = snap.sidePanel.jsonValue

    try {
      const { row, column } = selectedValueForJsonEdit
      const payload = { [column]: value === null ? null : JSON.parse(value as any) }
      const identifiers = {} as Dictionary<any>
      selectedTable.primary_keys.forEach((column) => (identifiers[column.name] = row![column.name]))

      const isNewRecord = false
      const configuration = { identifiers, rowIdx: row.idx }

      saveRow(payload, isNewRecord, configuration, (error) => {
        if (error) {
          toast.error(error?.message ?? 'Something went wrong while trying to save the JSON value')
        }
      })
    } catch (error: any) {}
  }

  const onSaveForeignRow = async (value: any) => {
    if (selectedTable === undefined || !(snap.sidePanel?.type === 'foreign-row-selector')) return
    const selectedForeignKeyToEdit = snap.sidePanel.foreignKey

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
    configuration: { columnId?: string },
    resolve: any
  ) => {
    const selectedColumnToEdit = snap.sidePanel?.type === 'column' && snap.sidePanel.column

    const { columnId } = configuration
    const response = isNewRecord
      ? await meta.createColumn(
          payload as CreateColumnPayload,
          selectedTable as PostgresTable,
          foreignKey
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

      await Promise.all([
        queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreign-key-constraints'])),
        queryClient.invalidateQueries(tableKeys.table(project?.ref, selectedTable!.id)),
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
      setIsEdited(false)
      snap.closeSidePanel()
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
      if (
        snap.sidePanel?.type === 'table' &&
        snap.sidePanel.mode === 'duplicate' &&
        selectedTable
      ) {
        const duplicateTable = selectedTable

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

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(project?.ref, table.schema)),
          queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
        ])

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

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(project?.ref, table.schema)),
          queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
        ])

        ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Table ${table.name} is good to go!`,
        })

        onTableCreated(table)
      } else if (selectedTable) {
        toastId = ui.setNotification({
          category: 'loading',
          message: `Updating table: ${selectedTable?.name}...`,
        })

        const { table, hasError }: any = await meta.updateTable(
          toastId,
          selectedTable,
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
              sqlKeys.query(project?.ref, [selectedTable.schema, selectedTable.name])
            ),
            queryClient.invalidateQueries(
              sqlKeys.query(project?.ref, [
                'table-definition',
                selectedTable.schema,
                selectedTable.name,
              ])
            ),
            queryClient.invalidateQueries(entityTypeKeys.list(project?.ref)),
            queryClient.invalidateQueries(tableKeys.table(project?.ref, table.schema)),
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
      snap.closeSidePanel()
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
    snap.closeSidePanel()
  }

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosingPanel(true)
    } else {
      snap.closeSidePanel()
    }
  }

  return (
    <>
      {!isUndefined(selectedTable) && (
        <RowEditor
          row={snap.sidePanel?.type === 'row' ? snap.sidePanel.row : undefined}
          selectedTable={selectedTable}
          visible={snap.sidePanel?.type === 'row'}
          closePanel={onClosePanel}
          saveChanges={saveRow}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      {!isUndefined(selectedTable) && (
        <ColumnEditor
          column={
            snap.sidePanel?.type === 'column'
              ? (snap.sidePanel.column as PostgresColumn)
              : undefined
          }
          selectedTable={selectedTable}
          visible={snap.sidePanel?.type === 'column'}
          closePanel={onClosePanel}
          saveChanges={saveColumn}
          updateEditorDirty={() => setIsEdited(true)}
        />
      )}
      <TableEditor
        table={
          snap.sidePanel?.type === 'table' &&
          (snap.sidePanel.mode === 'edit' || snap.sidePanel.mode === 'duplicate')
            ? selectedTable
            : undefined
        }
        isDuplicating={snap.sidePanel?.type === 'table' && snap.sidePanel.mode === 'duplicate'}
        visible={snap.sidePanel?.type === 'table'}
        closePanel={onClosePanel}
        saveChanges={saveTable}
        updateEditorDirty={() => setIsEdited(true)}
      />
      <SchemaEditor
        visible={snap.sidePanel?.type === 'schema'}
        closePanel={onClosePanel}
        saveChanges={() => {}}
      />
      <JsonEdit
        visible={snap.sidePanel?.type === 'json'}
        column={(snap.sidePanel?.type === 'json' && snap.sidePanel.jsonValue.column) || ''}
        jsonString={(snap.sidePanel?.type === 'json' && snap.sidePanel.jsonValue.jsonString) || ''}
        backButtonLabel="Cancel"
        applyButtonLabel="Save changes"
        readOnly={!editable}
        closePanel={onClosePanel}
        onSaveJSON={onSaveJSON}
      />
      <ForeignRowSelector
        key={`foreign-row-selector-${
          (snap.sidePanel?.type === 'foreign-row-selector' &&
            snap.sidePanel.foreignKey.foreignKey.id) ||
          'null'
        }`}
        visible={snap.sidePanel?.type === 'foreign-row-selector'}
        foreignKey={
          snap.sidePanel?.type === 'foreign-row-selector'
            ? snap.sidePanel.foreignKey.foreignKey
            : undefined
        }
        closePanel={onClosePanel}
        onSelect={onSaveForeignRow}
      />
      <SpreadsheetImport
        visible={snap.sidePanel?.type === 'csv-import'}
        selectedTable={selectedTable}
        saveContent={onImportData}
        closePanel={onClosePanel}
        updateEditorDirty={setIsEdited}
      />
      <ConfirmationModal
        visible={isClosingPanel}
        header="Discard changes"
        buttonLabel="Discard"
        onSelectCancel={() => setIsClosingPanel(false)}
        onSelectConfirm={() => {
          setIsClosingPanel(false)
          setIsEdited(false)
          snap.closeSidePanel()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            There are unsaved changes. Are you sure you want to close the panel? Your changes will
            be lost.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default SidePanelEditor
