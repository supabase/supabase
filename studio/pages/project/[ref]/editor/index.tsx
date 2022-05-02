import { useState, createContext, useContext, PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import { PostgresTable } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import { TableEditorLayout } from 'components/layouts'
import { EmptyState, SidePanelEditor } from 'components/interfaces/TableGridEditor'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import router from 'next/router'
import { NextPageWithLayout } from 'types'

interface IPageLayoutContext {
  projectRef: string | undefined
  selectedSchema: string
  isDeleting: boolean
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>
  selectedTableToDelete: PostgresTable | undefined
  isDuplicating: boolean
  selectedTableToEdit: PostgresTable | undefined
  sidePanelKey: 'row' | 'column' | 'table' | undefined
  onConfirmDeleteTable: () => Promise<void>
  onAddTable: () => void
  onClosePanel: () => void
}

const PageLayoutContext = createContext<IPageLayoutContext>({
  projectRef: undefined,
  selectedSchema: '',
  isDeleting: false,
  setIsDeleting: () => {},
  selectedTableToDelete: undefined,
  isDuplicating: false,
  selectedTableToEdit: undefined,
  sidePanelKey: undefined,
  onConfirmDeleteTable: () => Promise.resolve(),
  onAddTable: () => {},
  onClosePanel: () => {},
})

const Editor: NextPageWithLayout = () => {
  const {
    projectRef,
    selectedSchema,
    isDeleting,
    setIsDeleting,
    selectedTableToDelete,
    isDuplicating,
    selectedTableToEdit,
    sidePanelKey,
    onConfirmDeleteTable,
    onAddTable,
    onClosePanel,
  } = useContext(PageLayoutContext)

  return (
    <>
      <EmptyState selectedSchema={selectedSchema} onAddTable={onAddTable} />
      {/* On this page it'll only handle tables */}
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        header={`Confirm deletion of table "${selectedTableToDelete?.name}"`}
        description={`Are you sure you want to delete the selected table? This action cannot be undone`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleting(false)}
        onSelectConfirm={onConfirmDeleteTable}
      />
      <SidePanelEditor
        selectedSchema={selectedSchema}
        isDuplicating={isDuplicating}
        selectedTableToEdit={selectedTableToEdit}
        sidePanelKey={sidePanelKey}
        closePanel={onClosePanel}
        onTableCreated={(table: any) => router.push(`/project/${projectRef}/editor/${table.id}`)}
      />
    </>
  )
}

const PageLayout = ({ children }: PropsWithChildren<{}>) => {
  const { meta, ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const [sidePanelKey, setSidePanelKey] = useState<'row' | 'column' | 'table'>()
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<PostgresTable>()

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

  const onConfirmDeleteTable = async () => {
    try {
      await meta.tables.del(selectedTableToDelete!.id)
      setIsDeleting(false)
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted ${selectedTableToDelete!.name}`,
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete!.name}`,
      })
    }
  }

  const contextValue = {
    projectRef,
    selectedSchema,
    isDeleting,
    setIsDeleting,
    selectedTableToDelete,
    isDuplicating,
    selectedTableToEdit,
    sidePanelKey,
    onConfirmDeleteTable,
    onAddTable,
    onClosePanel,
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

Editor.getLayout = (page) => <PageLayout>{page}</PageLayout>

export default observer(Editor)
