import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DeleteConfirmationDialogs } from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { useCloseDeletedTableTab } from '@/components/interfaces/TableGridEditor/useCloseDeletedTableTab'
import { NewTab } from '@/components/layouts/Tabs/NewTab'

export const Route = createFileRoute('/project/$ref/editor/new')({
  component: EditorNewPage,
})

function EditorNewPage() {
  const navigate = useNavigate()
  const { closeDeletedTableTab } = useCloseDeletedTableTab()
  const { ref: projectRef } = Route.useParams()

  const onTableCreated = (table: { id: number }) => {
    void navigate({
      to: '/project/$ref/editor/$id',
      params: { ref: projectRef, id: String(table.id) },
    })
  }

  return (
    <>
      <NewTab />
      <SidePanelEditor onTableCreated={onTableCreated} />
      <DeleteConfirmationDialogs onTableDeleted={closeDeletedTableTab} />
    </>
  )
}
