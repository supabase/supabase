import { useParams } from 'common'
import EmptyState from 'components/interfaces/TableGridEditor/EmptyState'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { HandleEditorLayouts } from 'components/layouts/editors/handle-editor-layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  return (
    <>
      <EmptyState />
      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <HandleEditorLayouts>{page}</HandleEditorLayouts>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
