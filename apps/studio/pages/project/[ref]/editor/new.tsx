import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import type { NextPageWithLayout } from 'types'

const EditorNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

EditorNewPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<TableEditorMenu />} product="Table Editor">
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default EditorNewPage
