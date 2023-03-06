import { FC, useState } from 'react'
import { find, isEmpty, isUndefined } from 'lodash'
import { Dictionary } from 'components/grid'
import { Modal } from 'ui'
import type { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import { useTableRowCreateMutation } from 'data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import { RowEditor, ColumnEditor, TableEditor } from '.'
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
import { useQueryClient } from '@tanstack/react-query'
import { sqlKeys } from 'data/sql/keys'

interface Props {
  selectedSchema: string
  selectedTable?: PostgresTable
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable
  selectedValueForJsonEdit?: JsonEditValue
  sidePanelKey?: 'row' | 'column' | 'table' | 'json'
  isDuplicating?: boolean
  closePanel: () => void
  onRowCreated?: (row: Dictionary<any>) => void
  onRowUpdated?: (row: Dictionary<any>, idx: number) => void

  // Because the panel is shared between grid editor and database pages
  // Both require different responses upon success of these events
  onTableCreated?: (table: PostgresTable) => void
  onColumnSaved?: (hasEncryptedColumns?: boolean) => void
}

const SidePanelEditor: FC<Props> = ({
  selectedSchema,
  selectedTable,
  selectedRowToEdit,
  selectedColumnToEdit,
  selectedTableToEdit,
  selectedValueForJsonEdit,
  sidePanelKey,
  isDuplicating = false,
  closePanel,
  onRowCreated = () => {},
  onRowUpdated = () => {},
  onTableCreated = () => {},
  onColumnSaved = () => {},
}) => {
  const { meta, ui } = useStore()
  const queryClient = useQueryClient()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const tables = meta.tables.list()

  const { project } = useProjectContext()
  const { mutateAsync: createTableRow } = useTableRowCreateMutation()
  const { mutateAsync: updateTableRow } = useTableRowUpdateMutation()

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
    // @ts-ignore
    const enumArrayColumns = selectedTable.columns
      .filter((column) => {
        return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
      })
      .map((column) => column.name)

    if (isNewRecord) {
      try {
        const result = await createTableRow({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable as any,
          payload,
          enumArrayColumns,
        })

        onRowCreated(result[0])
      } catch (error: any) {
        saveRowError = true
        ui.setNotification({ category: 'error', message: error?.message })
      }
    } else {
      const hasChanges = !isEmpty(payload)
      if (hasChanges) {
        if (selectedTable.primary_keys.length > 0) {
          if (selectedTable!.primary_keys.length > 0) {
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
              ui.setNotification({ category: 'error', message: error?.message })
            }
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
      await meta.tables.loadById(selectedTable!.id)
      queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreignKeyConstraints']))
      onColumnSaved(configuration.isEncrypted)
      setIsEdited(false)
      closePanel()
    }

    if (configuration.isEncrypted && selectedTable?.schema) {
      await meta.views.loadBySchema(selectedTable.schema)
    }

    resolve()
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
          ui.setNotification({
            id: toastId,
            category: 'success',
            message: `Successfully updated ${table.name}!`,
          })
        }
      }
      queryClient.invalidateQueries(sqlKeys.query(project?.ref, ['foreignKeyConstraints']))
    } catch (error: any) {
      saveTableError = true
      ui.setNotification({ id: toastId, category: 'error', message: error.message })
    }

    if (!saveTableError) {
      setIsEdited(false)
      closePanel()
    }

    resolve()
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
        children={
          <Modal.Content>
            <p className="py-4 text-sm text-scale-1100">
              There are unsaved changes. Are you sure you want to close the panel? Your changes will
              be lost.
            </p>
          </Modal.Content>
        }
      />
    </>
  )
}

export default SidePanelEditor
