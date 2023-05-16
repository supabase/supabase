import { useState } from 'react'
import router from 'next/router'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import type { PostgresTable } from '@supabase/postgres-meta'

import { NextPageWithLayout } from 'types'
import { useStore, withAuth } from 'hooks'
import { Entity } from 'data/entity-types/entity-type-query'
import { TableEditorLayout } from 'components/layouts'
import { EmptyState, SidePanelEditor } from 'components/interfaces/TableGridEditor'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'

const TableEditorPage: NextPageWithLayout = () => {
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

  const onEditTable = (entity: Entity) => {
    setSidePanelKey('table')
    setIsDuplicating(false)

    const table = meta.tables.byId(entity.id)
    setSelectedTableToEdit(table)
  }

  const onDeleteTable = (entity: Entity) => {
    setIsDeleting(true)

    const table = meta.tables.byId(entity.id)
    setSelectedTableToDelete(table)
  }

  const onDuplicateTable = (entity: Entity) => {
    setSidePanelKey('table')
    setIsDuplicating(true)

    const table = meta.tables.byId(entity.id)
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
      await meta.views.loadBySchema(selectedSchema)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete!.name}`,
      })
    }
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
      <EmptyState selectedSchema={selectedSchema} onAddTable={onAddTable} />
      {/* On this page it'll only handle tables */}
      <ConfirmationModal
        danger
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        header={
          <span className="break-words">{`Confirm deletion of table "${selectedTableToDelete?.name}"`}</span>
        }
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
    </TableEditorLayout>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>{page}</ProjectContextFromParamsProvider>
)

export default withAuth(observer(TableEditorPage))
