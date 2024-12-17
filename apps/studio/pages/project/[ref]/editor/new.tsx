import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import type { NextPageWithLayout } from 'types'

const EditorNewPage: NextPageWithLayout = () => {
  return <NewTab />
}

EditorNewPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <ProjectLayoutWithAuth productMenu={<TableEditorMenu />} product="Table Editor">
        <EditorBaseLayout>
          <TableEditorLayout>
            <ProjectContextFromParamsProvider>{page}</ProjectContextFromParamsProvider>
          </TableEditorLayout>
        </EditorBaseLayout>
      </ProjectLayoutWithAuth>
    </DefaultLayout>
  </AppLayout>
)

export default EditorNewPage
