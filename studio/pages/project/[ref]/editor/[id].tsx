import { useEffect, useState, createContext, useContext, PropsWithChildren } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { isUndefined, isNaN } from 'lodash'
import { Dictionary } from '@supabase/grid'
import { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

import Base64 from 'lib/base64'
import { tryParseJson } from 'lib/helpers'
import { useStore } from 'hooks'
import { TableEditorLayout } from 'components/layouts'
import { TableGridEditor } from 'components/interfaces'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { Modal } from '@supabase/ui'
import { NextPageWithLayout } from 'types'

interface IPageLayoutContext {
  sidePanelKey: 'row' | 'column' | 'table' | undefined
  isDuplicating: boolean
  isDeleting: boolean
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>
  selectedSchema: string | undefined
  selectedTable: any
  selectedRowToEdit: Dictionary<any> | undefined
  selectedColumnToEdit: PostgresColumn | undefined
  selectedTableToEdit: PostgresTable | undefined
  selectedColumnToDelete: PostgresColumn | undefined
  selectedTableToDelete: PostgresTable | undefined
  onConfirmDeleteColumn: () => Promise<void>
  onAddRow: () => void
  onEditRow: (row: Dictionary<any>) => void
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
  onClosePanel: () => void
  onConfirmDeleteTable: () => Promise<void>
}

const PageLayoutContext = createContext<IPageLayoutContext>({
  sidePanelKey: undefined,
  isDuplicating: false,
  isDeleting: false,
  setIsDeleting: () => {},
  selectedSchema: undefined,
  selectedTable: undefined,
  selectedRowToEdit: undefined,
  selectedColumnToEdit: undefined,
  selectedTableToEdit: undefined,
  selectedColumnToDelete: undefined,
  selectedTableToDelete: undefined,
  onConfirmDeleteColumn: () => Promise.resolve(),
  onAddRow: () => {},
  onEditRow: () => {},
  onAddColumn: () => {},
  onEditColumn: () => {},
  onDeleteColumn: () => {},
  onClosePanel: () => {},
  onConfirmDeleteTable: () => Promise.resolve(),
})

const TableEditorPage: NextPageWithLayout = () => {
  const {
    sidePanelKey,
    isDuplicating,
    isDeleting,
    setIsDeleting,
    selectedSchema,
    selectedTable,
    selectedRowToEdit,
    selectedColumnToEdit,
    selectedTableToEdit,
    selectedColumnToDelete,
    selectedTableToDelete,
    onConfirmDeleteColumn,
    onAddRow,
    onEditRow,
    onAddColumn,
    onEditColumn,
    onDeleteColumn,
    onClosePanel,
    onConfirmDeleteTable,
  } = useContext(PageLayoutContext)

  return (
    <>
      <TableGridEditor
        selectedSchema={selectedSchema}
        selectedTable={selectedTable}
        sidePanelKey={sidePanelKey}
        isDuplicating={isDuplicating}
        selectedRowToEdit={selectedRowToEdit}
        selectedColumnToEdit={selectedColumnToEdit}
        selectedTableToEdit={selectedTableToEdit}
        onAddRow={onAddRow}
        onEditRow={onEditRow}
        onAddColumn={onAddColumn}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
        onClosePanel={onClosePanel}
      />
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedColumnToDelete)}
        header={`Confirm deletion of column "${selectedColumnToDelete?.name}"`}
        children={
          <Modal.Content>
            <p className="text-scale-1100 py-4 text-sm">
              Are you sure you want to delete the selected column? This action cannot be undone.
            </p>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteColumn}
      />
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        header={`Confirm deletion of table "${selectedTableToDelete?.name}"`}
        children={
          <Modal.Content>
            <p className="text-scale-1100 py-4 text-sm">
              Are you sure you want to delete the selected table? This action cannot be undone.
            </p>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteTable}
      />
    </>
  )
}

const PageLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const { id }: any = router.query

  const { meta, ui } = useStore()
  const [selectedSchema, setSelectedSchema] = useState<string>()

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [selectedColumnToDelete, setSelectedColumnToDelete] = useState<PostgresColumn>()
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<PostgresTable>()

  const [sidePanelKey, setSidePanelKey] = useState<'row' | 'column' | 'table'>()
  const [selectedRowToEdit, setSelectedRowToEdit] = useState<Dictionary<any>>()
  const [selectedColumnToEdit, setSelectedColumnToEdit] = useState<PostgresColumn>()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

  const projectRef = ui.selectedProject?.ref
  const tables: PostgresTable[] = meta.tables.list()
  const selectedTable = !isNaN(Number(id))
    ? // @ts-ignore
      tables.find((table) => table.id === Number(id))
    : tryParseJson(Base64.decode(id))

  useEffect(() => {
    if (selectedTable && 'schema' in selectedTable) {
      setSelectedSchema(selectedTable.schema)
    }
  }, [selectedTable?.name])

  const onAddRow = () => {
    setSidePanelKey('row')
    setSelectedRowToEdit(undefined)
  }

  const onEditRow = (row: Dictionary<any>) => {
    setSidePanelKey('row')
    setSelectedRowToEdit(row)
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

  const onAddTable = () => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(undefined)
  }

  const onEditTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(table)
  }

  const onDeleteTable = (table: PostgresTable) => {
    setIsDeleting(true)
    setSelectedTableToDelete(table)
  }

  const onDuplicateTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(true)
    setSelectedTableToEdit(table)
  }

  const onClosePanel = () => {
    setSidePanelKey(undefined)
  }

  const onConfirmDeleteColumn = async () => {
    try {
      const response: any = await meta.columns.del(selectedColumnToDelete!.id)
      if (response.error) throw response.error

      await meta.tables.loadById(selectedColumnToDelete!.table_id)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedColumnToDelete!.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedColumnToDelete(undefined)
    }
  }

  const onConfirmDeleteTable = async () => {
    try {
      if (isUndefined(selectedTableToDelete)) return

      const response: any = await meta.tables.del(selectedTableToDelete.id)
      if (response.error) throw response.error

      const tables = meta.tables.list((table: PostgresTable) => table.schema === selectedSchema)

      // For simplicity for now, we just open the first table within the same schema
      if (tables.length > 0) {
        router.push(`/project/${projectRef}/editor/${tables[0].id}`)
      } else {
        router.push(`/project/${projectRef}/editor/`)
      }
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted ${selectedTableToDelete.name}`,
      })
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete?.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedTableToDelete(undefined)
    }
  }

  const contextValue = {
    sidePanelKey,
    isDuplicating,
    isDeleting,
    setIsDeleting,
    selectedSchema,
    selectedTable,
    selectedRowToEdit,
    selectedColumnToEdit,
    selectedTableToEdit,
    selectedColumnToDelete,
    selectedTableToDelete,
    onConfirmDeleteColumn,
    onAddRow,
    onEditRow,
    onAddColumn,
    onEditColumn,
    onDeleteColumn,
    onClosePanel,
    onConfirmDeleteTable,
  }

  return (
    <TableEditorLayout
      selectedSchema={selectedSchema}
      onSelectSchema={setSelectedSchema}
      onAddTable={onAddTable}
      onEditTable={onEditTable}
      onDeleteTable={onDeleteTable}
      onDuplicateTable={onDuplicateTable}
    >
      <PageLayoutContext.Provider value={contextValue}>{children}</PageLayoutContext.Provider>
    </TableEditorLayout>
  )
}

TableEditorPage.getLayout = (page) => <PageLayout>{page}</PageLayout>

export default observer(TableEditorPage)
