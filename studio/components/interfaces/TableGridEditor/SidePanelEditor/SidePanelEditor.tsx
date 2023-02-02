import { FC, useState } from 'react'
import { find, isEmpty, isUndefined } from 'lodash'
import { Query, Dictionary } from 'components/grid'
import { Modal } from 'ui'
import type { PostgresRelationship, PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import { RowEditor, ColumnEditor, TableEditor } from '.'
import { ImportContent } from './TableEditor/TableEditor.types'
import { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import ConfirmationModal from 'components/ui/ConfirmationModal'

interface Props {
  selectedSchema: string
  selectedTable?: PostgresTable
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable
  sidePanelKey?: 'row' | 'column' | 'table'
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
  sidePanelKey,
  isDuplicating = false,
  closePanel,
  onRowCreated = () => {},
  onRowUpdated = () => {},
  onTableCreated = () => {},
  onColumnSaved = () => {},
}) => {
  const { meta, ui } = useStore()

  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const tables = meta.tables.list()

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number },
    onComplete: Function
  ) => {
    if (selectedTable === undefined) return

    let saveRowError = false
    // @ts-ignore
    const enumArrayColumns = selectedTable.columns
      .filter((column) => {
        return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
      })
      .map((column) => column.name)

    if (isNewRecord) {
      const insertQuery = new Query()
        .from(selectedTable.name, selectedTable.schema)
        .insert([payload], { returning: true, enumArrayColumns })
        .toSql()

      const res: any = await meta.query(insertQuery)
      if (res.error) {
        saveRowError = true
        ui.setNotification({ category: 'error', message: res.error?.message })
      } else {
        onRowCreated(res[0])
      }
    } else {
      const hasChanges = !isEmpty(payload)
      if (hasChanges) {
        if (selectedTable.primary_keys.length > 0) {
          const updateQuery = new Query()
            .from(selectedTable.name, selectedTable.schema)
            .update(payload, { returning: true, enumArrayColumns })
            .match(configuration.identifiers)
            .toSql()

          const res: any = await meta.query(updateQuery)
          if (res.error) {
            saveRowError = true
            ui.setNotification({ category: 'error', message: res.error?.message })
          } else {
            onRowUpdated(res[0], configuration.rowIdx)
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

  const saveColumn = async (
    payload: CreateColumnPayload | UpdateColumnPayload,
    foreignKey: Partial<PostgresRelationship> | undefined,
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
          tables={tables}
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
