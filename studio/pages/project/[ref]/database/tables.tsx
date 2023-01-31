import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { Modal } from 'ui'

import { useStore } from 'hooks'

import { DatabaseLayout } from 'components/layouts'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { TableList, ColumnList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { meta, ui } = useStore()

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [selectedSchema, setSelectedSchema] = useState('public')
  const [selectedTable, setSelectedTable] = useState<any>()
  const [sidePanelKey, setSidePanelKey] = useState<'column' | 'table'>()

  const [selectedColumnToEdit, setSelectedColumnToEdit] = useState<PostgresColumn>()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

  const [selectedColumnToDelete, setSelectedColumnToDelete] = useState<PostgresColumn>()
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<PostgresTable>()

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.types.load()
    }
  }, [ui.selectedProject?.ref])

  const onAddTable = () => {
    setSidePanelKey('table')
    setSelectedTableToEdit(undefined)
  }

  const onEditTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setSelectedTableToEdit(table)
  }

  const onDeleteTable = (table: PostgresTable) => {
    setIsDeleting(true)
    setSelectedTableToDelete(table)
  }

  const onAddColumn = () => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(undefined)
  }

  const onEditColumn = (column: PostgresColumn) => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(column)
  }

  const onDeleteColumn = (column: PostgresColumn) => {
    setIsDeleting(true)
    setSelectedColumnToDelete(column)
  }

  const onColumnUpdated = async () => {
    if (selectedTable === undefined) return

    const updatedTable = await meta.tables.loadById(selectedTable.id)
    setSelectedTable(updatedTable)
  }

  const onClosePanel = () => setSidePanelKey(undefined)

  const onConfirmDeleteTable = async () => {
    try {
      if (isUndefined(selectedTableToDelete)) return

      const response: any = await meta.tables.del(selectedTableToDelete.id)
      if (response.error) {
        throw response.error
      } else {
        ui.setNotification({
          category: 'success',
          message: `Successfully removed ${selectedTableToDelete.name}.`,
        })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete?.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedTableToDelete(undefined)
    }
  }

  const onConfirmDeleteColumn = async () => {
    try {
      if (isUndefined(selectedColumnToDelete)) return

      const response: any = await meta.columns.del(selectedColumnToDelete.id)
      if (response.error) {
        throw response.error
      } else {
        onColumnUpdated()
        ui.setNotification({
          category: 'success',
          message: `Successfully removed ${selectedColumnToDelete.name}.`,
        })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedColumnToDelete?.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedColumnToDelete(undefined)
    }
  }

  return (
    <>
      <div className="p-4">
        {isUndefined(selectedTable) ? (
          <TableList
            selectedSchema={selectedSchema}
            onSelectSchema={setSelectedSchema}
            onAddTable={onAddTable}
            onEditTable={onEditTable}
            onDeleteTable={onDeleteTable}
            onOpenTable={setSelectedTable}
          />
        ) : (
          <ColumnList
            selectedTable={selectedTable}
            onAddColumn={onAddColumn}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
            onSelectBack={() => setSelectedTable(undefined)}
          />
        )}
      </div>
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        header={
          <span className="break-words">{`Confirm deletion of table "${selectedTableToDelete?.name}"`}</span>
        }
        children={
          <Modal.Content>
            <p className="py-4 text-sm text-scale-1100">
              Are you sure you want to delete the selected table? This action cannot be undone.
            </p>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteTable}
      />
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedColumnToDelete)}
        header={`Confirm deletion of column "${selectedColumnToDelete?.name}"`}
        children={
          <Modal.Content>
            <p className="py-4 text-sm text-scale-1100">
              Are you sure you want to delete the selected column? This action cannot be undone.
            </p>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteColumn}
      />
      <SidePanelEditor
        sidePanelKey={sidePanelKey}
        selectedSchema={selectedSchema}
        selectedTable={selectedTable}
        onColumnSaved={onColumnUpdated}
        closePanel={onClosePanel}
        selectedColumnToEdit={selectedColumnToEdit}
        selectedTableToEdit={selectedTableToEdit}
      />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseTables)
