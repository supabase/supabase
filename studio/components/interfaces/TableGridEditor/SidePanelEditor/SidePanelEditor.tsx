import { FC, useState, useEffect } from 'react'
import { find, isUndefined } from 'lodash'
import { Query, Dictionary } from '@supabase/grid'
import { PostgresRelationship, PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

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
  onColumnSaved?: () => void
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

  const [enumTypes, setEnumTypes] = useState<any[]>([])
  const [isEdited, setIsEdited] = useState<boolean>(false)
  const [isClosingPanel, setIsClosingPanel] = useState<boolean>(false)

  const tables = meta.tables.list()

  useEffect(() => {
    let cancel = false
    const fetchEnumTypes = async () => {
      const enumTypes = await meta.schemas.getEnums()
      if (!cancel) setEnumTypes(enumTypes)
    }
    fetchEnumTypes()

    return () => {
      cancel = true
    }
  }, [])

  const saveRow = async (
    payload: any,
    isNewRecord: boolean,
    configuration: { identifiers: any; rowIdx: number },
    resolve: any
  ) => {
    let saveRowError = false
    if (isNewRecord) {
      const insertQuery = new Query()
        .from(selectedTable!.name, selectedTable!.schema)
        .insert([payload], { returning: true })
        .toSql()

      const res: any = await meta.query(insertQuery)
      if (res.error) {
        saveRowError = true
        ui.setNotification({ category: 'error', message: res.error?.message })
      } else {
        onRowCreated(res[0])
      }
    } else {
      if (selectedTable!.primary_keys.length > 0) {
        const updateQuery = new Query()
          .from(selectedTable!.name, selectedTable!.schema)
          .update(payload, { returning: true })
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

    resolve()
    if (!saveRowError) {
      setIsEdited(false)
      closePanel()
    }
  }

  const saveColumn = async (
    payload: CreateColumnPayload | UpdateColumnPayload,
    foreignKey: Partial<PostgresRelationship> | undefined,
    isNewRecord: boolean,
    configuration: { columnId?: string },
    resolve: any
  ) => {
    const response = isNewRecord
      ? await meta.createColumn(payload as CreateColumnPayload, foreignKey)
      : await meta.updateColumn(
          configuration.columnId as string,
          payload as UpdateColumnPayload,
          selectedTable as PostgresTable,
          foreignKey
        )

    if (response?.error) {
      ui.setNotification({ category: 'error', message: response.error.message })
    } else {
      await meta.tables.loadById(selectedTable!.id)
      onColumnSaved()
      setIsEdited(false)
      closePanel()
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
      isDuplicateRows: boolean
    },
    resolve: any
  ) => {
    let toastId
    let saveTableError = false
    const { tableId, importContent, isRLSEnabled, isDuplicateRows } = configuration

    try {
      if (isDuplicating) {
        const duplicateTable = find(tables, { id: tableId }) as PostgresTable
        toastId = ui.setNotification({
          category: 'loading',
          message: `Duplicating table: ${duplicateTable.name}...`,
        })
        const table: any = await meta.duplicateTable(payload, {
          isRLSEnabled,
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
        const table = await meta.createTable(toastId, payload, isRLSEnabled, columns, importContent)
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
        const table: any = await meta.updateTable(toastId, selectedTableToEdit, payload, columns)
        ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Successfully updated ${table.name}!`,
        })
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
          enumTypes={enumTypes}
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
        tables={tables}
        enumTypes={enumTypes}
        selectedSchema={selectedSchema}
        isDuplicating={isDuplicating}
        visible={sidePanelKey === 'table'}
        closePanel={onClosePanel}
        saveChanges={saveTable}
        updateEditorDirty={() => setIsEdited(true)}
      />
      <ConfirmationModal
        visible={isClosingPanel}
        title="Confirm to close"
        description="There are unsaved changes. Are you sure you want to close the panel? Your changes will be lost."
        buttonLabel="Confirm"
        onSelectCancel={() => setIsClosingPanel(false)}
        onSelectConfirm={() => {
          setIsClosingPanel(false)
          setIsEdited(false)
          closePanel()
        }}
      />
    </>
  )
}

export default SidePanelEditor
